// Server-side data loader for the /achievements page.
//
// Does the following, cached per request:
//   1. Resolves which event is active.
//   2. Pulls the user's own abstracts (as presenter / submitter / mentor /
//      coauthor) along with each one's authors.
//   3. Pulls EVERY non-withdrawn abstract on the event — just id/title/
//      abstract/submitted_at — to compute (a) the First Blood holder,
//      (b) the set of secrets that have been unlocked by ANY abstract.
//   4. Loads badge_overrides for the user's own abstracts.
//   5. Computes the user's earned set, applies grants + revokes.
//   6. Adds attendance badges from the user-as-presenter row's
//      presenter_previous_rd_count.
//   7. Adds green_ambassador from the certifications table.
//   8. Adds certified_judgy from an active judge_registrations row.
//
// Returned data feeds the page shell + the catalog grid.

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { nameMatchKey } from '@/lib/name-match'
import {
  computeAchievementsForAbstract,
  computeAttendanceAchievements,
  EARLY_BIRD_COUNT,
} from './achievements'
import type { AchievementKey } from './achievements-catalog'

export type AchievementsPageData = {
  signedIn: boolean
  isPresenter: boolean
  displayName: string
  /** Keys the user has earned (after overrides). */
  earned: Set<AchievementKey>
  /** Keys any abstract on the event has triggered — drives secret-tile reveal. */
  unlockedAnywhere: Set<AchievementKey>
  /** Display name of whoever currently holds First Blood on the event, if any. */
  firstBloodHolder: string | null
  /** Count of the user's own non-withdrawn abstracts on the event. */
  abstractCount: number
}

