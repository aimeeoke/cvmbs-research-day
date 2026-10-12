import { createClient } from '@/lib/supabase/server'
import { computeDepartmentCredit } from './credit'
import { getLeaderboardConfig } from './config'

/**
 * Green Pipette scoring (committee doc, Part 1 · item 2).
 *
 * For each non-withdrawn submission on the active event:
 *   project_pts = min(10 × certified_authors_on_this_abstract, cap)
 * Points are credited to departments using the shared Part 3.1 function
 * (same mentor-based rule as Golden Pipette and Dept Turnout).
 *
 * Certified = ambassador cert with verified_at IS NOT NULL. Matching the
 * cert to an author on the abstract uses profile_id OR email OR
 * (via a mentor's faculty_id) the roster email. Name-only matches
 * (CSV-loaded MGL rows with no email) are a known gap — those are
 * resolved manually via /admin/names before Nov 18.
 *
 * The leaderboard also shows "+N ambassadors this week" from the count
 * of certs whose verified_at falls in the last 7 days.
 */

export type GreenPipetteDept = {
  departmentId: string
  shortName: string | null
  name: string
  points: number
  projectCount: number
}

export type GreenPipetteResult = {
  rows: GreenPipetteDept[]
  newThisWeek: number
  needsReviewCount: number
  cap: number
}

export async function getGreenPipette(): Promise<GreenPipetteResult> {
  const supabase = await createClient()
  const config = await getLeaderboardConfig()

  const [{ data: event }, { data: depts }] = await Promise.all([
    supabase.from('events').select('id').eq('is_active', true).maybeSingle(),
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

  const empty = (): GreenPipetteResult => ({
    rows: Array.from(deptById.values())
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((d) => ({
        departmentId: d.id,
        shortName: d.short_name,
        name: d.name,
        points: 0,
        projectCount: 0,
      })),
    newThisWeek: 0,
    needsReviewCount: 0,
    cap: config.ambassador_cap,
  })

  if (!event) return empty()

  // Load every verified ambassador cert in one shot. Small table — fine to
  // scan in memory to build matcher sets.
  const { data: certRows } = await supabase
    .from('certifications')
    .select('profile_id, email, verified_at')
    .eq('kind', 'ambassador')
    .not('verified_at', 'is', null)

  const certByProfile = new Set<string>()
  const certByEmail = new Set<string>()
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  let newThisWeek = 0
  for (const c of certRows ?? []) {
    if (c.profile_id) certByProfile.add(c.profile_id as string)
    if (c.email) certByEmail.add((c.email as string).toLowerCase())
    if (c.verified_at && new Date(c.verified_at as string).getTime() >= weekAgo) {
      newThisWeek++
    }
  }

  // Load every non-withdrawn submission for the active event along with
  // its authors and (via faculty_id) the mentor's dept + roster email.
  const { data: subs } = await supabase
    .from('submissions')
    .select(
      `id, department_id, status,
       submission_authors (
         profile_id, email, is_mentor, is_presenter, faculty_id,
         faculty:faculty_id ( department_id, email )
       )`
    )
    .eq('event_id', event.id)
    .neq('status', 'withdrawn')

  if (!subs?.length) return { ...empty(), newThisWeek }

  type AuthorRow = {
    profile_id: string | null
    email: string | null
    is_mentor: boolean
    is_presenter: boolean
    faculty_id: string | null
    faculty: { department_id: string | null; email: string | null } | null
  }

  const deptTotals = new Map<string, { points: number; projects: Set<string> }>()
  let needsReview = 0

  for (const s of subs) {
    const authors = ((s as unknown as { submission_authors: AuthorRow[] })
      .submission_authors ?? []) as AuthorRow[]

    // Collect certified authors on this abstract, de-duplicated by whichever
    // identity we matched on. One author can't double-count.
    const matchedIdentities = new Set<string>()
    for (const a of authors) {
      if (a.profile_id && certByProfile.has(a.profile_id)) {
        matchedIdentities.add(`p:${a.profile_id}`)
        continue
      }
      const emailLc = a.email?.toLowerCase() ?? null
      if (emailLc && certByEmail.has(emailLc)) {
        matchedIdentities.add(`e:${emailLc}`)
        continue
      }
      const facultyEmailLc = a.faculty?.email?.toLowerCase() ?? null
      if (facultyEmailLc && certByEmail.has(facultyEmailLc)) {
        matchedIdentities.add(`e:${facultyEmailLc}`)
        continue
      }
    }

    const certCount = matchedIdentities.size
    if (certCount === 0) continue

    const uncapped = 10 * certCount
    const projectPts = Math.min(uncapped, config.ambassador_cap)

    // Compute dept shares via the shared F2 function.
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
      const slot = deptTotals.get(deptId) ?? { points: 0, projects: new Set<string>() }
      slot.points += projectPts * share
      slot.projects.add((s as { id: string }).id)
      deptTotals.set(deptId, slot)
    }
  }

  const rows = Array.from(deptById.values())
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((d) => {
      const t = deptTotals.get(d.id)
      return {
        departmentId: d.id,
        shortName: d.short_name,
        name: d.name,
        points: t ? Math.round(t.points) : 0,
        projectCount: t ? t.projects.size : 0,
      }
    })

  return { rows, newThisWeek, needsReviewCount: needsReview, cap: config.ambassador_cap }
}
