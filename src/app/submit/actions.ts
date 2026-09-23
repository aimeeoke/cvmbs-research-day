'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type {
  PreferredPresentationType,
  SessionPreference,
  SubmissionStatus,
} from '@/lib/types/database'

export type AuthorInput = {
  position: number
  profile_id: string | null
  faculty_id: string | null
  display_name: string | null
  is_presenter: boolean
  is_mentor: boolean
}

export type SubmissionInput = {
  title: string
  abstract: string
  classification: string | null
  department_id: string | null
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
  if (!user) redirect('/login?redirect=/submit')
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

/**
 * Ensures there is a draft submission for the current user + active event.
 * Returns the submission id.
 */
export async function ensureDraftSubmission(): Promise<string> {
  const { supabase, user } = await requireUser()
  const event = await getActiveEvent(supabase)

  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('event_id', event.id)
    .eq('submitter_id', user.id)
    .maybeSingle()

  if (existing) return existing.id

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
  return created.id
}

async function persistSubmission(
  submissionId: string,
  input: SubmissionInput,
  nextStatus: SubmissionStatus | null
) {
  const { supabase, user } = await requireUser()

  // Load the submission to enforce ownership and status invariants
  const { data: current, error: loadErr } = await supabase
    .from('submissions')
    .select('id, submitter_id, status')
    .eq('id', submissionId)
    .maybeSingle()

  if (loadErr) throw new Error(loadErr.message)
  if (!current) throw new Error('Submission not found')
  if (current.submitter_id !== user.id) throw new Error('Not your submission')
  if (current.status === 'finalized' || current.status === 'withdrawn') {
    throw new Error('This submission is locked and can no longer be edited.')
  }

  const now = new Date().toISOString()
  const patch: Record<string, unknown> = {
    title: input.title,
    abstract: input.abstract,
    classification: input.classification,
    department_id: input.department_id,
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
  revalidatePath('/submit')
  return { ok: true as const }
}

export async function submitDraft(submissionId: string, input: SubmissionInput) {
  await persistSubmission(submissionId, input, 'submitted')
  revalidatePath('/submit')
  return { ok: true as const }
}

export async function finalizeSubmission(submissionId: string, input: SubmissionInput) {
  await persistSubmission(submissionId, input, 'finalized')
  revalidatePath('/submit')
  return { ok: true as const }
}
