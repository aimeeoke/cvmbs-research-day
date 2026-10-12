// Badge computation helpers — pure logic, no DB access. The /leaderboard
// page's "Achievements unlocked" strip and the per-presenter badge chips
// both pull from these, but neither UI ships before the comms team signs
// off on the voice (Oct 12 / Nov 18 cadence per the committee doc).
//
// What's intentionally missing: Conversation Starter (feedback flow,
// Stage 3), Certified Judgy (reads judge_registrations), Green Ambassador
// (reads certifications). Those depend on tables with their own query
// patterns; this file sticks to badges derivable from `submissions` alone.

export type BadgeKey =
  | 'early_bird'
  | 'first_timer'
  | 'veteran_3'
  | 'veteran_5'
  | 'undergrad'

export const BADGES: Record<BadgeKey, { emoji: string; label: string; blurb: string }> = {
  early_bird:  { emoji: '🐣',  label: 'Early Bird',       blurb: 'Among the first 50 draft submissions.' },
  first_timer: { emoji: '✨',  label: 'First-Timer',      blurb: 'First time presenting at CVMBS Research Day.' },
  veteran_3:   { emoji: '🛡️', label: '3-Year Veteran',   blurb: 'Has presented at 3+ prior Research Days.' },
  veteran_5:   { emoji: '🏆',  label: '5-Year Veteran',   blurb: 'Has presented at 4+ prior Research Days.' },
  undergrad:   { emoji: '🎓',  label: 'Undergrad',        blurb: 'Undergraduate student presenting.' },
}

// How many of the earliest draft timestamps count as "Early Bird". Committee
// decision; may want to flip to config later.
export const EARLY_BIRD_COUNT = 50

export type BadgeInput = {
  classification: string | null
  presenterPreviousRdCount: number | null
  isAmongFirstN: boolean
}

/** Pure. Returns the set of badges earned for a single abstract. */
export function computeBadges(input: BadgeInput): Set<BadgeKey> {
  const badges = new Set<BadgeKey>()

  if (input.isAmongFirstN) badges.add('early_bird')

  if (input.presenterPreviousRdCount === 0) badges.add('first_timer')
  // 3-Year Veteran: count = 3. 5-Year Veteran: count = 4 (= "4 or more" per
  // the form picker). The committee doc also mentions a plain Veteran tier;
  // we're using 3+ and 5+ as the two visible tiers.
  if (input.presenterPreviousRdCount !== null && input.presenterPreviousRdCount >= 3)
    badges.add('veteran_3')
  if (input.presenterPreviousRdCount !== null && input.presenterPreviousRdCount >= 4)
    badges.add('veteran_5')

  if (input.classification === 'Undergraduate Student') badges.add('undergrad')

  return badges
}

/**
 * Returns a map of submission-id → badges, for every submission on the
 * active event. Computes Early Bird by taking the N earliest non-null
 * submitted_at timestamps across the event.
 *
 * Shaped as a function so the Nov 18 UI can call it in one request and
 * decorate every presenter name on the page. Not called by anyone yet.
 */
export async function getBadgesForEventSubmissions(
  rows: Array<{
    id: string
    classification: string | null
    presenter_previous_rd_count: number | null
    submitted_at: string | null
    status: string
  }>
): Promise<Record<string, Set<BadgeKey>>> {
  const earliestIds = new Set(
    rows
      .filter((r) => r.status !== 'withdrawn' && r.submitted_at)
      .sort((a, b) => (a.submitted_at! < b.submitted_at! ? -1 : 1))
      .slice(0, EARLY_BIRD_COUNT)
      .map((r) => r.id)
  )

  const out: Record<string, Set<BadgeKey>> = {}
  for (const r of rows) {
    out[r.id] = computeBadges({
      classification: r.classification,
      presenterPreviousRdCount: r.presenter_previous_rd_count,
      isAmongFirstN: earliestIds.has(r.id),
    })
  }
  return out
}
