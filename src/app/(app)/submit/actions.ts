'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type {
  PreferredPresentationType,
  SessionPreference,
  SubmissionStatus,
} from '@/lib/types/database'

export type AuthorRole = 'author' | 'presenter' | 'mentor'

export type AuthorInput = {
  position: number
  profile_id: string | null
  faculty_id: string | null
  display_name: string | null
  email: string | null
  is_presenter: boolean
  is_mentor: boolean
}

export type SubmissionInput = {
  title: string
  abstract: string
  classification: string | null
  department_id: string | null
  program: string | null
  research_type: string | null
  research_stage: string | null
  funding: string | null
  affiliations: string[]
  preferred_presentation_type: PreferredPresentationType | null
  session_preference: SessionPreference | null
  previously_presented: boolean | null
  previous_format: 'Oral' | 'Poster' | null
  authors: AuthorInput[]
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/abstracts')
  return { supabase, user }
}

async function getActiveEvent(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw new Error(`Could not load active event: ${error.message}`)
  if (!data) throw new Error('No active event configured.')
  return data
}

export type SubmitterRole = 'presenter' | 'submitter' | 'mentor'

/**
 * Creates a fresh draft submission owned by the current user and returns its id.
 * Called from the Abstract Portal "New submission" button after the user picks
 * their role on the abstract. If they said they're the presenter or mentor, we
 * seed a matching author row with their profile info so the form starts pre-
 * filled. "submitter" means they're a proxy — we don't insert them anywhere.
 */
export async function createDraftSubmission(
  role: SubmitterRole = 'submitter'
): Promise<string> {
  const { supabase, user } = await requireUser()
  const event = await getActiveEvent(supabase)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, first_name, last_name, email')
    .eq('id', user.id)
    .maybeSingle()

  const displayName =
    profile?.full_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
    null

  const { data: created, error } = await supabase
    .from('submissions')
    .insert({
      event_id: event.id,
      submitter_id: user.id,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error || !created) throw new Error(error?.message ?? 'Failed to create draft')

  if (role === 'presenter' || role === 'mentor') {
    const { error: seedErr } = await supabase.from('submission_authors').insert({
      submission_id: created.id,
      position: 1,
      profile_id: user.id,
      display_name: displayName,
      email: (profile?.email ?? user.email ?? null)?.toLowerCase() ?? null,
      is_presenter: role === 'presenter',
      is_mentor: role === 'mentor',
    })
    if (seedErr) throw new Error(seedErr.message)
  }

  return created.id
}

async function persistSubmission(
  submissionId: string,
  input: SubmissionInput,
  nextStatus: SubmissionStatus | null
) {
  const { supabase, user } = await requireUser()

  // Load the submission for status invariants. Access is enforced by RLS —
  // if the user is not the submitter, presenter, mentor, or admin, this
  // returns null.
  const { data: current, error: loadErr } = await supabase
    .from('submissions')
    .select('id, status, event_id')
    .eq('id', submissionId)
    .maybeSingle()

  if (loadErr) throw new Error(loadErr.message)
  if (!current) throw new Error('Submission not found or you do not have access.')

  // Admins can edit any submission regardless of status (used for /admin/abstracts
  // fix-ups). Everyone else is locked out of finalized/withdrawn rows.
  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
  const isAdmin = (roleRows ?? []).some((r) => r.role === 'admin')

  if (
    !isAdmin &&
    (current.status === 'finalized' || current.status === 'withdrawn')
  ) {
    throw new Error('This submission is locked and can no longer be edited.')
  }

  // Enforce "one presentation per presenter" at submit/finalize time.
  if (nextStatus === 'submitted' || nextStatus === 'finalized') {
    const presenter = input.authors.find((a) => a.is_presenter)
    if (!presenter) {
      throw new Error('Mark one author as the Presenter before submitting.')
    }
    const presenterEmail = presenter.email?.trim().toLowerCase()
    if (!presenterEmail) {
      throw new Error(
        'The Presenter must have an email address before you can submit.'
      )
    }

    const { data: conflicts, error: dupErr } = await supabase
      .from('submission_authors')
      .select('submission_id, submissions!inner(id, status, event_id)')
      .eq('is_presenter', true)
      .ilike('email', presenterEmail)

    if (dupErr) throw new Error(dupErr.message)

    const otherActive = (conflicts ?? []).filter((row) => {
      const s = (row as unknown as { submissions: { id: string; status: string; event_id: string } })
        .submissions
      return (
        s &&
        s.event_id === current.event_id &&
        s.id !== submissionId &&
        (s.status === 'submitted' || s.status === 'finalized')
      )
    })

    if (otherActive.length > 0) {
      throw new Error(
        'This presenter already has a submitted abstract for this event. ' +
          'Presenters can only present a single time — only the first submitted abstract will be accepted. ' +
          'If this is a mistake, contact the Research Day admin.'
      )
    }
  }

  const now = new Date().toISOString()
  const patch: Record<string, unknown> = {
    title: input.title,
    abstract: input.abstract,
    classification: input.classification,
    department_id: input.department_id,
    program: input.program,
    research_type: input.research_type,
    research_stage: input.research_stage,
    funding: input.funding,
    affiliations: input.affiliations,
    preferred_presentation_type: input.preferred_presentation_type,
    session_preference: input.session_preference,
    previously_presented: input.previously_presented,
    previous_format: input.previous_format,
  }

  if (nextStatus === 'submitted' && current.status !== 'submitted') {
    patch.status = 'submitted'
    patch.submitted_at = now
  } else if (nextStatus === 'finalized') {
    patch.status = 'finalized'
    patch.finalized_at = now
    if (!current.status || current.status === 'draft') patch.submitted_at = now
  }

  const { error: updErr } = await supabase
    .from('submissions')
    .update(patch)
    .eq('id', submissionId)

  if (updErr) throw new Error(updErr.message)

  // Replace authors wholesale — simple and correct for this scale.
  const { error: delErr } = await supabase
    .from('submission_authors')
    .delete()
    .eq('submission_id', submissionId)

  if (delErr) throw new Error(delErr.message)

  const validAuthors = input.authors
    .filter((a) => a.profile_id || a.faculty_id || (a.display_name && a.display_name.trim()))
    .map((a, i) => ({
      submission_id: submissionId,
      position: i + 1,
      profile_id: a.profile_id,
      faculty_id: a.faculty_id,
      display_name: a.display_name?.trim() || null,
      email: a.email?.trim().toLowerCase() || null,
      is_presenter: !!a.is_presenter,
      is_mentor: !!a.is_mentor,
    }))

  if (validAuthors.length > 0) {
    const { error: insErr } = await supabase
      .from('submission_authors')
      .insert(validAuthors)
    if (insErr) throw new Error(insErr.message)
  }
}

export async function saveDraft(submissionId: string, input: SubmissionInput) {
  await persistSubmission(submissionId, input, null)
  revalidatePath('/abstracts')
  revalidatePath(`/submit`)
  return { ok: true as const }
}

export async function submitDraft(submissionId: string, input: SubmissionInput) {
  await persistSubmission(submissionId, input, 'submitted')
  revalidatePath('/abstracts')
  revalidatePath(`/submit`)
  return { ok: true as const }
}

export async function finalizeSubmission(submissionId: string, input: SubmissionInput) {
  await persistSubmission(submissionId, input, 'finalized')
  revalidatePath('/abstracts')
  revalidatePath(`/submit`)
  return { ok: true as const }
}
