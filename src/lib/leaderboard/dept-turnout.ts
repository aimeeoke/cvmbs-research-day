import { createClient } from '@/lib/supabase/server'
import { computeDepartmentCredit } from './credit'
import { getLeaderboardConfig } from './config'

/**
 * Dept Turnout (committee doc Part 1 · item 10).
 *
 * "Number of presenters per department, using department shares, as bars."
 *
 * Each abstract contributes 1.0 of presenter weight, distributed across
 * CVMBS departments via the shared Part 3.1 credit function — identical
 * split to Green Pipette and Golden Pipette weights. The sum of the four
 * dept totals across every creditable abstract roughly equals the number
 * of credited abstracts (minus any that landed in `needsReview`).
 *
 * Counting lifecycle matches Platinum Mentoring + the thermometer:
 *   - Drafts mode (pre-finalize_deadline_at): count draft + submitted
 *     + finalized.
 *   - Finals mode (post-finalize_deadline_at): finalized only.
 *   - Post-event: no-shows removed (future work; same submissions.no_show_at
 *     column that the other cards will share).
 */

export type DeptTurnoutRow = {
  departmentId: string
  shortName: string | null
  name: string
  /** Sum of F2 presenter-shares across all creditable abstracts. */
  presenters: number
}

export type DeptTurnoutResult = {
  rows: DeptTurnoutRow[]
  needsReviewCount: number
  mode: 'drafts' | 'finals'
}

export async function getDeptTurnout(
  now: Date = new Date()
): Promise<DeptTurnoutResult> {
  const supabase = await createClient()
  const config = await getLeaderboardConfig()

  const [{ data: event }, { data: depts }] = await Promise.all([
    supabase
      .from('events')
      .select('id, finalize_deadline_at')
      .eq('is_active', true)
      .maybeSingle(),
    supabase.from('departments').select('id, name, short_name, sort_order'),
  ])

  const deptById = new Map(
    (depts ?? []).map((d) => [
      d.id as string,
      {
        id: d.id as string,
        name: d.name as string,
        short_name: (d.short_name as string | null) ?? null,
        sort_order: (d.sort_order as number) ?? 0,
      },
    ])
  )

  const buildRows = (
    totals: Map<string, number>
  ): DeptTurnoutRow[] =>
    Array.from(deptById.values())
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((d) => ({
        departmentId: d.id,
        shortName: d.short_name,
        name: d.name,
        presenters: Math.round((totals.get(d.id) ?? 0) * 10) / 10,
      }))

  if (!event) {
    return { rows: buildRows(new Map()), needsReviewCount: 0, mode: 'drafts' }
  }

  const finalsCutover = event.finalize_deadline_at
    ? new Date(event.finalize_deadline_at)
    : null
  const mode: 'drafts' | 'finals' =
    finalsCutover && now >= finalsCutover ? 'finals' : 'drafts'

  const query = supabase
    .from('submissions')
    .select(
      `id, department_id, status,
       submission_authors (
         is_mentor, faculty_id,
         faculty:faculty_id ( department_id )
       )`
    )
    .eq('event_id', event.id)

  if (mode === 'finals') {
    query.eq('status', 'finalized')
  } else {
    query.neq('status', 'withdrawn')
  }

  const { data: subs } = await query

  type AuthorRow = {
    is_mentor: boolean
    faculty_id: string | null
    faculty: { department_id: string | null } | null
  }

  const totals = new Map<string, number>()
  let needsReview = 0

  for (const s of subs ?? []) {
    const authors =
      ((s as unknown as { submission_authors: AuthorRow[] }).submission_authors ??
        []) as AuthorRow[]

    const mentorInputs = authors
      .filter((a) => a.is_mentor)
      .map((a) => ({ cvmbsDepartmentId: a.faculty?.department_id ?? null }))

    const credit = computeDepartmentCredit(
      {
        mentors: mentorInputs,
        studentDepartmentId: (s as { department_id: string | null }).department_id,
      },
      { splitMode: config.split_mode }
    )

    if (credit.needsReview) {
      needsReview++
      continue
    }

    for (const [deptId, share] of Object.entries(credit.shares)) {
      totals.set(deptId, (totals.get(deptId) ?? 0) + share)
    }
  }

  return { rows: buildRows(totals), needsReviewCount: needsReview, mode }
}
