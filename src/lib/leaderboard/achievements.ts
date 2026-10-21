// Compute functions for the full Research Day 2027 Achievement Catalog.
// Pure functions below the fold; server-side DB access in `getAchievements...`
// at the bottom.
//
// Policy:
//  - All keyword matching uses wholeWordMatch (case-insensitive, whole-word,
//    hyphen-aware). Search is run against title + abstract PLAIN TEXT ONLY,
//    never author names or affiliations.
//  - Meta badges (Menagerie, Boss Rush, Reigning Cats and Dogs,
//    Two Heads Are Better, Multiclass, Diplomat, Grand Alliance) are derived
//    after primaries are computed.
//  - "Deferred" / "phase2" badges in the catalog don't fire from this file.

import { richTextToPlainText } from '../rich-text'
import { AFFILIATION_GROUPS } from '../affiliations.generated'
import type { AchievementKey } from './achievements-catalog'
import {
  CONTENT_KEYWORDS,
  BOSS_KEYWORDS,
  FUNDING_KEYWORDS,
  MENAGERIE_GROUPS,
  anyWholeWord,
  wholeWordMatch,
  type ContentBadgeKey,
  type BossBadgeKey,
} from './badge-keywords'

export const EARLY_BIRD_COUNT = 50
export const FULL_PARTY_MENTOR_COUNT = 3
export const PHOTO_FINISH_WINDOW_MINUTES = 60

// ---------------------------------------------------------------------------
// Affiliation type lookup — build once from the Affiliations CSV generator.
// ---------------------------------------------------------------------------
const AFFILIATION_TYPE_BY_NAME = new Map<string, string>()
for (const g of AFFILIATION_GROUPS) {
  for (const item of g.items) {
    AFFILIATION_TYPE_BY_NAME.set(item.toLowerCase(), g.type)
  }
}

/** Input for the per-abstract pure compute step. */
export type AbstractAchievementInput = {
  /** Submission id — not used in compute, used by callers to key the result. */
  id: string

  // Timing
  submittedAt: string | null
  submissionClosesAt: string | null
  isAmongFirstN: boolean
  /** True if this submission has the single earliest submitted_at on the event. */
  isFirstBlood: boolean

  // Author list
  authorCount: number
  mentorCount: number

  // Content
  titleHtml: string | null
  abstractHtml: string | null

  // Affiliations (presenter-level, from submissions.affiliations TEXT[])
  affiliations: readonly string[] | null

  // Funding
  funding: string | null
}

