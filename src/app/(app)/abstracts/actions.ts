'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createDraftSubmission, type SubmitterRole } from '../submit/actions'

const VALID_ROLES: SubmitterRole[] = ['presenter', 'submitter', 'mentor']

/**
 * Create a new draft (optionally pre-seeded with the current user as the
 * presenter or a mentor) and redirect straight to its edit page.
 */
export async function startNewSubmission(role: SubmitterRole = 'submitter') {
  const safeRole: SubmitterRole = VALID_ROLES.includes(role) ? role : 'submitter'
  const id = await createDraftSubmission(safeRole)
  redirect(`/submit?id=${id}`)
}

/**
 * Delete a submission the current user owns. Works for both draft and
 * submitted statuses — RLS + the .in() filter here both allow either.
 * Finalized/withdrawn require the withdrawal-request flow instead.
 */
export async function deleteOwnSubmission(submissionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/abstracts')

  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submissionId)
    .in('status', ['draft', 'submitted'])

  if (error) throw new Error(error.message)
  revalidatePath('/abstracts')
  return { ok: true as const }
}

/**
 * Ask an admin to withdraw a FINALIZED abstract. Pre-finalize the submitter
 * can just delete it themselves (see deleteOwnSubmission). Post-finalize the
 * abstract is in the printed program / judge assignments, so admin gates
 * the removal.
 */
export async function requestWithdrawal(submissionId: string, reason: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/abstracts')

  const trimmed = reason.trim()
  if (!trimmed) throw new Error('Please give a short reason so the admin can review.')

  const { error } = await supabase
    .from('submissions')
    .update({
      withdrawal_requested_at: new Date().toISOString(),
      withdrawal_requested_reason: trimmed,
    })
    .eq('id', submissionId)
    .eq('status', 'finalized')

  if (error) throw new Error(error.message)
  revalidatePath('/abstracts')
  return { ok: true as const }
}
