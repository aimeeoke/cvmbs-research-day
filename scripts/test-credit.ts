/* eslint-disable no-console */
// Lightweight self-contained test harness for computeDepartmentCredit.
// Run with: npm run test:credit
//
// Covers the four worked examples from the committee doc (Part 3.1), plus a
// handful of edge cases the function has to get right for Nov 18.

import { computeDepartmentCredit } from '../src/lib/leaderboard/credit.ts'

const MIP = 'mip-id'
const BMS = 'bms-id'
const CS = 'cs-id'

let passed = 0
let failed = 0

function approx(a: number, b: number, eps = 1e-6) {
  return Math.abs(a - b) < eps
}

function test(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    console.log(`✓ ${name}`)
    passed++
  } else {
    console.error(`✗ ${name}`)
    console.error(`  expected: ${JSON.stringify(expected)}`)
    console.error(`  actual:   ${JSON.stringify(actual)}`)
    failed++
  }
}

// Example 1 — equal_by_department: 2 MIP + 1 BMS → 50/50 by distinct dept
{
  const out = computeDepartmentCredit(
    {
      mentors: [
        { cvmbsDepartmentId: MIP },
        { cvmbsDepartmentId: MIP },
        { cvmbsDepartmentId: BMS },
      ],
      studentDepartmentId: null,
    },
    { splitMode: 'equal_by_department' }
  )
  test('ex1: 2 MIP + 1 BMS equal_by_department', out, {
    shares: { [MIP]: 0.5, [BMS]: 0.5 },
    needsReview: false,
  })
}

// Example 2 — by_mentor: same input → 67/33
{
  const out = computeDepartmentCredit(
    {
      mentors: [
        { cvmbsDepartmentId: MIP },
        { cvmbsDepartmentId: MIP },
        { cvmbsDepartmentId: BMS },
      ],
      studentDepartmentId: null,
    },
    { splitMode: 'by_mentor' }
  )
  const ok =
    approx(out.shares[MIP] ?? 0, 2 / 3) &&
    approx(out.shares[BMS] ?? 0, 1 / 3) &&
    out.needsReview === false
  if (ok) {
    console.log('✓ ex2: 2 MIP + 1 BMS by_mentor (≈ 0.667 / 0.333)')
    passed++
  } else {
    console.error('✗ ex2: 2 MIP + 1 BMS by_mentor')
    console.error(`  actual: ${JSON.stringify(out)}`)
    failed++
  }
}

// Example 3 — external mentor + DVM student (no CVMBS dept) → 0 pts, needs review
{
  const out = computeDepartmentCredit(
    {
      mentors: [{ cvmbsDepartmentId: null }],
      studentDepartmentId: null,
    },
    { splitMode: 'equal_by_department' }
  )
  test('ex3: external mentor + student with no CVMBS dept → needsReview', out, {
    shares: {},
    needsReview: true,
  })
}

// Example 4 — external mentor + MS student in BMS → 100% BMS via student fallback
{
  const out = computeDepartmentCredit(
    {
      mentors: [{ cvmbsDepartmentId: null }],
      studentDepartmentId: BMS,
    },
    { splitMode: 'equal_by_department' }
  )
  test('ex4: external mentor + BMS student → BMS 100%', out, {
    shares: { [BMS]: 1 },
    needsReview: false,
  })
}

// Edge: 3 mentors all MIP → MIP 100% (not 3x counted)
{
  const out = computeDepartmentCredit(
    {
      mentors: [
        { cvmbsDepartmentId: MIP },
        { cvmbsDepartmentId: MIP },
        { cvmbsDepartmentId: MIP },
      ],
      studentDepartmentId: null,
    },
    { splitMode: 'equal_by_department' }
  )
  test('edge: 3 MIP mentors, equal_by_department → MIP 100%', out, {
    shares: { [MIP]: 1 },
    needsReview: false,
  })
}

// Edge: 1 CVMBS + 1 external, student dept matches CVMBS mentor →
// still only one distinct dept, so 100% to that dept
{
  const out = computeDepartmentCredit(
    {
      mentors: [
        { cvmbsDepartmentId: BMS },
        { cvmbsDepartmentId: null },
      ],
      studentDepartmentId: BMS,
    },
    { splitMode: 'equal_by_department' }
  )
  test('edge: CVMBS BMS + external, student in BMS → BMS 100%', out, {
    shares: { [BMS]: 1 },
    needsReview: false,
  })
}

// Edge: 1 CVMBS + 1 external, student dept differs from CVMBS → 50/50
{
  const out = computeDepartmentCredit(
    {
      mentors: [
        { cvmbsDepartmentId: BMS },
        { cvmbsDepartmentId: null },
      ],
      studentDepartmentId: CS,
    },
    { splitMode: 'equal_by_department' }
  )
  test('edge: CVMBS BMS + external, student in CS → BMS 50 / CS 50', out, {
    shares: { [BMS]: 0.5, [CS]: 0.5 },
    needsReview: false,
  })
}

// Edge: empty mentors → needsReview (shouldn't happen per spec, but safe)
{
  const out = computeDepartmentCredit(
    { mentors: [], studentDepartmentId: BMS },
    { splitMode: 'equal_by_department' }
  )
  test('edge: 0 mentors → needsReview', out, {
    shares: {},
    needsReview: true,
  })
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