/** Pure. Returns the set of achievements an abstract has triggered. */
export function computeAchievementsForAbstract(
  input: AbstractAchievementInput
): Set<AchievementKey> {
  const earned = new Set<AchievementKey>()

  // --- Timing --------------------------------------------------------------
  if (input.isAmongFirstN) earned.add('early_bird')
  if (input.isFirstBlood) earned.add('first_blood')

  if (input.submittedAt) {
    const submitted = new Date(input.submittedAt)
    if (!Number.isNaN(submitted.getTime())) {
      // Night Owl — 0 <= hour < 4 in America/Denver.
      const mtHour = Number(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Denver',
          hour: 'numeric',
          hourCycle: 'h23',
        }).format(submitted)
      )
      if (!Number.isNaN(mtHour) && mtHour >= 0 && mtHour < 4) {
        earned.add('night_owl')
      }

      // Weekend Warrior — Saturday or Sunday in America/Denver.
      const mtWeekday = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Denver',
        weekday: 'short',
      }).format(submitted)
      if (mtWeekday === 'Sat' || mtWeekday === 'Sun') {
        earned.add('weekend_warrior')
      }

      // Photo Finish — within the last PHOTO_FINISH_WINDOW_MINUTES before
      // the submission deadline. Only applies if we know the deadline.
      if (input.submissionClosesAt) {
        const deadline = new Date(input.submissionClosesAt)
        if (!Number.isNaN(deadline.getTime())) {
          const diffMinutes = (deadline.getTime() - submitted.getTime()) / 60000
          if (diffMinutes >= 0 && diffMinutes <= PHOTO_FINISH_WINDOW_MINUTES) {
            earned.add('photo_finish')
          }
        }
      }
    }
  }

  // --- Author list ---------------------------------------------------------
  if (input.authorCount === 2) earned.add('co_op_mode')
  if (input.authorCount >= 11) earned.add('raid_party')
  if (input.authorCount >= 20) earned.add('world_raid')
  if (input.mentorCount >= FULL_PARTY_MENTOR_COUNT) earned.add('full_party')

  // --- Content keywords ----------------------------------------------------
  const haystack = `${richTextToPlainText(input.titleHtml)} ${richTextToPlainText(input.abstractHtml)}`
  const contentHits = new Set<ContentBadgeKey>()
  for (const key of Object.keys(CONTENT_KEYWORDS) as ContentBadgeKey[]) {
    if (anyWholeWord(haystack, CONTENT_KEYWORDS[key])) {
      contentHits.add(key)
      earned.add(key as AchievementKey)
    }
  }

  // --- Content meta badges -------------------------------------------------
  // Reigning Cats and Dogs = Royal Approval AND Puppy Love
  if (contentHits.has('royal_approval') && contentHits.has('puppy_love')) {
    earned.add('reigning_cats_and_dogs')
  }
  // Two Heads Are Better = Puppy Love AND 2+ mentors
  if (contentHits.has('puppy_love') && input.mentorCount >= 2) {
    earned.add('two_heads_are_better')
  }
  // Menagerie = 3+ animal groups
  let animalGroupCount = 0
  for (const g of MENAGERIE_GROUPS) {
    if (contentHits.has(g)) animalGroupCount++
  }
  if (animalGroupCount >= 3) earned.add('menagerie')

  // --- Boss battles --------------------------------------------------------
  const bossHits = new Set<BossBadgeKey>()
  for (const key of Object.keys(BOSS_KEYWORDS) as BossBadgeKey[]) {
    if (anyWholeWord(haystack, BOSS_KEYWORDS[key])) {
      bossHits.add(key)
      earned.add(key as AchievementKey)
    }
  }
  // Boss Rush = 2+ bosses engaged in the same abstract
  if (bossHits.size >= 2) earned.add('boss_rush')

  // --- Affiliations --------------------------------------------------------
  const presenterAffiliations = input.affiliations ?? []
  const typesSeen = new Set<string>()
  for (const name of presenterAffiliations) {
    const t = AFFILIATION_TYPE_BY_NAME.get(String(name).toLowerCase())
    if (t) typesSeen.add(t)
  }
  if (typesSeen.has('Center')) earned.add('center_of_attention')
  if (typesSeen.has('Institute')) earned.add('institutionalized')
  if (typesSeen.has('Laboratory')) earned.add('lab_partner')
  if (typesSeen.has('Program')) earned.add('with_the_program')
  if (typesSeen.has('Training Grant')) earned.add('t_minus')
  if (typesSeen.size >= 2) earned.add('multiclass')
  if (typesSeen.size >= 3) earned.add('diplomat')
  if (typesSeen.size >= 5) earned.add('grand_alliance')

  // --- Funding -------------------------------------------------------------
  const fundingText = (input.funding ?? '').trim()
  if (fundingText.length > 0) earned.add('benefactor')
  if (fundingText && anyWholeWord(fundingText, FUNDING_KEYWORDS.seed_funded)) {
    earned.add('seed_funded')
  }

  return earned
}

/**
 * Input for the per-presenter attendance badges — these aren't per-abstract,
 * they're per-person based on the Research Day history question on the submit
 * form (presenter_previous_rd_count).
 */
export type AttendanceAchievementInput = {
  presenterPreviousRdCount: number | null
}

export function computeAttendanceAchievements(
  input: AttendanceAchievementInput
): Set<AchievementKey> {
  const earned = new Set<AchievementKey>()
  const n = input.presenterPreviousRdCount
  if (n === null) return earned
  if (n === 0) earned.add('first_timer')
  // Catalog: 3-Year Veteran = answered "2" or "3". 5-Year Veteran = "4+".
  // Mutually exclusive tiers.
  if (n === 2 || n === 3) earned.add('veteran_3')
  if (n >= 4) earned.add('veteran_5')
  return earned
}

/**
 * Debug helper used by the admin review page — returns the set of KEYWORDS
 * that fired for each content/boss/funding badge on a given abstract. The
 * admin UI shows these so a reviewer can see WHY a badge triggered.
 */
export function computeTriggerDetails(input: {
  titleHtml: string | null
  abstractHtml: string | null
  funding: string | null
}): Record<string, string[]> {
  const haystack = `${richTextToPlainText(input.titleHtml)} ${richTextToPlainText(input.abstractHtml)}`
  const out: Record<string, string[]> = {}
  for (const key of Object.keys(CONTENT_KEYWORDS) as ContentBadgeKey[]) {
    const hits = wholeWordMatch(haystack, CONTENT_KEYWORDS[key])
    if (hits.length > 0) out[key] = hits
  }
  for (const key of Object.keys(BOSS_KEYWORDS) as BossBadgeKey[]) {
    const hits = wholeWordMatch(haystack, BOSS_KEYWORDS[key])
    if (hits.length > 0) out[key] = hits
  }
  const fundingText = (input.funding ?? '').trim()
  if (fundingText) {
    const hits = wholeWordMatch(fundingText, FUNDING_KEYWORDS.seed_funded)
    if (hits.length > 0) out.seed_funded = hits
  }
  return out
}
