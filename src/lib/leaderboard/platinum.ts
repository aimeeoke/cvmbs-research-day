import { createClient } from '@/lib/supabase/server'

/**
 * Platinum Mentoring Top 10 (committee doc Part 1 · item 3).
 *
 * For each CVMBS-roster faculty mentor on the active event, count the
 * number of distinct abstracts that list them as a mentor. Each abstract
 * = 1 full mentee per listed mentor; no splitting.
 *
 * External (non-CVMBS) mentors — rows where `faculty_id IS NULL` — are
 * excluded, matching the Oct 12 design call ("faculty_id IS NULL = external
 * for crediting").
 *
 * Counting lifecycle (same pattern the thermometer and Guild Showdown use):
 *   - Drafts mode (pre-finalize_deadline_at): include draft + submitted
 *     + finalized. Idea per the committee is that making the count visible
 *     while drafts are in-progress nudges mentors to push more mentees in.
 *   - Finals mode (post-finalize_deadline_at): finalized only. Drafts that
 *     never got finalized stop counting; counts settle for the sealed /
 *     award phases.
 *   - No-shows (post-event): still TODO — needs a submissions.no_show_at
 *     column and admin UI to mark no-shows. Lands closer to Jan 23.
 *
 * Tier thresholds come from the committee doc; the Celestial Box tier at
 * 10+ is an intentional hidden easter egg (not advertised anywhere until
 * someone hits it).
 */

export type PlatinumTier = 'none' | 'bronze' | 'silver' | 'platinum' | 'celestial'

export const PLATINUM_TIER_META: Record<
  Exclude<PlatinumTier, 'none'>,
  { emoji: string; label: string; threshold: number; hidden: boolean }
> = {
  bronze:    { emoji: '🥉', label: 'Bronze Box',    threshold: 3,  hidden: false },
  silver:    { emoji: '🥈', label: 'Silver Box',    threshold: 5,  hidden: false },
  platinum:  { emoji: '💎', label: 'Platinum Box',  threshold: 8,  hidden: false },
  celestial: { emoji: '🎁', label: 'Celestial Box', threshold: 10, hidden: true  },
}

/** Pure. Returns the earned tier for a mentee count, or 'none' below 3. */
export function tierForCount(count: number): PlatinumTier {
  if (count >= 10) return 'celestial'
  if (count >= 8) return 'platinum'
  if (count >= 5) return 'silver'
  if (count >= 3) return 'bronze'
  return 'none'
}

export type PlatinumRow = {
  facultyId: string
  name: string
  deptShort: string | null
  menteeCount: number
  tier: PlatinumTier
}

export type PlatinumResult = {
  rows: PlatinumRow[]
  topTierOnBoard: PlatinumTier // the highest tier currently represented in Top 10
  mode: 'drafts' | 'finals'
}

export async function getPlatinumMentoring(
  now: Date = new Date()
): Promise<PlatinumResult> {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, finalize_deadline_at')
    .eq('is_active', true)
    .maybeSingle()

  if (!event) return { rows: [], topTierOnBoard: 'none', mode: 'drafts' }

  // Phase pick: same cutover rule as the thermometer and Guild Showdown.
  const finalsCutover = event.finalize_deadline_at
    ? new Date(event.finalize_deadline_at)
    : null
  const mode: 'drafts' | 'finals' =
    finalsCutover && now >= finalsCutover ? 'finals' : 'drafts'

  // Pull every faculty-mentor row for the active event. Status filter
  // depends on phase: drafts mode = anything that isn't withdrawn, finals
  // mode = only finalized.
  const query = supabase
    .from('submission_authors')
    .select(
      `submission_id, faculty_id,
       faculty:faculty_id ( full_name, department_id, departments:department_id ( short_name ) ),
       submissions!inner ( event_id, status )`
    )
    .eq('is_mentor', true)
    .not('faculty_id', 'is', null)
    .eq('submissions.event_id', event.id)

  if (mode === 'finals') {
    query.eq('submissions.status', 'finalized')
  } else {
    query.neq('submissions.status', 'withdrawn')
  }

  const { data: rows } = await query

  type Row = {
    submission_id: string
    faculty_id: string
    faculty: {
      full_name: string | null
      department_id: string | null
      departments: { short_name: string | null } | null
    } | null
  }

  // Count distinct submissions per faculty_id. Guards against the (unlikely)
  // case where a mentor appears twice on the same abstract.
  const perFaculty = new Map<
    string,
    { name: string; deptShort: string | null; submissions: Set<string> }
  >()

  for (const r of (rows ?? []) as unknown as Row[]) {
    if (!r.faculty_id || !r.faculty) continue
    const slot = perFaculty.get(r.faculty_id) ?? {
      name: r.faculty.full_name ?? 'Unknown',
      deptShort: r.faculty.departments?.short_name ?? null,
      submissions: new Set<string>(),
    }
    slot.submissions.add(r.submission_id)
    perFaculty.set(r.faculty_id, slot)
  }

  const unranked: PlatinumRow[] = Array.from(perFaculty.entries()).map(
    ([facultyId, v]) => ({
      facultyId,
      name: v.name,
      deptShort: v.deptShort,
      menteeCount: v.submissions.size,
      tier: tierForCount(v.submissions.size),
    })
  )

  // Sort by mentee count desc; break ties alphabetically by name for
  // determinism (so the same ranked order appears across page loads with
  // the same data).
  unranked.sort((a, b) => {
    if (b.menteeCount !== a.menteeCount) return b.menteeCount - a.menteeCount
    return a.name.localeCompare(b.name)
  })

  const top10 = unranked.slice(0, 10)

  // Highest tier currently represented — used by the component to decide
  // whether to reveal the Celestial Box easter egg in the legend.
  const tierOrder: PlatinumTier[] = ['none', 'bronze', 'silver', 'platinum', 'celestial']
  let topTierOnBoard: PlatinumTier = 'none'
  for (const r of top10) {
    if (tierOrder.indexOf(r.tier) > tierOrder.indexOf(topTierOnBoard)) {
      topTierOnBoard = r.tier
    }
  }

  return { rows: top10, topTierOnBoard, mode }
}
