/* eslint-disable no-console */
// Lightweight self-contained test harness for tierForCount.
// Run with: npm run test:platinum-tiers
//
// Covers every tier boundary from the committee doc:
//   Bronze    3-4
//   Silver    5-7
//   Platinum  8-9
//   Celestial 10+   (hidden easter egg)
// Plus 0, 1, 2 (none) and some larger counts.

import { tierForCount, type PlatinumTier } from '../src/lib/leaderboard/platinum.ts'

let passed = 0
let failed = 0

function test(name: string, actual: PlatinumTier, expected: PlatinumTier) {
  if (actual === expected) {
    console.log(`✓ ${name}`)
    passed++
  } else {
    console.error(`✗ ${name}`)
    console.error(`  expected: ${expected}`)
    console.error(`  actual:   ${actual}`)
    failed++
  }
}

// --- none ---
test('0 mentees → none', tierForCount(0), 'none')
test('1 mentee → none', tierForCount(1), 'none')
test('2 mentees → none (just below Bronze)', tierForCount(2), 'none')

// --- bronze ---
test('3 mentees → bronze (inclusive lower)', tierForCount(3), 'bronze')
test('4 mentees → bronze', tierForCount(4), 'bronze')

// --- silver ---
test('5 mentees → silver (inclusive lower)', tierForCount(5), 'silver')
test('6 mentees → silver', tierForCount(6), 'silver')
test('7 mentees → silver (upper bound)', tierForCount(7), 'silver')

// --- platinum ---
test('8 mentees → platinum (inclusive lower)', tierForCount(8), 'platinum')
test('9 mentees → platinum (upper bound)', tierForCount(9), 'platinum')

// --- celestial (hidden) ---
test('10 mentees → celestial (inclusive lower, hidden tier)', tierForCount(10), 'celestial')
test('15 mentees → celestial', tierForCount(15), 'celestial')
test('100 mentees → celestial', tierForCount(100), 'celestial')

console.log(`\n${passed} passed · ${failed} failed`)
if (failed > 0) process.exit(1)
