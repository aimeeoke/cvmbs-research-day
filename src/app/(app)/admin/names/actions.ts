'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Accepts admin OR committee_member. Committee members have full write
// access here — renaming unlinked author names is part of the review
// workflow committee owns alongside admin.
async function requireAdminAccess() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin/names')

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
  const hasAccess = (roleRows ?? []).some(
    (r) => r.role === 'admin' || r.role === 'committee_member'
  )
  if (!hasAccess) throw new Error('Not authorized.')

  return { supabase }
}

/**
 * Rename every unlinked author row whose display_name matches `oldName`
 * (exact match, case-sensitive) to `newName`. Only touches rows where both
 * profile_id and faculty_id are NULL — linked rows are the source of truth
 * for those people and shouldn't be edited from here.
 *
 * Returns the number of rows updated so the client can confirm what happened.
 */
export async function renameAuthorName(oldName: string, newName: string) {
  const { supabase } = await requireAdminAccess()

  const cleanOld = oldName.trim()
  const cleanNew = newName.trim()

  if (!cleanOld) throw new Error('Current name is empty.')
  if (!cleanNew) throw new Error('New name is empty.')
  if (cleanOld === cleanNew) {
    return { ok: true as const, updated: 0 }
  }

  const { data, error } = await supabase
    .from('submission_authors')
    .update({ display_name: cleanNew })
    .eq('display_name', cleanOld)
    .is('profile_id', null)
    .is('faculty_id', null)
    .select('id')

  if (error) throw new Error(error.message)

  revalidatePath('/admin/names')
  revalidatePath('/admin/abstracts')
  revalidatePath('/abstracts')

  return { ok: true as const, updated: data?.length ?? 0 }
}
