/* eslint-disable no-console */
// Lightweight self-contained test harness for computeSecretBadges.
// Run with: npm run test:secret-badges
//
// Covers each of the four secrets with a positive + negative case, plus the
// edge cases that would bite us in production (timezone wrap for Night Owl,
// null-submitted-at for drafts, title-only vs body-only Royal Approval, and
// false-positive words like "cattle").

import {
  computeSecretBadges,
  type SecretBadgeInput,
  type SecretBadgeKey,
} from '../src/lib/leaderboard/badges.ts'

let passed = 0
let failed = 0

function expectSecrets(name: string, input: SecretBadgeInput, expected: SecretBadgeKey[]) {
  const actual = Array.from(computeSecretBadges(input)).sort()
  const want = [...expected].sort()
  const ok = JSON.stringify(actual) === JSON.stringify(want)
  if (ok) {
    console.log(`✓ ${name}`)
    passed++
  } else {
    console.error(`✗ ${name}`)
    console.error(`  expected: ${JSON.stringify(want)}`)
    console.error(`  actual:   ${JSON.stringify(actual)}`)
    failed++
  }
}

// Shared "boring" baseline — all four secrets should be inert so that each
// test can flip exactly one factor and prove it in isolation.
const BORING: SecretBadgeInput = {
  submittedAt: '2026-11-05T20:00:00.000Z', // 1 PM Mountain
  submissionClosesAt: '2026-11-16T06:59:00.000Z', // Nov 16, 11:59 PM MST
  mentorCount: 1,
  titleHtml: '<p>A study of mouse brains</p>',
  abstractHtml: '<p>We looked at mice. They are small.</p>',
}

expectSecrets('baseline — nothing earned', BORING, [])

// -------------------- NIGHT OWL --------------------

// 2:30 AM Mountain on Nov 5 2026 = 09:30 UTC (MST = UTC-7, no DST on this date).
expectSecrets(
  'night_owl: 2:30 AM MT',
  { ...BORING, submittedAt: '2026-11-05T09:30:00.000Z' },
  ['night_owl']
)

// 12:01 AM Mountain — inclusive lower bound.
expectSecrets(
  'night_owl: 12:01 AM MT (inclusive lower bound)',
  { ...BORING, submittedAt: '2026-11-05T07:01:00.000Z' },
  ['night_owl']
)

// 3:59 AM Mountain — still under 4.
expectSecrets(
  'night_owl: 3:59 AM MT (still inside window)',
  { ...BORING, submittedAt: '2026-11-05T10:59:00.000Z' },
  ['night_owl']
)

// 4:00 AM Mountain — exclusive upper bound; no badge.
expectSecrets(
  'night_owl: 4:00 AM MT (just outside window)',
  { ...BORING, submittedAt: '2026-11-05T11:00:00.000Z' },
  []
)

// 11:59 PM Mountain — not in window.
expectSecrets(
  'night_owl: 11:59 PM MT',
  { ...BORING, submittedAt: '2026-11-06T06:59:00.000Z' },
  []
)

// DST sanity: during MDT (UTC-6), 2 AM MDT = 08:00 UTC. If we were naively
// treating the ISO string as MST year-round we'd compute 1 AM and still pass
// — so use a case where the MDT→MST difference matters at the 4-AM boundary:
// 4:30 AM MDT = 10:30 UTC. If misread as MST that's 3:30 AM → false positive.
expectSecrets(
  'night_owl: 4:30 AM MDT during DST (should NOT fire)',
  { ...BORING, submittedAt: '2026-07-15T10:30:00.000Z' },
  []
)

// -------------------- PHOTO FINISH --------------------

// Submitted 30 minutes before close.
expectSecrets(
  'photo_finish: 30 min before deadline',
  { ...BORING, submittedAt: '2026-11-16T06:29:00.000Z' },
  ['photo_finish']
)

// Submitted exactly at the deadline.
expectSecrets(
  'photo_finish: at the deadline (diff = 0)',
  { ...BORING, submittedAt: '2026-11-16T06:59:00.000Z' },
  ['photo_finish']
)

// Submitted exactly 60 min before — inclusive upper bound.
expectSecrets(
  'photo_finish: 60 min before (inclusive)',
  { ...BORING, submittedAt: '2026-11-16T05:59:00.000Z' },
  ['photo_finish']
)

// Submitted 61 min before — just outside.
expectSecrets(
  'photo_finish: 61 min before (outside)',
  { ...BORING, submittedAt: '2026-11-16T05:58:00.000Z' },
  []
)

