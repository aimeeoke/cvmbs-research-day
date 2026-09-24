import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileText, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import type { SubmissionStatus } from '@/lib/types/database'
import { startNewSubmission } from './actions'

export const metadata = { title: 'Abstract Portal · CVMBS Research Day' }

type AuthorRow = {
  display_name: string | null
  email: string | null
  is_presenter: boolean
  is_mentor: boolean
  profile_id: string | null
  faculty_id: string | null
  profiles: { first_name: string | null; last_name: string | null; full_name: string | null } | null
  faculty: { full_name: string | null } | null
}

type SubmissionRow = {
  id: string
  title: string
  status: SubmissionStatus
  submitter_id: string
  created_at: string
  submission_authors: AuthorRow[]
}

export default async function AbstractsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/abstracts')

  const supabase = await createClient()

  const { data: submissions, error } = await supabase
    .from('submissions')
    .select(
      `id, title, status, submitter_id, created_at,
       submission_authors(
         display_name, email, is_presenter, is_mentor, profile_id, faculty_id,
         profiles(first_name, last_name, full_name),
         faculty(full_name)
       )`
    )
    .order('created_at', { ascending: false })
    .returns<SubmissionRow[]>()

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-900 font-medium">Could not load your abstracts.</p>
          <p className="text-sm text-red-800 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  const rows = (submissions ?? []).map((s) => summarize(s, user.id, user.email))

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#1E4D2B]">Abstract Portal</h1>
          <p className="text-sm text-gray-600 mt-1">
            Your abstracts and any you can edit as a mentor.
          </p>
        </div>
        <form action={startNewSubmission}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22]"
          >
            <Plus size={16} />
            New submission
          </button>
        </form>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-1">
        <p className="font-semibold">Before you create a new submission:</p>
        <p>
          Because of space and time constraints, presenters may only present a
          single abstract. If more than one abstract is created for the same
          presenter, <strong>only the first one submitted</strong> will be accepted.
        </p>
        <p>
          Mentors and lab managers submitting on behalf of a presenter: use the
          presenter&apos;s real email in the Presenter row so the record credits correctly.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-2 text-gray-700 font-medium">No abstracts yet.</p>
          <p className="text-sm text-gray-500">
            Click <em>New submission</em> to start your first draft.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Presenter</th>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">My role</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-gray-900">
                      {r.presenterFirst || r.presenterLast
                        ? `${r.presenterFirst ?? ''} ${r.presenterLast ?? ''}`.trim()
                        : r.presenterDisplay || <em className="text-gray-400">Not set</em>}
                    </div>
                    {r.presenterEmail && (
                      <div className="text-xs text-gray-500">{r.presenterEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-gray-800">
                    {r.title || <em className="text-gray-400">Untitled draft</em>}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      {r.myRoles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs font-medium"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <Link
                      href={`/submit?id=${r.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1E4D2B] text-[#1E4D2B] text-xs font-semibold hover:bg-[#1E4D2B]/5"
                    >
                      {r.editable ? 'Edit' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function summarize(s: SubmissionRow, userId: string, userEmail: string | null) {
  const presenter = (s.submission_authors ?? []).find((a) => a.is_presenter)
  const presenterFirst = presenter?.profiles?.first_name ?? null
  const presenterLast = presenter?.profiles?.last_name ?? null
  const presenterDisplay =
    presenter?.profiles?.full_name ??
    presenter?.faculty?.full_name ??
    presenter?.display_name ??
    null
  const presenterEmail = presenter?.email ?? null

  const myEmail = (userEmail ?? '').toLowerCase()
  const myRoles: string[] = []
  if (s.submitter_id === userId) myRoles.push('Submitter')
  const mentorRow = (s.submission_authors ?? []).find(
    (a) => a.is_mentor && (a.profile_id === userId || (a.email && a.email.toLowerCase() === myEmail))
  )
  if (mentorRow) myRoles.push('Mentor')
  const presenterMatch = presenter && (
    presenter.profile_id === userId ||
    (presenter.email && presenter.email.toLowerCase() === myEmail)
  )
  if (presenterMatch) myRoles.push('Presenter')
  if (myRoles.length === 0) myRoles.push('Author')

  return {
    id: s.id,
    title: s.title,
    status: s.status,
    presenterFirst,
    presenterLast,
    presenterDisplay,
    presenterEmail,
    myRoles,
    editable: s.status === 'draft' || s.status === 'submitted',
  }
}

function StatusPill({ status }: { status: SubmissionStatus }) {
  const tone =
    status === 'draft'
      ? 'bg-gray-100 text-gray-700'
      : status === 'submitted'
        ? 'bg-blue-100 text-blue-800'
        : status === 'finalized'
          ? 'bg-[#1E4D2B] text-white'
          : 'bg-red-100 text-red-800'
  const label =
    status === 'draft'
      ? 'Draft'
      : status === 'submitted'
        ? 'Submitted'
        : status === 'finalized'
          ? 'Finalized'
          : 'Withdrawn'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tone}`}>
      {label}
    </span>
  )
}
