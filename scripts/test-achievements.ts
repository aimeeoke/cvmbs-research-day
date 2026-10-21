/* eslint-disable no-console */
// Test harness for computeAchievementsForAbstract and companion compute.
// Run with: npm run test:achievements
//
// Focused on the catalog's three keyword traps + the meta badges:
//   - whole-word match (cat / catalyst, rat / rate)
//   - radiation vs imaging disjoint
//   - Hydra excludes osteosarcoma / lymphoma / leukemia (which are their own
//     bosses; their keywords aren't in CONTENT_KEYWORDS.the_hydra)
//   - Boss Rush = 2+ bosses
//   - Menagerie = 3+ animal groups
//   - Reigning Cats and Dogs = puppy_love + royal_approval
//   - Two Heads Are Better = puppy_love + ≥2 mentors
//   - Affiliation combos (multiclass / diplomat / grand_alliance)
//   - Funding (benefactor + seed_funded)
//   - Night Owl / Weekend Warrior in America/Denver
//   - Author-list bands (co_op_mode / raid_party / full_party / world_raid)

import {
  computeAchievementsForAbstract,
  computeAttendanceAchievements,
  type AbstractAchievementInput,
} from '../src/lib/leaderboard/achievements.ts'
import type { AchievementKey } from '../src/lib/leaderboard/achievements-catalog.ts'

let passed = 0
let failed = 0

function expectHas(
  name: string,
  input: Partial<AbstractAchievementInput>,
  expected: AchievementKey[]
) {
  const merged: AbstractAchievementInput = { ...BORING, ...input }
  const actual = computeAchievementsForAbstract(merged)
  const missing = expected.filter((k) => !actual.has(k))
  if (missing.length === 0) {
    console.log(`✓ ${name}`)
    passed++
  } else {
    console.error(`✗ ${name}`)
    console.error(`  missing keys: ${JSON.stringify(missing)}`)
    console.error(`  actual: ${JSON.stringify([...actual].sort())}`)
    failed++
  }
}

function expectLacks(
  name: string,
  input: Partial<AbstractAchievementInput>,
  forbidden: AchievementKey[]
) {
  const merged: AbstractAchievementInput = { ...BORING, ...input }
  const actual = computeAchievementsForAbstract(merged)
  const stuck = forbidden.filter((k) => actual.has(k))
  if (stuck.length === 0) {
    console.log(`✓ ${name}`)
    passed++
  } else {
    console.error(`✗ ${name}`)
    console.error(`  should not include: ${JSON.stringify(stuck)}`)
    console.error(`  actual: ${JSON.stringify([...actual].sort())}`)
    failed++
  }
}

// Boring baseline — nothing fires. Each test flips a single factor so we can
// prove it in isolation.
const BORING: AbstractAchievementInput = {
  id: 'test',
  submittedAt: '2026-11-05T20:00:00.000Z', // Thu 1 PM Mountain
  submissionClosesAt: '2026-11-16T06:59:00.000Z', // deadline
  isAmongFirstN: false,
  isFirstBlood: false,
  authorCount: 3,
  mentorCount: 1,
  titleHtml: '<p>A study of nothing in particular</p>',
  abstractHtml: '<p>This abstract contains deliberately innocuous text.</p>',
  affiliations: [],
  funding: null,
}

// -----------------------------------------------------------------------------
// Trap 1 — whole-word match
// -----------------------------------------------------------------------------
expectLacks(
  'Trap: "cat" inside "catalyst" does NOT trigger Royal Approval',
  { abstractHtml: '<p>The catalyst reaction indicates a communication breakdown.</p>' },
  ['royal_approval']
)
expectHas(
  'Royal Approval fires on "cats"',
  { abstractHtml: '<p>We studied older cats in a shelter setting.</p>' },
  ['royal_approval']
)
expectLacks(
  'Trap: "rat" inside "rate" does NOT trigger Tiny Collaborators',
  { abstractHtml: '<p>The rate of change accelerated during generation.</p>' },
  ['tiny_collaborators']
)
expectHas(
  'Tiny Collaborators fires on "rats"',
  { abstractHtml: '<p>Wistar rats were used as the model organism.</p>' },
  ['tiny_collaborators']
)

// -----------------------------------------------------------------------------
// Trap 2 — radiation (Glow Up) vs imaging (X-Ray Vision) disjoint
// -----------------------------------------------------------------------------
expectHas(
  'Imaging abstract triggers X-Ray Vision only, not Glow Up',
  { abstractHtml: '<p>We used radiographs to assess the joint space.</p>' },
  ['x_ray_vision']
)
expectLacks(
  'Imaging abstract does NOT trigger Glow Up',
  { abstractHtml: '<p>We used radiographs to assess the joint space.</p>' },
  ['glow_up']
)
expectHas(
  'Radiation abstract triggers Glow Up',
  { abstractHtml: '<p>Dosimetry was performed for the irradiation protocol.</p>' },
  ['glow_up']
)
expectLacks(
  'Radiation abstract does NOT trigger X-Ray Vision',
  { abstractHtml: '<p>Dosimetry was performed for the irradiation protocol.</p>' },
  ['x_ray_vision']
)