// AFTER the deadline — not a photo finish (negative diff). Use a time well
// outside the Night Owl window too so this isolates photo_finish behavior.
expectSecrets(
  'photo_finish: after deadline (negative diff)',
  { ...BORING, submittedAt: '2026-11-16T15:00:00.000Z' },
  []
)

// Null deadline — can't compute. No badge even if submitted recently.
expectSecrets(
  'photo_finish: null deadline',
  {
    ...BORING,
    submittedAt: '2026-11-16T06:29:00.000Z',
    submissionClosesAt: null,
  },
  []
)

// -------------------- FULL PARTY --------------------

expectSecrets('full_party: 3 mentors', { ...BORING, mentorCount: 3 }, ['full_party'])
expectSecrets('full_party: 2 mentors (not enough)', { ...BORING, mentorCount: 2 }, [])
expectSecrets('full_party: 4 mentors (also qualifies)', { ...BORING, mentorCount: 4 }, [
  'full_party',
])
expectSecrets('full_party: 0 mentors', { ...BORING, mentorCount: 0 }, [])

// -------------------- ROYAL APPROVAL --------------------

expectSecrets(
  'royal_approval: cat in abstract',
  { ...BORING, abstractHtml: '<p>We studied a cat population.</p>' },
  ['royal_approval']
)

expectSecrets(
  'royal_approval: Cats in title',
  { ...BORING, titleHtml: '<p>Cats and their diseases</p>' },
  ['royal_approval']
)

expectSecrets(
  'royal_approval: feline (case insensitive)',
  { ...BORING, abstractHtml: '<p>FELINE osteoarthritis</p>' },
  ['royal_approval']
)

expectSecrets(
  'royal_approval: Felis catus',
  { ...BORING, abstractHtml: '<p>Specimens from <em>Felis</em> catus.</p>' },
  ['royal_approval']
)

// "cattle" starts with cat → must NOT trigger (word boundary).
expectSecrets(
  'royal_approval: "cattle" does not count',
  { ...BORING, abstractHtml: '<p>Dairy cattle rumen microbiome.</p>' },
  []
)

// "catalog" / "category" / "catalyst" — same false-positive family.
expectSecrets(
  'royal_approval: "catalog" / "category" do not count',
  {
    ...BORING,
    abstractHtml: '<p>Compiled a catalog across every category of catalyst.</p>',
  },
  []
)

// Null title + null abstract — nothing to match.
expectSecrets(
  'royal_approval: null title + abstract',
  { ...BORING, titleHtml: null, abstractHtml: null },
  []
)

// -------------------- COMBINATION --------------------

// Someone submitting at 2 AM, 30 min before deadline, with 3 mentors, about cats:
// should trigger all four.
expectSecrets(
  'all four secrets at once',
  {
    submittedAt: '2026-11-16T09:30:00.000Z', // 2:30 AM MST + 30 min before 11:59 PM close... wait
    // Actually 11:59 PM MST close = 06:59 UTC next day (Nov 17). Pick a submittedAt
    // that is BOTH between midnight-4am MT AND <= 60 min before the deadline.
    // 06:30 UTC on Nov 17 = 11:30 PM MST on Nov 16 — not night-owl.
    // We need the deadline to be during the small hours of the morning for both
    // to overlap. Shift the deadline for this test.
    submissionClosesAt: '2026-11-16T10:00:00.000Z', // 3 AM MST
    mentorCount: 3,
    titleHtml: '<p>A feline oddity</p>',
    abstractHtml: '<p>Our cat subjects were charming.</p>',
  },
  // 09:30 UTC on Nov 16 = 2:30 AM MST (night owl), 30 min before 10:00 UTC
  // deadline (photo finish), 3 mentors (full party), feline mention (royal).
  ['night_owl', 'photo_finish', 'full_party', 'royal_approval']
)

// -------------------- DRAFT / NULL CASES --------------------

// A draft (never submitted) → no timing badges fire, but mentors + cats still can.
expectSecrets(
  'draft: null submittedAt still earns full_party + royal_approval',
  {
    ...BORING,
    submittedAt: null,
    mentorCount: 3,
    abstractHtml: '<p>Cats everywhere.</p>',
  },
  ['full_party', 'royal_approval']
)

// -------------------- SUMMARY --------------------
console.log(`\n${passed} passed · ${failed} failed`)
if (failed > 0) process.exit(1)
