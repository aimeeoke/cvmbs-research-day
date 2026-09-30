'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types/database'

const REQUESTABLE_ROLES = new Set<UserRole>([
  'mentor',
  'judge',
  'committee_member',
  'admin',
  'volunteer',
])

export type RoleRequestInput = {
  requested_role: UserRole
  note: string
}

export async function submitRoleRequest(input: RoleRequestInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/settings')

  if (!REQUESTABLE_ROLES.has(input.requested_role)) {
    throw new Error('That role cannot be requested through this form.')
  }

  const note = input.note.trim() || null

  const { error } = await supabase.from('role_requests').insert({
    user_id: user.id,
    requested_role: input.requested_role,
    note,
    status: 'pending',
  })

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
  return { ok: true as const }
}