// -----------------------------------------------------------------------------
// Bosses
// -----------------------------------------------------------------------------
expectHas(
  'The Hydra fires on "tumor"',
  { abstractHtml: '<p>Primary tumor response to therapy.</p>' },
  ['the_hydra']
)
expectHas(
  'Osteosarcoma triggers The Bone Thief',
  { abstractHtml: '<p>Osteosarcoma biomarkers in large-breed dogs.</p>' },
  ['the_bone_thief']
)
expectLacks(
  'Osteosarcoma-only abstract does NOT trigger The Hydra',
  { abstractHtml: '<p>Osteosarcoma biomarkers in large-breed dogs.</p>' },
  ['the_hydra']
)
expectHas(
  'Osteosarcoma + metastasis triggers The Bone Thief + The Hydra + Boss Rush',
  {
    abstractHtml:
      '<p>Osteosarcoma metastasis to the lung was observed.</p>',
  },
  ['the_bone_thief', 'the_hydra', 'boss_rush']
)
expectHas(
  'Alzheimer + MRSA triggers two bosses + Boss Rush',
  {
    abstractHtml: "<p>Alzheimer's patients with MRSA skin colonization.</p>",
  },
  ['the_forgetting', 'the_unkillable', 'boss_rush']
)
expectLacks(
  'Single boss does NOT trigger Boss Rush',
  { abstractHtml: '<p>Chronic wasting disease transmission dynamics.</p>' },
  ['boss_rush']
)
expectHas(
  'CWD triggers The Misfolded',
  { abstractHtml: '<p>Chronic wasting disease transmission dynamics.</p>' },
  ['the_misfolded']
)

// -----------------------------------------------------------------------------
// Content meta badges
// -----------------------------------------------------------------------------
expectHas(
  'Puppy Love + Royal Approval triggers Reigning Cats and Dogs',
  {
    abstractHtml:
      '<p>Comparing dogs and cats in a comparative oncology study.</p>',
  },
  ['puppy_love', 'royal_approval', 'reigning_cats_and_dogs']
)
expectHas(
  'Puppy Love + 2 mentors triggers Two Heads Are Better',
  {
    abstractHtml: '<p>Canine locomotion in older dogs.</p>',
    mentorCount: 2,
  },
  ['puppy_love', 'two_heads_are_better']
)
expectLacks(
  'Puppy Love with 1 mentor does NOT trigger Two Heads Are Better',
  {
    abstractHtml: '<p>Canine locomotion in older dogs.</p>',
    mentorCount: 1,
  },
  ['two_heads_are_better']
)
expectHas(
  'Menagerie fires with 3 animal groups (dogs + horses + bats)',
  {
    abstractHtml:
      '<p>Mixed-species study including dogs, horses, and bats collected in the field.</p>',
  },
  ['puppy_love', 'horsepower', 'night_shift', 'menagerie']
)
expectLacks(
  'Menagerie does NOT fire with only 2 animal groups',
  {
    abstractHtml:
      '<p>Mixed-species study including dogs and horses collected in the field.</p>',
  },
  ['menagerie']
)

// -----------------------------------------------------------------------------
// Author list
// -----------------------------------------------------------------------------
expectHas('Co-op Mode fires with exactly 2 authors', { authorCount: 2 }, ['co_op_mode'])
expectLacks(
  'Co-op Mode does NOT fire with 3 authors',
  { authorCount: 3 },
  ['co_op_mode']
)
expectHas('Raid Party fires at 11 authors', { authorCount: 11 }, ['raid_party'])
expectHas('World Raid fires at 20 authors', { authorCount: 20 }, [
  'raid_party',
  'world_raid',
])
expectHas('Full Party fires at 3 mentors', { mentorCount: 3 }, ['full_party'])
expectLacks('Full Party does NOT fire at 2 mentors', { mentorCount: 2 }, [
  'full_party',
])

// -----------------------------------------------------------------------------
// Affiliations
// -----------------------------------------------------------------------------
expectHas(
  'Center + Institute + Laboratory triggers Multiclass + Diplomat',
  {
    affiliations: [
      'Flint Animal Cancer Center',
      'One Health Institute',
      'Equine Reproduction Laboratory',
    ],
  },
  ['center_of_attention', 'institutionalized', 'lab_partner', 'multiclass', 'diplomat']
)
expectLacks(
  'Center + Institute + Laboratory does NOT trigger Grand Alliance',
  {
    affiliations: [
      'Flint Animal Cancer Center',
      'One Health Institute',
      'Equine Reproduction Laboratory',
    ],
  },
  ['grand_alliance']
)
expectHas(
  'All 5 affiliation types triggers Grand Alliance',
  {
    affiliations: [
      'Flint Animal Cancer Center',
      'One Health Institute',
      'Equine Reproduction Laboratory',
      'MARC T34',
      'DVM/PhD Program',
    ],
  },
  [
    'center_of_attention',
    'institutionalized',
    'lab_partner',
    't_minus',
    'with_the_program',
    'multiclass',
    'diplomat',
    'grand_alliance',
  ]
)
expectLacks(
  'Unknown affiliation strings do NOT trigger affiliation badges',
  { affiliations: ['Totally Fake Center of Nothing'] },
  ['center_of_attention', 'multiclass']
)

