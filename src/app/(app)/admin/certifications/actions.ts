'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin/certifications')

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
  const isAdmin = (roleRows ?? []).some((r) => r.role === 'admin')
  if (!isAdmin) throw new Error('Not authorized.')

  return { supabase, user }
}

/**
 * Approve a pending certification. Stamps verified_at + verified_by.
 * We deliberately don't set valid_through — for ambassador certs there's
 * no hard expiry (person keeps the training), and lab certs expire based
 * on their certifying body's schedule which we'd need to capture separately.
 * Points calc will check `verified_at IS NOT NULL`.
 */
export async function approveCertification(certId: string) {
  const { supabase, user } = await requireAdmin()

  const { data: existing, error: loadErr } = await supabase
    .from('certifications')
    .select('id, verified_at')
    .eq('id', certId)
    .maybeSingle()
  if (loadErr) throw new Error(loadErr.message)
  if (!existing) throw new Error('Certification not found.')
  if (existing.verified_at) {
    throw new Error('This certification is already verified.')
  }

  const { error } = await supabase
    .from('certifications')
    .update({
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq('id', certId)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/certifications')
  revalidatePath('/admin')
  revalidatePath('/submit')
  return { ok: true as const }
}

/**
 * Reject a certification. Deletes both the DB row and the storage file
 * (if any). The person can re-upload after — this isn't a permanent
 * "banned" status, just "this specific upload didn't check out."
 */
export async function denyCertification(certId: string) {
  const { supabase } = await requireAdmin()

  const { data: existing, error: loadErr } = await supabase
    .from('certifications')
    .select('id, storage_path')
    .eq('id', certId)
    .maybeSingle()
  if (loadErr) throw new Error(loadErr.message)
  if (!existing) throw new Error('Certification not found.')

  if (existing.storage_path) {
    await supabase.storage
      .from('certifications')
      .remove([existing.storage_path])
  }
  const { error } = await supabase
    .from('certifications')
    .delete()
    .eq('id', certId)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/certifications')
  revalidatePath('/admin')
  revalidatePath('/submit')
  return { ok: true as const }
}

/**
 * Undo a previous approval — clears verified_at + verified_by so the cert
 * shows up as pending again. Escape hatch for "approved by mistake."
 * Doesn't touch the file or the row.
 */
export async function unverifyCertification(certId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('certifications')
    .update({ verified_at: null, verified_by: null })
    .eq('id', certId)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/certifications')
  revalidatePath('/admin')
  revalidatePath('/submit')
  return { ok: true as const }
}
