'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Hard-delete a submission as admin. Cascades to submission_authors via the
 * ON DELETE CASCADE foreign key. Strict admin only — committee members are
 * NOT allowed. Used by the admin abstracts browser + detail view to clean
 * up test rows and genuinely-remove problem submissions.
 *
 * The underlying RLS policy `submissions_admin_delete` already gates this
 * at the DB level, but we check in the action too so a non-admin gets a
 * clear error rather than a silent no-op.
 */
export async function adminDeleteSubmission(submissionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin/abstracts')

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
  const isAdmin = (roleRows ?? []).some((r) => r.role === 'admin')
  if (!isAdmin) throw new Error('Only admins can delete submissions.')

  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submissionId)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/abstracts')
  revalidatePath('/admin')
  return { ok: true as const }
}