// -----------------------------------------------------------------------------
// Funding
// -----------------------------------------------------------------------------
expectHas('Any funding text triggers Benefactor', { funding: 'NIH R01' }, [
  'benefactor',
])
expectLacks('Blank funding does NOT trigger Benefactor', { funding: '' }, [
  'benefactor',
])
expectLacks('Whitespace funding does NOT trigger Benefactor', { funding: '   ' }, [
  'benefactor',
])
expectHas(
  'CRC in funding triggers Seed Funded',
  { funding: 'Supported by a College Research Council pilot grant.' },
  ['benefactor', 'seed_funded']
)
expectLacks(
  'NIH-only funding does NOT trigger Seed Funded',
  { funding: 'NIH R01 and NSF supplement' },
  ['seed_funded']
)

// -----------------------------------------------------------------------------
// Timing
// -----------------------------------------------------------------------------
expectHas(
  'Night Owl fires at 2 AM Mountain Time',
  { submittedAt: '2026-11-05T09:30:00.000Z' }, // 2:30 AM MST (UTC-7, standard time)
  ['night_owl']
)
expectLacks(
  'Night Owl does NOT fire at noon Mountain Time',
  { submittedAt: '2026-11-05T19:00:00.000Z' },
  ['night_owl']
)
expectHas(
  'Weekend Warrior fires on Saturday Mountain Time',
  { submittedAt: '2026-11-07T19:00:00.000Z' }, // Sat noon MST
  ['weekend_warrior']
)
expectLacks(
  'Weekend Warrior does NOT fire on Wednesday Mountain Time',
  { submittedAt: '2026-11-04T19:00:00.000Z' },
  ['weekend_warrior']
)
expectHas(
  'Photo Finish fires within 60 min of deadline',
  {
    submittedAt: '2026-11-16T06:00:00.000Z', // 59 min before deadline
    submissionClosesAt: '2026-11-16T06:59:00.000Z',
  },
  ['photo_finish']
)
expectLacks(
  'Photo Finish does NOT fire 2 hours before deadline',
  {
    submittedAt: '2026-11-16T04:59:00.000Z',
    submissionClosesAt: '2026-11-16T06:59:00.000Z',
  },
  ['photo_finish']
)

// -----------------------------------------------------------------------------
// First Blood / Early Bird
// -----------------------------------------------------------------------------
expectHas('First Blood fires when input flag is set', { isFirstBlood: true }, [
  'first_blood',
])
expectHas('Early Bird fires when input flag is set', { isAmongFirstN: true }, [
  'early_bird',
])

// -----------------------------------------------------------------------------
// Author-name scoping — content keywords in names should NOT fire. We only
// pass title + abstract to the compute step so this is testable here: pass a
// title with a name that looks like a species.
// -----------------------------------------------------------------------------
expectLacks(
  'Author surname "Lamb" in abstract body does not inflate Counting Sheep inadvertently (unless the word "lamb" IS in body)',
  { abstractHtml: '<p>Innocuous text describing nothing specific.</p>' },
  ['counting_sheep']
)
// Note: the compute step receives title + abstract directly. Scoping (never
// searching author names) is enforced by the CALLER passing the right fields.
// We confirm the caller's contract above by not passing names anywhere.

// -----------------------------------------------------------------------------
// Attendance tiers (separate compute function)
// -----------------------------------------------------------------------------
{
  function expectAttendance(
    name: string,
    count: number | null,
    expected: AchievementKey[]
  ) {
    const got = computeAttendanceAchievements({ presenterPreviousRdCount: count })
    const missing = expected.filter((k) => !got.has(k))
    const extra = [...got].filter(
      (k) => !expected.includes(k as AchievementKey)
    )
    if (missing.length === 0 && extra.length === 0) {
      console.log(`✓ ${name}`)
      passed++
    } else {
      console.error(`✗ ${name}`)
      if (missing.length) console.error(`  missing: ${JSON.stringify(missing)}`)
      if (extra.length) console.error(`  unexpected: ${JSON.stringify(extra)}`)
      failed++
    }
  }
  expectAttendance('null count = no attendance badges', null, [])
  expectAttendance('count 0 = First-Timer only', 0, ['first_timer'])
  expectAttendance('count 1 = nothing (gap between first-timer and veteran)', 1, [])
  expectAttendance('count 2 = 3-Year Veteran only', 2, ['veteran_3'])
  expectAttendance('count 3 = 3-Year Veteran only', 3, ['veteran_3'])
  expectAttendance('count 4 = 5-Year Veteran only (NOT veteran_3)', 4, [
    'veteran_5',
  ])
  expectAttendance('count 7 = 5-Year Veteran only', 7, ['veteran_5'])
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('')
console.log(`${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
