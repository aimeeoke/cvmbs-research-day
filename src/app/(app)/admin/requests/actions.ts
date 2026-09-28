'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types/database'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin/requests')

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
  const isAdmin = (roleRows ?? []).some((r) => r.role === 'admin')
  if (!isAdmin) throw new Error('Not authorized.')

  return { supabase, user }
}

export async function grantRoleRequest(requestId: string) {
  const { supabase, user } = await requireAdmin()

  const { data: req, error: loadErr } = await supabase
    .from('role_requests')
    .select('id, user_id, requested_role, status')
    .eq('id', requestId)
    .maybeSingle()
  if (loadErr) throw new Error(loadErr.message)
  if (!req) throw new Error('Request not found.')
  if (req.status !== 'pending')
    throw new Error('That request has already been resolved.')

  // 1) Insert the role (idempotent on the PK).
  const { error: insErr } = await supabase
    .from('user_roles')
    .insert({
      user_id: req.user_id,
      role: req.requested_role as UserRole,
      granted_by: user.id,
    })
  // 23505 = unique_violation (already had the role) — treat as success.
  if (insErr && insErr.code !== '23505') throw new Error(insErr.message)

  // 2) Mark the request granted.
  const { error: updErr } = await supabase
    .from('role_requests')
    .update({
      status: 'granted',
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq('id', requestId)
  if (updErr) throw new Error(updErr.message)

  revalidatePath('/admin/requests')
  revalidatePath('/admin')
  return { ok: true as const }
}

export async function denyRoleRequest(requestId: string) {
  const { supabase, user } = await requireAdmin()

  const { data: req, error: loadErr } = await supabase
    .from('role_requests')
    .select('id, status')
    .eq('id', requestId)
    .maybeSingle()
  if (loadErr) throw new Error(loadErr.message)
  if (!req) throw new Error('Request not found.')
  if (req.status !== 'pending')
    throw new Error('That request has already been resolved.')

  const { error: updErr } = await supabase
    .from('role_requests')
    .update({
      status: 'denied',
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq('id', requestId)
  if (updErr) throw new Error(updErr.message)

  revalidatePath('/admin/requests')
  revalidatePath('/admin')
  return { ok: true as const }
}

export async function approveWithdrawal(submissionId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('submissions')
    .update({ status: 'withdrawn' })
    .eq('id', submissionId)
    .not('withdrawal_requested_at', 'is', null)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/requests')
  revalidatePath('/admin')
  revalidatePath('/admin/abstracts')
  return { ok: true as const }
}

export async function rejectWithdrawal(submissionId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('submissions')
    .update({
      withdrawal_requested_at: null,
      withdrawal_requested_reason: null,
    })
    .eq('id', submissionId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/requests')
  revalidatePath('/admin')
  revalidatePath('/admin/abstracts')
  return { ok: true as const }
}
