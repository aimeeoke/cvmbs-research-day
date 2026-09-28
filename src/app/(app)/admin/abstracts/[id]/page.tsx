import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type {
  PreferredPresentationType,
  SessionPreference,
  SubmissionStatus,
} from '@/lib/types/database'
import { SubmitForm } from '../../../submit/submit-form'
import type {
  AuthorInput,
  SubmissionInput,
} from '../../../submit/actions'
import type { FacultyOption } from '../../../submit/submit-authors'

export const metadata = { title: 'Abstract · Admin' }

type PageParams = Promise<{ id: string }>

export default async function AdminAbstractDetail({
  params,
}: {
  params: PageParams
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: event },
    { data: departments },
    { data: facultyRows },
    { data: submission, error: subErr },
  ] = await Promise.all([
    supabase.from('events').select('*').eq('is_active', true).maybeSingle(),
    supabase.from('departments').select('id, name').order('sort_order'),
    supabase
      .from('faculty')
      .select(
        'id, full_name, is_active, my_green_labs_certified, green_paw_certified, department_id, departments(name)'
      )
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('submissions')
      .select('*, submission_authors(*)')
      .eq('id', id)
      .maybeSingle(),
  ])

  if (subErr || !submission) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Link
          href="/admin/abstracts"
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          ← Back to abstracts
        </Link>
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-900 font-medium">Abstract not found.</p>
          <p className="text-sm text-red-800 mt-1">
            The submission may have been deleted.
          </p>
        </div>
      </div>
    )
  }

  const facultyOptions: FacultyOption[] = (facultyRows ?? []).map((f) => {
    const dept = (f as unknown as { departments: { name: string } | null }).departments
    return {
      id: f.id,
      full_name: f.full_name,
      department_name: dept?.name ?? null,
      green_labs_certified: !!(f.my_green_labs_certified || f.green_paw_certified),
    }
  })

  const rawAuthors =
    (submission as { submission_authors?: unknown[] }).submission_authors ?? []

  const initialAuthors: AuthorInput[] = rawAuthors
    .map(
      (row) =>
        row as {
          position: number
          profile_id: string | null
          faculty_id: string | null
          display_name: string | null
          email: string | null
          is_presenter: boolean
          is_mentor: boolean
        }
    )
    .sort((a, b) => a.position - b.position)
    .map((a) => ({
      position: a.position,
      profile_id: a.profile_id,
      faculty_id: a.faculty_id,
      display_name: a.display_name,
      email: a.email,
      is_presenter: a.is_presenter,
      is_mentor: a.is_mentor,
    }))

  const initial: SubmissionInput = {
    title: submission.title ?? '',
    abstract: submission.abstract ?? '',
    classification: submission.classification ?? null,
    department_id: submission.department_id ?? null,
    program: (submission as { program?: string | null }).program ?? null,
    research_type: submission.research_type ?? null,
    research_stage: submission.research_stage ?? null,
    funding: submission.funding ?? null,
    affiliations: (submission.affiliations as string[] | null) ?? [],
    preferred_presentation_type:
      (submission.preferred_presentation_type as PreferredPresentationType | null) ?? null,
    session_preference:
      (submission.session_preference as SessionPreference | null) ?? null,
    previously_presented: submission.previously_presented,
    previous_format: (submission.previous_format as 'Oral' | 'Poster' | null) ?? null,
    authors: initialAuthors,
  }

  const withdrawalPending =
    submission.withdrawal_requested_at && submission.status !== 'withdrawn'

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
        <Link
          href="/admin/abstracts"
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          ← Back to abstracts
        </Link>
        {withdrawalPending && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <strong>Withdrawal requested.</strong>{' '}
            {submission.withdrawal_requested_reason ?? '(no reason given)'}{' '}
            —{' '}
            <Link
              href="/admin/requests"
              className="font-semibold underline hover:text-amber-950"
            >
              review in Requests
            </Link>
          </div>
        )}
      </div>

      <SubmitForm
        submissionId={submission.id}
        status={submission.status as SubmissionStatus}
        initial={initial}
        departments={(departments ?? []).map((d) => ({
          id: d.id,
          name: d.name,
        }))}
        facultyOptions={facultyOptions}
        editingLocked
        finalizeDeadline={event?.finalize_deadline_at ?? null}
        isSubmitter={false}
        adminView
      />
    </div>
  )
}
