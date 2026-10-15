import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { nameMatchKey } from '@/lib/name-match'
import type {
  AuthorInput,
  SubmissionInput,
  UserAmbassadorCert,
} from './actions'
import { authorIdentityKey } from './author-certs-section'
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
    presenter_previous_rd_count:
      (submission as { presenter_previous_rd_count?: number | null })
        .presenter_previous_rd_count ?? null,
    authors: initialAuthors,
  }

  const userEmailLc = (user.email ?? '').toLowerCase()

  // Load every verified ambassador cert in one go. 151 preloaded MGL rows
  // plus a handful of self-uploads — small, flat scan is cheaper than
  // chaining per-email queries. We'll match in JS on email OR name.
  //
  // Name match handles two realities we can't fix with email:
  //   1. CSU users have 2–3 email aliases (first.last, legacy ename,
  //      personal) and MGL only has whatever address they entered at
  //      training.
  //   2. The preloaded MGL CSV has NO emails at all — just first/last.
  const { data: allCertRows } = await supabase
    .from('certifications')
    .select(
      'id, source, storage_path, verified_at, valid_through, uploaded_at, uploaded_by, email, profile_id, first_name, last_name'
    )
    .eq('kind', 'ambassador')
    .not('verified_at', 'is', null)
    .order('verified_at', { ascending: false, nullsFirst: false })
    .order('uploaded_at', { ascending: false })

  type CertRow = {
    id: string
    source: UserAmbassadorCert['source']
    storage_path: string | null
    verified_at: string | null
    valid_through: string | null
    uploaded_at: string
    uploaded_by: string | null
    email: string | null
    profile_id: string | null
    first_name: string | null
    last_name: string | null
  }
  const certs = (allCertRows ?? []) as unknown as CertRow[]

  // Index certs by email AND by name key so lookups are O(1) per author.
  const byEmail = new Map<string, CertRow>()
  const byNameKey = new Map<string, CertRow>()
  for (const c of certs) {
    const em = (c.email ?? '').toLowerCase()
    if (em && !byEmail.has(em)) byEmail.set(em, c)
    const nk = nameMatchKey(c.first_name, c.last_name)
    if (nk && !byNameKey.has(nk)) byNameKey.set(nk, c)
  }

  const toUserCert = (c: CertRow): UserAmbassadorCert => ({
    id: c.id,
    source: c.source,
    storage_path: c.storage_path,
    verified_at: c.verified_at,
    valid_through: c.valid_through,
    uploaded_at: c.uploaded_at,
    uploaded_by: c.uploaded_by,
    email: c.email,
    profile_id: c.profile_id,
  })

  // Build the initial cert map using the same composite identity key the
  // client-side AuthorCertsSection uses (email if present, else name key).
  // For each candidate author, pull the strongest cert hit (email first,
  // then name key) and park it under their identity key.
  const initialAmbassadorCerts: Record<string, UserAmbassadorCert> = {}

  type AuthorIdentity = {
    email: string
    firstName: string | null
    lastName: string | null
  }
  const identities: AuthorIdentity[] = []

  if (userEmailLc) {
    const prof = user.profile
    identities.push({
      email: userEmailLc,
      firstName: prof?.first_name ?? null,
      lastName: prof?.last_name ?? null,
    })
  }
  for (const a of initialAuthors) {
    const em = (a.email ?? '').trim().toLowerCase()
    // Prefer faculty roster's full_name when the row is a linked faculty
    // (handles middle names / preferred spelling the roster has but the
    // free-text display name might not).
    let fullName = a.display_name ?? ''
    if (a.faculty_id) {
      const f = facultyOptions.find((fo) => fo.id === a.faculty_id)
      if (f?.full_name) fullName = f.full_name
    }
    const parts = fullName.trim().split(/\s+/).filter(Boolean)
    const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] ?? null
    const lastName = parts.length > 1 ? parts[parts.length - 1] : null
    identities.push({ email: em, firstName, lastName })
  }

  for (const id of identities) {
    const key = authorIdentityKey(id)
    if (!key || initialAmbassadorCerts[key]) continue
    const emailHit = id.email ? byEmail.get(id.email) : undefined
    const nameKey = nameMatchKey(id.firstName, id.lastName)
    const nameHit = nameKey ? byNameKey.get(nameKey) : undefined
    const match = emailHit ?? nameHit
    if (match) initialAmbassadorCerts[key] = toUserCert(match)
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
