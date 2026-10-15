import { createClient } from '@/lib/supabase/server'
import { nameMatchKey } from '@/lib/name-match'
import { classificationToGuild, GUILDS } from './guilds'
import {
  computeBadges,
  computeSecretBadges,
  BADGES,
  SECRETS_TOTAL,
  type BadgeKey,
  type SecretBadgeKey,
  EARLY_BIRD_COUNT,
} from './badges'

// Shape passed to the <PlayerCard /> component. Null when nobody is signed
// in (the page renders the public shell instead).

export type NextQuest = {
  title: string
  reward: string
  href: string
} | null

export type PlayerCardData = {
  displayName: string
  initials: string
  guildKey: ReturnType<typeof classificationToGuild>
  guildLabel: string | null
  abstractCount: number
  earnedBadges: BadgeKey[]
  visibleBadgesTotal: number
  earnedSecrets: SecretBadgeKey[]
  secretsFound: number
  secretsTotal: number
  nextQuest: NextQuest
}

export async function getPlayerCardData(): Promise<PlayerCardData | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const email = (user.email ?? '').toLowerCase()

  // Profile (classification + name) + active event (incl. submission deadline
  // for Photo Finish) in parallel.
  const [{ data: profile }, { data: event }] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name, full_name, classification, department_id')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('events')
      .select('id, submission_closes_at')
      .eq('is_active', true)
      .maybeSingle(),
  ])

  if (!event) {
    return makeEmpty(profile, email, user.id)
  }

  // Fetch everything we need to compute badges + abstract count for this
  // user, scoped to the active event. Grab the EARLY_BIRD_COUNT earliest
  // submitted_at timestamps across the event for the Early-Bird test.
  //
  // Cert lookup is email-blind on purpose: the preloaded MGL CSV ships
  // name only (no email), and CSU users have 2–3 email aliases apiece
  // (first.last, legacy ename, personal). So we pull every verified
  // ambassador cert and match on profile_id / email / name key.
  const [
    { data: userAbstractRows },
    { data: earlyBirdRows },
    { data: ambassadorRows },
  ] = await Promise.all([
    supabase
      .from('submissions')
      .select(
        `id, status, classification, presenter_previous_rd_count,
         submitted_at, title, abstract,
         submission_authors!inner (
           profile_id, email, is_presenter, is_mentor
         )`
      )
      .eq('event_id', event.id)
      .or(
        `submitter_id.eq.${user.id},submission_authors.profile_id.eq.${user.id}` +
          (email ? `,submission_authors.email.eq.${email}` : '')
      ),
    supabase
      .from('submissions')
      .select('id, submitted_at')
      .eq('event_id', event.id)
      .not('submitted_at', 'is', null)
      .neq('status', 'withdrawn')
      .order('submitted_at', { ascending: true })
      .limit(EARLY_BIRD_COUNT),
    supabase
      .from('certifications')
      .select('profile_id, email, first_name, last_name')
      .eq('kind', 'ambassador')
      .not('verified_at', 'is', null),
  ])

  const userKey = nameMatchKey(profile?.first_name, profile?.last_name)
  const hasCert = (ambassadorRows ?? []).some((row) => {
    const r = row as {
      profile_id: string | null
      email: string | null
      first_name: string | null
      last_name: string | null
    }
    if (r.profile_id && r.profile_id === user.id) return true
    if (email && r.email && r.email.toLowerCase() === email) return true
    if (userKey && nameMatchKey(r.first_name, r.last_name) === userKey) return true
    return false
  })

  const earliestIds = new Set((earlyBirdRows ?? []).map((r) => r.id as string))

  type AbstractRow = {
    id: string
    status: string
    classification: string | null
    presenter_previous_rd_count: number | null
    submitted_at: string | null
    title: string | null
    abstract: string | null
    submission_authors: Array<{
      profile_id: string | null
      email: string | null
      is_presenter: boolean
      is_mentor: boolean
    }>
  }
  const abstracts = (userAbstractRows ?? []) as unknown as AbstractRow[]

  // Dedupe by submission id (OR query across joined table can repeat).
  const seen = new Set<string>()
  const unique: AbstractRow[] = []
  for (const a of abstracts) {
    if (!seen.has(a.id)) {
      seen.add(a.id)
      unique.push(a)
    }
  }

  // Mentor counts for the Full Party secret: the `!inner` join above filters
  // submission_authors to the row(s) matching THIS user, so we can't count
  // mentors from it. Second pass pulls the full author list for just the user's
  // abstract ids.
  const activeIds = unique.filter((a) => a.status !== 'withdrawn').map((a) => a.id)
  const mentorCountById = new Map<string, number>()
  if (activeIds.length > 0) {
    const { data: mentorRows } = await supabase
      .from('submission_authors')
      .select('submission_id, is_mentor')
      .in('submission_id', activeIds)
      .eq('is_mentor', true)
    for (const r of (mentorRows ?? []) as Array<{ submission_id: string }>) {
      mentorCountById.set(r.submission_id, (mentorCountById.get(r.submission_id) ?? 0) + 1)
    }
  }

  // Union of badges earned across the user's abstracts. Then layer on the
  // "whole-person" badges that don't depend on a specific submission.
  const earned = new Set<BadgeKey>()
  const earnedSecrets = new Set<SecretBadgeKey>()
  for (const a of unique) {
    if (a.status === 'withdrawn') continue
    // The user may be an author or a mentor on this abstract, not the
    // presenter — Early Bird is per-abstract so attributes any way, but
    // First-Timer / Veteran only make sense when they're the presenter.
    const isThePresenter = a.submission_authors.some(
      (sa) =>
        sa.is_presenter &&
        (sa.profile_id === user.id ||
          (sa.email && sa.email.toLowerCase() === email))
    )
    const badges = computeBadges({
      classification: isThePresenter ? a.classification : null,
      presenterPreviousRdCount: isThePresenter ? a.presenter_previous_rd_count : null,
      isAmongFirstN: earliestIds.has(a.id),
    })
    for (const b of badges) earned.add(b)

    // Secrets attach to any abstract the user is on, same as Early Bird.
    const secrets = computeSecretBadges({
      submittedAt: a.submitted_at,
      submissionClosesAt: event.submission_closes_at ?? null,
      mentorCount: mentorCountById.get(a.id) ?? 0,
      titleHtml: a.title,
      abstractHtml: a.abstract,
    })
    for (const s of secrets) earnedSecrets.add(s)
  }

  // Undergrad badge from profile classification (even if they haven't
  // submitted yet — the badge means "undergrad presenting" which is the
  // identity, not a per-abstract thing).
  if (profile?.classification === 'Undergraduate Student') earned.add('undergrad')

  // Green Ambassador — stored on the certifications table.
  // Note: this is a Phase-2 badge key we haven't modeled yet in badges.ts;
  // the counter below treats it like an extra visible slot.

  const visibleBadgesTotal = Object.keys(BADGES).length // currently 5
  const nextQuest = pickNextQuest({
    hasCert,
    abstractCount: unique.filter((a) => a.status !== 'withdrawn').length,
    deptId: profile?.department_id ?? null,
  })

  return {
    displayName: pickName(profile, email),
    initials: pickInitials(profile, email),
    guildKey: classificationToGuild(profile?.classification ?? null),
    guildLabel:
      GUILDS.find((g) => g.key === classificationToGuild(profile?.classification ?? null))
        ?.label ?? null,
    abstractCount: unique.filter((a) => a.status !== 'withdrawn').length,
    earnedBadges: Array.from(earned),
    visibleBadgesTotal,
    earnedSecrets: Array.from(earnedSecrets),
    secretsFound: earnedSecrets.size,
    secretsTotal: SECRETS_TOTAL,
    nextQuest,
  }
}

