import Link from 'next/link'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
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
  const currentUser = await getCurrentUser()

  const [{ data: departments }, { data: submissionsRaw, error }] =
    await Promise.all([
      supabase.from('departments').select('id, name').order('sort_order'),
      supabase
        .from('submissions')
        .select(
          `id, title, abstract, status, created_at, submitted_at, finalized_at,
           withdrawal_requested_at,
           department_id, program, classification, affiliations,
           session_preference, preferred_presentation_type,
           research_type, research_stage, funding,
           previously_presented, previous_format, presenter_previous_rd_count,
           submitter_id,
           submitter:profiles!submissions_submitter_id_fkey(email, full_name),
           submission_authors(
             display_name, email, is_presenter, is_mentor, position,
             department_id, affiliation, faculty_id, mentor_slot,
             faculty:faculty_id(department_id)
           )`
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
    abstract: string | null
    status: SubmissionStatus
    created_at: string
    submitted_at: string | null
    finalized_at: string | null
    withdrawal_requested_at: string | null
    department_id: string | null
    program: string | null
    classification: string | null
    affiliations: string[] | null
    session_preference: string | null
    preferred_presentation_type: string | null
    research_type: string | null
    research_stage: string | null
    funding: string | null
    previously_presented: boolean | null
    previous_format: string | null
    presenter_previous_rd_count: number | null
    submitter_id: string
    // PostgREST returns a single object for a scalar FK join, but the
    // Supabase JS types widen to array in some paths. Accept both and
    // narrow with Array.isArray() below.
    submitter:
      | { email: string | null; full_name: string | null }
      | { email: string | null; full_name: string | null }[]
      | null
    submission_authors:
      | {
          display_name: string | null
          email: string | null
          is_presenter: boolean
          is_mentor: boolean
          position: number
          department_id: string | null
          affiliation: string | null
          faculty_id: string | null
          mentor_slot: string | null
          faculty: { department_id: string | null } | null
        }[]
      | null
  }

  const rawRows = (submissionsRaw ?? []) as unknown as RawRow[]

  const depts = new Map<string, string>()
  for (const d of departments ?? []) depts.set(d.id, d.name)

  const resolveAuthorDeptName = (a: {
    department_id: string | null
    faculty: { department_id: string | null } | null
  }): string | null => {
    const id = a.department_id ?? a.faculty?.department_id ?? null
    return id ? depts.get(id) ?? null : null
  }

  const rows: BrowserRow[] = rawRows.map((r) => {
    const authors = (r.submission_authors ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
    const presenter = authors.find((a) => a.is_presenter) ?? null
    const mentors = authors.filter((a) => a.is_mentor)
    const coauthors = authors.filter((a) => !a.is_presenter && !a.is_mentor)
    const mentorCvmbs1 = mentors.find((m) => m.mentor_slot === 'cvmbs_1') ?? null
    const mentorCvmbs2 = mentors.find((m) => m.mentor_slot === 'cvmbs_2') ?? null
    const mentorExternal =
      mentors.find((m) => m.mentor_slot === 'external') ?? null
    const submitter = Array.isArray(r.submitter)
      ? r.submitter[0] ?? null
      : r.submitter ?? null
    return {
      id: r.id,
      title: r.title ?? '',
      abstract: r.abstract ?? '',
      status: r.status,
      created_at: r.created_at,
      submitted_at: r.submitted_at,
      finalized_at: r.finalized_at,
      withdrawal_requested_at: r.withdrawal_requested_at,
      department_id: r.department_id,
      department_name: r.department_id
        ? depts.get(r.department_id) ?? null
        : null,
      program: r.program,
      classification: r.classification,
      affiliations: r.affiliations ?? [],
      session_preference: r.session_preference,
      preferred_presentation_type: r.preferred_presentation_type,
      research_type: r.research_type,
      research_stage: r.research_stage,
      funding: r.funding,
      previously_presented: r.previously_presented,
      previous_format: r.previous_format,
      presenter_previous_rd_count: r.presenter_previous_rd_count,
      submitter_name:
        submitter?.full_name || submitter?.email || 'Unknown submitter',
      submitter_email: submitter?.email ?? null,
      presenter_name: presenter?.display_name ?? null,
      presenter_email: presenter?.email ?? null,
      mentor_names: mentors
        .map((m) => stripAffiliation(m.display_name ?? ''))
        .filter(Boolean),
      mentor_cvmbs_1_name: mentorCvmbs1
        ? stripAffiliation(mentorCvmbs1.display_name ?? '')
        : null,
      mentor_cvmbs_1_dept: mentorCvmbs1 ? resolveAuthorDeptName(mentorCvmbs1) : null,
      mentor_cvmbs_2_name: mentorCvmbs2
        ? stripAffiliation(mentorCvmbs2.display_name ?? '')
        : null,
      mentor_cvmbs_2_dept: mentorCvmbs2 ? resolveAuthorDeptName(mentorCvmbs2) : null,
      mentor_external_name: mentorExternal
        ? stripAffiliation(mentorExternal.display_name ?? '')
        : null,
      mentor_external_affiliation: mentorExternal?.affiliation ?? null,
      coauthor_count: coauthors.length,
      coauthor_names: coauthors
        .map((c) => stripAffiliation(c.display_name ?? ''))
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
        isAdmin={currentUser?.isAdmin ?? false}
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
