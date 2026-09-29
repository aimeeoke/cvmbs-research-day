import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NamesClient, type UnlinkedNameRow } from './names-client'

export const metadata = { title: 'Names · Admin' }

/**
 * Admin name-canonicalization tool.
 *
 * Lists every distinct free-text author name across all submissions where
 * the author is NOT linked to a profile or faculty row (i.e. someone the
 * submitter typed in by hand). Same person, different spellings will each
 * show up as their own row so the admin can rename one into the other and
 * merge them.
 *
 * This is the "fix student misspellings" workflow — Green Labs point
 * attribution and the Green Pipette race depend on being able to count
 * distinct people, so "Alex Chen" and "Alex C" need to become one row.
 *
 * Uses server-side grouping in TS (not a Postgres GROUP BY) because the
 * scale is small — hundreds of authors, not millions.
 */
export default async function AdminNamesPage() {
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('submission_authors')
    .select('display_name, submission_id, is_presenter, is_mentor, department_id, affiliation')
    .is('profile_id', null)
    .is('faculty_id', null)
    .not('display_name', 'is', null)

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-900 font-medium">
            Could not load author names.
          </p>
          <p className="text-sm text-red-800 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name, short_name')
    .order('sort_order')

  const deptById = new Map(
    (departments ?? []).map((d) => [
      d.id as string,
      { name: d.name as string, short: (d.short_name as string | null) ?? null },
    ])
  )

  // Group by exact display_name (case-sensitive so misspellings stay separate).
  const byName = new Map<
    string,
    {
      count: number
      submissions: Set<string>
      roles: { presenter: number; mentor: number; coauthor: number }
      depts: Set<string>
      affiliations: Set<string>
    }
  >()
  for (const row of rows ?? []) {
    const raw = (row.display_name as string | null) ?? ''
    const name = raw.trim()
    if (!name) continue
    const entry = byName.get(name) ?? {
      count: 0,
      submissions: new Set<string>(),
      roles: { presenter: 0, mentor: 0, coauthor: 0 },
      depts: new Set<string>(),
      affiliations: new Set<string>(),
    }
    entry.count++
    entry.submissions.add(row.submission_id as string)
    if (row.is_presenter) entry.roles.presenter++
    else if (row.is_mentor) entry.roles.mentor++
    else entry.roles.coauthor++
    if (row.department_id) {
      const d = deptById.get(row.department_id as string)
      if (d) entry.depts.add(d.short ?? d.name)
    }
    const aff = (row.affiliation as string | null)?.trim()
    if (aff) entry.affiliations.add(aff)
    byName.set(name, entry)
  }

  const nameRows: UnlinkedNameRow[] = Array.from(byName.entries())
    .map(([name, entry]) => ({
      name,
      count: entry.count,
      submissionCount: entry.submissions.size,
      roles: entry.roles,
      depts: Array.from(entry.depts).sort(),
      affiliations: Array.from(entry.affiliations).sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div>
        <Link
          href="/admin"
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          ← Back to admin
        </Link>
        <h1 className="text-3xl font-bold text-[#1E4D2B] mt-2">
          Author names
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Free-text author names not linked to a profile or faculty record.
          Rename to fix misspellings — every row with the exact same current
          spelling will update. Only unlinked rows are touched; linked
          faculty and profile names are the source of truth.
        </p>
      </div>

      <NamesClient rows={nameRows} />
    </div>
  )
}
