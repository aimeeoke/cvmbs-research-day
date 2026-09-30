import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import type {
  AuthorInput,
  SubmissionInput,
  UserAmbassadorCert,
} from './actions'
import { SubmitForm } from './submit-form'
import type { FacultyOption } from './submit-authors'
import type {
  PreferredPresentationType,
  SessionPreference,
  SubmissionStatus,
} from '@/lib/types/database'

export const metadata = {
  title: 'Submit · CVMBS Research Day',
}

type SearchParams = Promise<{ id?: string }>

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/abstracts')

  const { id } = await searchParams
  if (!id) redirect('/abstracts')

  const supabase = await createClient()

  const [
    { data: event },
    { data: departments },
    { data: facultyRows },
    { data: submission, error: subErr },
  ] = await Promise.all([
    supabase.from('events').select('*').eq('is_active', true).maybeSingle(),
    supabase.from('departments').select('id, name, short_name').order('sort_order'),
    supabase
      .from('faculty')
      .select(
        'id, full_name, email, is_active, my_green_labs_certified, green_paw_certified, department_id, departments(name)'
      )
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('submissions')
      .select('*, submission_authors(*)')
      .eq('id', id)
      .maybeSingle(),
  ])

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <p className="text-amber-900 font-medium">Submissions are not open yet.</p>
          <p className="text-sm text-amber-800 mt-1">
            The 2027 event is still being set up. Please check back soon.
          </p>
        </div>
      </div>
    )
  }

  if (subErr || !submission) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-900 font-medium">Submission not found.</p>
          <p className="text-sm text-red-800 mt-1">
            You may not have access to this abstract, or it may have been deleted.
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
      email: (f as { email?: string | null }).email ?? null,
    }
  })

  const now = Date.now()
  const finalizeDeadline = event.finalize_deadline_at
    ? new Date(event.finalize_deadline_at).getTime()
    : null
  const editingLocked =
    submission.status === 'finalized' ||
    submission.status === 'withdrawn' ||
    (finalizeDeadline !== null && now > finalizeDeadline)

  const rawAuthors =
    (submission as { submission_authors?: unknown[] }).submission_authors ?? []

  const initialAuthors: AuthorInput[] = rawAuthors
    .map((row) => row as {
      position: number
      profile_id: string | null
      faculty_id: string | null
      display_name: string | null
      email: string | null
      department_id: string | null
      affiliation: string | null
      is_presenter: boolean
      is_mentor: boolean
    })
    .sort((a, b) => a.position - b.position)
    .map((a) => ({
      position: a.position,
      profile_id: a.profile_id,
      faculty_id: a.faculty_id,
      display_name: a.display_name,
      email: a.email,
      department_id: a.department_id ?? null,
      affiliation: a.affiliation ?? null,
      is_presenter: a.is_presenter,
      is_mentor: a.is_mentor,
    }))

  const initial: SubmissionInput = {
    title: submission.title ?? '',
    abstract: submission.abstract ?? '',
    classification: submission.classification ?? user.profile?.classification ?? null,
    department_id:
      submission.department_id ?? user.profile?.department_id ?? null,
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

  // Collect every email attached to this abstract's authors (plus any
  // linked-faculty emails looked up from the roster) so the Green Labs
  // cert section can pre-populate status for all of them in one query.
  const authorEmails = new Set<string>()
  const userEmailLc = (user.email ?? '').toLowerCase()
  if (userEmailLc) authorEmails.add(userEmailLc)
  for (const a of initialAuthors) {
    const e = (a.email ?? '').trim().toLowerCase()
    if (e) authorEmails.add(e)
    if (a.faculty_id) {
      const f = facultyOptions.find((fo) => fo.id === a.faculty_id)
      const fe = (f?.email ?? '').trim().toLowerCase()
      if (fe) authorEmails.add(fe)
    }
  }

  let initialAmbassadorCerts: Record<string, UserAmbassadorCert> = {}
  if (authorEmails.size > 0) {
    const emailList = Array.from(authorEmails)
    // ILIKE-list via OR — Supabase JS doesn't have a case-insensitive `in`.
    const orClause = emailList.map((e) => `email.ilike.${e}`).join(',')
    const { data: certRows } = await supabase
      .from('certifications')
      .select(
        'id, source, storage_path, verified_at, valid_through, uploaded_at, uploaded_by, email, profile_id'
      )
      .eq('kind', 'ambassador')
      .or(orClause)
      .order('verified_at', { ascending: false, nullsFirst: false })
      .order('uploaded_at', { ascending: false })

    for (const row of certRows ?? []) {
      const key = ((row.email as string | null) ?? '').toLowerCase()
      if (!key || initialAmbassadorCerts[key]) continue // keep first (highest-priority)
      initialAmbassadorCerts[key] = {
        id: row.id as string,
        source: row.source as UserAmbassadorCert['source'],
        storage_path: (row.storage_path as string | null) ?? null,
        verified_at: (row.verified_at as string | null) ?? null,
        valid_through: (row.valid_through as string | null) ?? null,
        uploaded_at: row.uploaded_at as string,
        uploaded_by: (row.uploaded_by as string | null) ?? null,
        email: (row.email as string | null) ?? null,
        profile_id: (row.profile_id as string | null) ?? null,
      }
    }
  }

  return (
    <SubmitForm
      submissionId={submission.id}
      status={submission.status as SubmissionStatus}
      initial={initial}
      departments={(departments ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        short_name: (d as { short_name?: string | null }).short_name ?? null,
      }))}
      facultyOptions={facultyOptions}
      editingLocked={editingLocked}
      finalizeDeadline={event.finalize_deadline_at}
      isSubmitter={submission.submitter_id === user.id}
      currentUser={
        user.email
          ? { profileId: user.id, email: user.email }
          : null
      }
      initialAmbassadorCerts={initialAmbassadorCerts}
    />
  )
}