function pickNextQuest({
  hasCert,
  abstractCount,
  deptId,
}: {
  hasCert: boolean
  abstractCount: number
  deptId: string | null
}): NextQuest {
  if (!hasCert) {
    return {
      title: 'Upload Green Lab certificate',
      reward: `+10 points for your department${deptId ? '' : ''}`,
      href: 'https://mygreenlab.org/programs/ambassador-program/',
    }
  }
  if (abstractCount === 0) {
    return {
      title: 'Submit your first abstract',
      reward: 'Join the Guild Showdown',
      href: '/abstracts',
    }
  }
  return {
    title: 'Volunteer to judge',
    reward: 'Earn Certified Judgy for your department',
    href: '/judge',
  }
}

type ProfileRow = {
  first_name: string | null
  last_name: string | null
  full_name: string | null
  classification: string | null
  department_id: string | null
} | null

function pickName(p: ProfileRow, email: string): string {
  if (p?.full_name) return p.full_name
  if (p?.first_name || p?.last_name)
    return [p.first_name, p.last_name].filter(Boolean).join(' ')
  return email.split('@')[0] || 'Crawler'
}

function pickInitials(p: ProfileRow, email: string): string {
  const first = (p?.first_name ?? '').trim()
  const last = (p?.last_name ?? '').trim()
  if (first || last) return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?'
  const alias = email.split('@')[0] ?? ''
  return alias.slice(0, 2).toUpperCase() || '?'
}

function makeEmpty(p: ProfileRow, email: string, _userId: string): PlayerCardData {
  return {
    displayName: pickName(p, email),
    initials: pickInitials(p, email),
    guildKey: classificationToGuild(p?.classification ?? null),
    guildLabel:
      GUILDS.find((g) => g.key === classificationToGuild(p?.classification ?? null))
        ?.label ?? null,
    abstractCount: 0,
    earnedBadges: [],
    visibleBadgesTotal: Object.keys(BADGES).length,
    earnedSecrets: [],
    secretsFound: 0,
    secretsTotal: SECRETS_TOTAL,
    nextQuest: null,
  }
}
