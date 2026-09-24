'use server'

import { redirect } from 'next/navigation'
import { createDraftSubmission } from '../submit/actions'

/**
 * Create a new draft and redirect straight to its edit page.
 * Called from the "New submission" button in the Abstract Portal.
 */
export async function startNewSubmission() {
  const id = await createDraftSubmission()
  redirect(`/submit?id=${id}`)
}
