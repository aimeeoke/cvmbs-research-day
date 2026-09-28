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
 * Delete a draft that hasn't been submitted yet. RLS restricts this to the
 * submitter of the row and only while status='draft'.
 */
export async function deleteDraftSubmission(submissionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/abstracts')

  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submissionId)
    .eq('status', 'draft')

  if (error) throw new Error(error.message)
  revalidatePath('/abstracts')
  return { ok: true as const }
}

/**
 * Ask an admin to withdraw a submitted or finalized abstract. This only
 * sets a timestamp; an admin still has to flip status='withdrawn'.
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
    .in('status', ['submitted', 'finalized'])

  if (error) throw new Error(error.message)
  revalidatePath('/abstracts')
  return { ok: true as const }
}
