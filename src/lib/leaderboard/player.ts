import { createClient } from '@/lib/supabase/server'
import { classificationToGuild, GUILDS } from './guilds'
import { computeBadges, BADGES, type BadgeKey, EARLY_BIRD_COUNT } from './badges'

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
  secretsFound: number
  secretsTotal: number
  nextQuest: NextQuest
}

// Hard-coded for now — the actual secret achievements (Night Owl, Photo
// Finish, Full Party, Royal Approval per the Oct 12 brainstorm doc) land
// post-comms. The counter displays the teaser.
const SECRETS_TOTAL = 4

export async function getPlayerCardData(): Promise<PlayerCardData | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const email = (user.email ?? '').toLowerCase()

  // Profile (classification + name) + active event id in parallel.
  const [{ data: profile }, { data: event }] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name, full_name, classification, department_id')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('events').select('id').eq('is_active', true).maybeSingle(),
  ])

  if (!event) {
    return makeEmpty(profile, email, user.id)
  }

  // Fetch everything we need to compute badges + abstract count for this
  // user, scoped to the active event. Grab the EARLY_BIRD_COUNT earliest
  // submitted_at timestamps across the event for the Early-Bird test.
  const [
    { data: userAbstractRows },
    { data: earlyBirdRows },
    { data: certRow },
  ] = await Promise.all([
    supabase
      .from('submissions')
      .select(
        `id, status, classification, presenter_previous_rd_count,
         submitted_at,
         submission_authors!inner (
           profile_id, email, is_presenter
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
      .select('id')
      .eq('kind', 'ambassador')
      .not('verified_at', 'is', null)
      .or(`profile_id.eq.${user.id}${email ? `,email.eq.${email}` : ''}`)
      .limit(1)
      .maybeSingle(),
  ])

  const earliestIds = new Set((earlyBirdRows ?? []).map((r) => r.id as string))

  type AbstractRow = {
    id: string
    status: string
    classification: string | null
    presenter_previous_rd_count: number | null
    submitted_at: string | null
    submission_authors: Array<{
      profile_id: string | null
      email: string | null
      is_presenter: boolean
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

  // Union of badges earned across the user's abstracts. Then layer on the
  // "whole-person" badges that don't depend on a specific submission.
  const earned = new Set<BadgeKey>()
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
    hasCert: !!certRow,
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
    secretsFound: 0,
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
    secretsFound: 0,
    secretsTotal: SECRETS_TOTAL,
    nextQuest: null,
  }
}
