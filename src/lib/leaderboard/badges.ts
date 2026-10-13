// Badge computation helpers — pure logic, no DB access. The /leaderboard
// page's "Achievements unlocked" strip and the per-presenter badge chips
// both pull from these, but neither UI ships before the comms team signs
// off on the voice (Oct 12 / Nov 18 cadence per the committee doc).
//
// What's intentionally missing: Conversation Starter (feedback flow,
// Stage 3), Certified Judgy (reads judge_registrations), Green Ambassador
// (reads certifications). Those depend on tables with their own query
// patterns; this file sticks to badges derivable from `submissions` alone.
//
// Secret badges live at the bottom of this file. They're intentionally
// shaped the same way as visible badges (pure compute + descriptor map)
// so the player card can show a filled tile the moment one triggers.
// Kept hidden in the UI until found — that's the whole point.

import { richTextToPlainText } from '../rich-text'

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


// ============================================================================
// SECRET BADGES — hidden until earned (Oct 12 brainstorm doc)
// ============================================================================

export type SecretBadgeKey =
  | 'night_owl'
  | 'photo_finish'
  | 'full_party'
  | 'royal_approval'

export const SECRET_BADGES: Record<
  SecretBadgeKey,
  { emoji: string; label: string; blurb: string }
> = {
  night_owl: {
    emoji: '🦉',
    label: 'Night Owl',
    blurb: 'Submitted between midnight and 4 AM Mountain Time.',
  },
  photo_finish: {
    emoji: '🏁',
    label: 'Photo Finish',
    blurb: 'Submitted in the final hour before the deadline.',
  },
  full_party: {
    emoji: '🎉',
    label: 'Full Party',
    blurb: 'Rolled up with the maximum three mentors on your abstract.',
  },
  royal_approval: {
    emoji: '👑',
    label: 'Royal Approval',
    blurb: 'Your abstract passed the cat test. 🐈',
  },
}

/** How many mentor rows constitutes a "full party". Matches the submit form's three mentor slots. */
export const FULL_PARTY_MENTOR_COUNT = 3

/** Minutes-before-deadline window that counts as a Photo Finish. */
export const PHOTO_FINISH_WINDOW_MINUTES = 60

/**
 * Terms that trigger Royal Approval. Word-boundary matched case-insensitive
 * so "cattle"/"catalog"/"category" don't false-positive. "Feline" plural and
 * the taxonomic root "Felis" cover the common ways research prose mentions cats.
 */
const ROYAL_APPROVAL_PATTERN = /\b(cats?|feline|felines|felis)\b/i

export type SecretBadgeInput = {
  submittedAt: string | null
  submissionClosesAt: string | null
  mentorCount: number
  titleHtml: string | null
  abstractHtml: string | null
}

/** Pure. Returns the set of secret badges a single abstract has triggered. */
export function computeSecretBadges(input: SecretBadgeInput): Set<SecretBadgeKey> {
  const secrets = new Set<SecretBadgeKey>()

  if (input.submittedAt) {
    const submitted = new Date(input.submittedAt)
    if (!Number.isNaN(submitted.getTime())) {
      // Night Owl — hour-of-day in America/Denver, 0 ≤ h < 4.
      // hourCycle: 'h23' guarantees "0"–"23" (no "24" or AM/PM quirks).
      const mtHour = Number(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Denver',
          hour: 'numeric',
          hourCycle: 'h23',
        }).format(submitted)
      )
      if (!Number.isNaN(mtHour) && mtHour >= 0 && mtHour < 4) {
        secrets.add('night_owl')
      }

      // Photo Finish — within the final PHOTO_FINISH_WINDOW_MINUTES before
      // the deadline. Only meaningful if we know the deadline.
      if (input.submissionClosesAt) {
        const deadline = new Date(input.submissionClosesAt)
        if (!Number.isNaN(deadline.getTime())) {
          const diffMinutes = (deadline.getTime() - submitted.getTime()) / 60000
          if (diffMinutes >= 0 && diffMinutes <= PHOTO_FINISH_WINDOW_MINUTES) {
            secrets.add('photo_finish')
          }
        }
      }
    }
  }

  if (input.mentorCount >= FULL_PARTY_MENTOR_COUNT) {
    secrets.add('full_party')
  }

  const haystack = `${richTextToPlainText(input.titleHtml)} ${richTextToPlainText(input.abstractHtml)}`
  if (ROYAL_APPROVAL_PATTERN.test(haystack)) {
    secrets.add('royal_approval')
  }

  return secrets
}

/** Total count — the player card teaser reads from this so a new secret can't drift out of sync. */
export const SECRETS_TOTAL = Object.keys(SECRET_BADGES).length
