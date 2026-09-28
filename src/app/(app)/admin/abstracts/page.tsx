import Link from 'next/link'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { SubmissionStatus } from '@/lib/types/database'
import { AbstractsBrowser, type BrowserRow } from './abstracts-browser'

export const metadata = { title: 'Abstracts · Admin' }

type PageSearchParams = Promise<{
  status?: string
  dept?: string
  session?: string
  q?: string
}>

const STATUS_ORDER: SubmissionStatus[] = [
  'draft',
  'submitted',
  'finalized',
  'withdrawn',
]

export default async function AdminAbstractsPage({
  searchParams,
}: {
  searchParams: PageSearchParams
}) {
  const params = await searchParams
  const supabase = await createClient()

  const [{ data: departments }, { data: submissionsRaw, error }] =
    await Promise.all([
      supabase.from('departments').select('id, name').order('sort_order'),
      supabase
        .from('submissions')
        .select(
          `id, title, status, created_at, submitted_at, finalized_at,
           withdrawal_requested_at,
           department_id,
           session_preference, preferred_presentation_type, research_type,
           submitter_id,
           submitter:profiles!submissions_submitter_id_fkey(email, full_name),
           submission_authors(display_name, email, is_presenter, is_mentor, position)`
        )
        .order('created_at', { ascending: false }),
    ])

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-900 font-medium">Could not load abstracts.</p>
          <p className="text-sm text-red-800 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  type RawRow = {
    id: string
    title: string | null
    status: SubmissionStatus
    created_at: string
    submitted_at: string | null
    finalized_at: string | null
    withdrawal_requested_at: string | null
    department_id: string | null
    session_preference: string | null
    preferred_presentation_type: string | null
    research_type: string | null
    submitter_id: string
    submitter: { email: string | null; full_name: string | null }[] | null
    submission_authors:
      | {
          display_name: string | null
          email: string | null
          is_presenter: boolean
          is_mentor: boolean
          position: number
        }[]
      | null
  }

  const rawRows = (submissionsRaw ?? []) as unknown as RawRow[]

  const depts = new Map<string, string>()
  for (const d of departments ?? []) depts.set(d.id, d.name)

  const rows: BrowserRow[] = rawRows.map((r) => {
    const authors = (r.submission_authors ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
    const presenter = authors.find((a) => a.is_presenter) ?? null
    const mentors = authors.filter((a) => a.is_mentor)
    const submitter = r.submitter?.[0] ?? null
    return {
      id: r.id,
      title: r.title ?? '',
      status: r.status,
      created_at: r.created_at,
      submitted_at: r.submitted_at,
      finalized_at: r.finalized_at,
      withdrawal_requested_at: r.withdrawal_requested_at,
      department_id: r.department_id,
      department_name: r.department_id
        ? depts.get(r.department_id) ?? null
        : null,
      session_preference: r.session_preference,
      preferred_presentation_type: r.preferred_presentation_type,
      research_type: r.research_type,
      submitter_name:
        submitter?.full_name || submitter?.email || 'Unknown submitter',
      submitter_email: submitter?.email ?? null,
      presenter_name: presenter?.display_name ?? null,
      presenter_email: presenter?.email ?? null,
      mentor_names: mentors
        .map((m) => stripAffiliation(m.display_name ?? ''))
        .filter(Boolean),
      byline: authors
        .map((a) => stripAffiliation(a.display_name ?? ''))
        .filter(Boolean)
        .join(', '),
    }
  })

  // Aggregate counts
  const counts = {
    total: rows.length,
    byStatus: Object.fromEntries(
      STATUS_ORDER.map((s) => [s, rows.filter((r) => r.status === s).length])
    ) as Record<SubmissionStatus, number>,
    pendingWithdrawal: rows.filter(
      (r) => r.withdrawal_requested_at && r.status !== 'withdrawn'
    ).length,
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          ← Admin
        </Link>
        <h1 className="text-3xl font-bold text-[#1E4D2B] mt-1 flex items-center gap-2">
          <FileText size={26} />
          Abstracts overview
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Every submission across all statuses. Filter, search, and click in to
          see the abstract the way its submitter sees it.
        </p>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        <CountCard label="Total" value={counts.total} />
        {STATUS_ORDER.map((s) => (
          <CountCard
            key={s}
            label={labelForStatus(s)}
            value={counts.byStatus[s]}
            tone={toneForStatus(s)}
          />
        ))}
      </section>

      {counts.pendingWithdrawal > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 flex items-center justify-between">
          <span>
            {counts.pendingWithdrawal} submission
            {counts.pendingWithdrawal === 1 ? ' has' : 's have'} a pending
            withdrawal request.
          </span>
          <Link
            href="/admin/requests"
            className="text-sm font-semibold text-amber-900 hover:text-amber-950 underline"
          >
            Review →
          </Link>
        </div>
      )}

      <AbstractsBrowser
        rows={rows}
        departments={(departments ?? []).map((d) => ({
          id: d.id,
          name: d.name,
        }))}
        initialStatus={params.status ?? ''}
        initialDept={params.dept ?? ''}
        initialSession={params.session ?? ''}
        initialQuery={params.q ?? ''}
      />
    </div>
  )
}

function CountCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div
        className={`text-2xl font-bold mt-0.5 ${tone ?? 'text-gray-900'}`}
      >
        {value}
      </div>
    </div>
  )
}

function labelForStatus(s: SubmissionStatus): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function toneForStatus(s: SubmissionStatus): string | undefined {
  switch (s) {
    case 'draft':
      return 'text-gray-700'
    case 'submitted':
      return 'text-blue-700'
    case 'finalized':
      return 'text-[#1E4D2B]'
    case 'withdrawn':
      return 'text-red-700'
  }
}

// display_name for the Other Mentor slot may include a " · Affiliation"
// suffix; strip it for name-only displays like counts and search.
function stripAffiliation(name: string): string {
  const idx = name.indexOf(' · ')
  return (idx === -1 ? name : name.slice(0, idx)).trim()
}