export const getAchievementsPageData = cache(
  async (): Promise<AchievementsPageData | null> => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const email = (user.email ?? '').toLowerCase()

    const [{ data: profile }, { data: event }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, first_name, last_name, full_name')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('events')
        .select('id, submission_closes_at')
        .eq('is_active', true)
        .maybeSingle(),
    ])

    if (!event) {
      return {
        signedIn: true,
        isPresenter: false,
        displayName: pickName(profile, email),
        earned: new Set(),
        unlockedAnywhere: new Set(),
        firstBloodHolder: null,
        abstractCount: 0,
      }
    }

    // Which submissions the signed-in user is on. Two queries to avoid the
    // PostgREST limitation where filtering across a joined relation requires
    // !inner, which would then also filter the author rows we need for the
    // Full Party / Co-op Mode / etc. counts. Instead: find ids first, then
    // fetch full data for them.
    const orClauseAuthors = email
      ? `profile_id.eq.${user.id},email.eq.${email}`
      : `profile_id.eq.${user.id}`

    const [{ data: authorIdRows }, { data: submitterIdRows }] = await Promise.all([
      supabase
        .from('submission_authors')
        .select('submission_id, submissions!inner(event_id, status)')
        .or(orClauseAuthors)
        .eq('submissions.event_id', event.id)
        .neq('submissions.status', 'withdrawn'),
      supabase
        .from('submissions')
        .select('id')
        .eq('event_id', event.id)
        .eq('submitter_id', user.id)
        .neq('status', 'withdrawn'),
    ])

    const userAbstractIdSet = new Set<string>()
    for (const r of (authorIdRows ?? []) as Array<{ submission_id: string }>) {
      userAbstractIdSet.add(r.submission_id)
    }
    for (const r of (submitterIdRows ?? []) as Array<{ id: string }>) {
      userAbstractIdSet.add(r.id)
    }
    const userAbstractIds = Array.from(userAbstractIdSet)

    const [
      { data: userAbstractRows },
      { data: allEventAbstractRows },
      { data: earlyBirdRows },
      { data: ambassadorRows },
      { data: judgeRows },
    ] = await Promise.all([
      userAbstractIds.length > 0
        ? supabase
            .from('submissions')
            .select(
              `id, status, classification, presenter_previous_rd_count,
               submitted_at, title, abstract, funding, affiliations,
               submission_authors (
                 profile_id, email, is_presenter, is_mentor
               )`
            )
            .in('id', userAbstractIds)
        : Promise.resolve({ data: [] as unknown[] }),
      // Everyone's abstracts, trimmed: titles/abstracts for keyword matching
      // and submitter_id for the First Blood presenter lookup.
      supabase
        .from('submissions')
        .select(
          'id, status, submitted_at, title, abstract, funding, affiliations'
        )
        .eq('event_id', event.id)
        .neq('status', 'withdrawn'),
      // Early Bird: the EARLY_BIRD_COUNT earliest submitted_at values on
      // the event.
      supabase
        .from('submissions')
        .select('id, submitted_at')
        .eq('event_id', event.id)
        .not('submitted_at', 'is', null)
        .neq('status', 'withdrawn')
        .order('submitted_at', { ascending: true })
        .limit(EARLY_BIRD_COUNT),
      // Ambassador certs — matched on profile_id, email, or name key.
      // (Same pattern as player.ts.)
      supabase
        .from('certifications')
        .select('profile_id, email, first_name, last_name')
        .eq('kind', 'ambassador')
        .not('verified_at', 'is', null),
      // Judge registration — active (not cancelled) on the active event.
      supabase
        .from('judge_registrations')
        .select('id, cancelled_at')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .is('cancelled_at', null)
        .limit(1),
    ])

    type AuthorRow = {
      profile_id: string | null
      email: string | null
      is_presenter: boolean
      is_mentor: boolean
    }
    type UserAbstractRow = {
      id: string
      status: string
      classification: string | null
      presenter_previous_rd_count: number | null
      submitted_at: string | null
      title: string | null
      abstract: string | null
      funding: string | null
      affiliations: string[] | null
      submission_authors: AuthorRow[]
    }
    type EventAbstractRow = {
      id: string
      status: string
      submitted_at: string | null
      title: string | null
      abstract: string | null
      funding: string | null
      affiliations: string[] | null
    }

    const userAbstracts = (userAbstractRows ?? []) as unknown as UserAbstractRow[]
    const allAbstracts = (allEventAbstractRows ?? []) as unknown as EventAbstractRow[]

    // Dedupe user abstracts (the OR query across joined author rows can
    // repeat the same submission).
    const seen = new Set<string>()
    const uniqueUserAbstracts: UserAbstractRow[] = []
    for (const a of userAbstracts) {
      if (seen.has(a.id)) continue
      seen.add(a.id)
      uniqueUserAbstracts.push(a)
    }

    const earliestIds = new Set((earlyBirdRows ?? []).map((r) => r.id as string))

    // First Blood: the single abstract with the earliest submitted_at on the
    // event (non-withdrawn). Tie-breaker: alphabetical by id so it's stable.
    let firstBloodId: string | null = null
    let firstBloodTs: string | null = null
    for (const a of allAbstracts) {
      if (!a.submitted_at) continue
      if (firstBloodTs === null || a.submitted_at < firstBloodTs) {
        firstBloodTs = a.submitted_at
        firstBloodId = a.id
      }
    }

    // --- Compute per-abstract achievements ----------------------------------
    const earned = new Set<AchievementKey>()
    for (const a of uniqueUserAbstracts) {
      const authors = a.submission_authors ?? []
      const authorCount = authors.length
      const mentorCount = authors.filter((au) => au.is_mentor).length

      const perAbstract = computeAchievementsForAbstract({
        id: a.id,
        submittedAt: a.submitted_at,
        submissionClosesAt: event.submission_closes_at ?? null,
        isAmongFirstN: earliestIds.has(a.id),
        isFirstBlood: a.id === firstBloodId,
        authorCount,
        mentorCount,
        titleHtml: a.title,
        abstractHtml: a.abstract,
        affiliations: a.affiliations ?? [],
        funding: a.funding,
      })
      for (const k of perAbstract) earned.add(k)
    }

    // Attendance: use whichever of the user's abstracts has them as presenter.
    for (const a of uniqueUserAbstracts) {
      const amPresenter = authorMatches(a.submission_authors, user.id, email, true)
      if (!amPresenter) continue
      const att = computeAttendanceAchievements({
        presenterPreviousRdCount: a.presenter_previous_rd_count,
      })
      for (const k of att) earned.add(k)
      break
    }

    // Green Ambassador — cert matched on profile_id / email / name key.
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
    if (hasCert) earned.add('green_ambassador')

    // Certified Judgy — any active (not cancelled) registration on the event.
    if ((judgeRows ?? []).length > 0) earned.add('certified_judgy')

    // --- Apply overrides on the user's own abstracts -----------------------
    if (userAbstractIds.length > 0) {
      const { data: overrideRows } = await supabase
        .from('badge_overrides')
        .select('submission_id, badge_key, action')
        .in('submission_id', userAbstractIds)
      for (const row of (overrideRows ?? []) as Array<{
        submission_id: string
        badge_key: string
        action: 'grant' | 'revoke'
      }>) {
        const key = row.badge_key as AchievementKey
        if (row.action === 'grant') earned.add(key)
        else if (row.action === 'revoke') earned.delete(key)
      }
    }

    // --- Unlocked-anywhere compute for the catalog view --------------------
    // Run compute across every non-withdrawn abstract on the event. We only
    // care about which KEYS have fired at least once, so the author/affiliation
    // meta badges are included too — First Blood/Early Bird excluded because
    // they're singletons that would always show if any submission exists.
    const unlockedAnywhere = new Set<AchievementKey>()
    for (const a of allAbstracts) {
      const perAbstract = computeAchievementsForAbstract({
        id: a.id,
        submittedAt: a.submitted_at,
        submissionClosesAt: event.submission_closes_at ?? null,
        isAmongFirstN: false,
        isFirstBlood: false,
        authorCount: 0,
        mentorCount: 0,
        titleHtml: a.title,
        abstractHtml: a.abstract,
        affiliations: a.affiliations ?? [],
        funding: a.funding,
      })
      for (const k of perAbstract) unlockedAnywhere.add(k)
    }

    // First Blood holder name — only used for a tiny flavor line on the page.
    let firstBloodHolder: string | null = null
    if (firstBloodId) {
      const { data: firstPresenter } = await supabase
        .from('submission_authors')
        .select('display_name')
        .eq('submission_id', firstBloodId)
        .eq('is_presenter', true)
        .maybeSingle()
      firstBloodHolder = firstPresenter?.display_name ?? null
    }

    const amPresenterOnAny = uniqueUserAbstracts.some((a) =>
      authorMatches(a.submission_authors, user.id, email, true)
    )

    return {
      signedIn: true,
      isPresenter: amPresenterOnAny,
      displayName: pickName(profile, email),
      earned,
      unlockedAnywhere,
      firstBloodHolder,
      abstractCount: uniqueUserAbstracts.length,
    }
  }
)

function authorMatches(
  authors: Array<{
    profile_id: string | null
    email: string | null
    is_presenter: boolean
  }>,
  userId: string,
  email: string,
  presenterOnly: boolean
): boolean {
  return authors.some(
    (a) =>
      (!presenterOnly || a.is_presenter) &&
      (a.profile_id === userId ||
        (a.email ? a.email.toLowerCase() === email : false))
  )
}

type ProfileRow = {
  first_name: string | null
  last_name: string | null
  full_name: string | null
} | null

function pickName(p: ProfileRow, email: string): string {
  if (p?.full_name) return p.full_name
  if (p?.first_name || p?.last_name)
    return [p.first_name, p.last_name].filter(Boolean).join(' ')
  return email.split('@')[0] || 'Crawler'
}
