/**
 * Storage helpers for the `certifications` Supabase bucket.
 *
 * The bucket is created by supabase/migrations/2026-09-29_certifications_bucket.sql.
 * See that file for RLS policies and the reasoning behind them.
 *
 * Path convention (enforced here, not in RLS):
 *   ambassadors/{profile_id}/{timestamp}-{safe_name}   individual Ambassador cert
 *   labs/{faculty_id}/{timestamp}-{safe_name}          lab / clinic certification
 *
 * Bucket is public, so getCertificationPublicUrl() returns a stable URL you
 * can put in an <a href> or an <img src> without a signed-URL round-trip.
 *
 * Reusable pattern for other Aimee projects (e.g. the CRC system):
 * copy this file + the migration into the new repo, rename the bucket, and
 * you're set. No other moving parts.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export const CERTIFICATIONS_BUCKET = 'certifications'

/** 10 MB — matches the bucket-level file_size_limit set in the migration. */
export const CERTIFICATIONS_MAX_BYTES = 10 * 1024 * 1024

/** MIME types accepted by both the bucket and the app-side validator. */
export const CERTIFICATIONS_ALLOWED_MIME = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const

export type CertificationKind = 'ambassador' | 'lab'

/**
 * Build the storage path for a certification file. Combines the kind's
 * top-level folder with an owner id (profile_id for ambassadors, faculty_id
 * for labs), a millisecond timestamp (prevents collisions when the same
 * person re-uploads), and a sanitized filename.
 */
export function buildCertificationPath(
  kind: CertificationKind,
  ownerId: string,
  originalName: string
): string {
  const prefix = kind === 'ambassador' ? 'ambassadors' : 'labs'
  const safeName =
    originalName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(-100) || 'certificate'
  return `${prefix}/${ownerId}/${Date.now()}-${safeName}`
}

/**
 * Client-side upload. Pass a browser File (from an <input type="file">).
 * Returns the storage path (relative to the bucket) so callers can persist
 * it wherever they track "which cert belongs to whom".
 *
 * Throws on validation failures with a clear message so the caller can
 * surface it in the form UI. Storage errors (network, permission) propagate
 * as-is from the Supabase SDK.
 */
export async function uploadCertification(
  supabase: SupabaseClient,
  args: {
    kind: CertificationKind
    ownerId: string
    file: File
  }
): Promise<{ path: string }> {
  const { kind, ownerId, file } = args

  if (file.size === 0) {
    throw new Error('That file is empty.')
  }
  if (file.size > CERTIFICATIONS_MAX_BYTES) {
    throw new Error(
      `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 10 MB.`
    )
  }
  if (
    file.type &&
    !CERTIFICATIONS_ALLOWED_MIME.includes(
      file.type as (typeof CERTIFICATIONS_ALLOWED_MIME)[number]
    )
  ) {
    throw new Error(
      `Only PDF, PNG, or JPEG files are accepted (got ${file.type || 'unknown type'}).`
    )
  }

  const path = buildCertificationPath(kind, ownerId, file.name)

  const { data, error } = await supabase.storage
    .from(CERTIFICATIONS_BUCKET)
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) throw error
  return { path: data.path }
}

/**
 * Public URL for a stored certification. Because the bucket is public, this
 * is a plain CDN URL — safe to embed directly, no signature needed.
 */
export function getCertificationPublicUrl(
  supabase: SupabaseClient,
  path: string
): string {
  const { data } = supabase.storage
    .from(CERTIFICATIONS_BUCKET)
    .getPublicUrl(path)
  return data.publicUrl
}

/**
 * Delete a certification file. Callable from server actions (with service
 * role or a regular authed client — RLS restricts to uploader/admin either
 * way). Callers should also clear the DB pointer that references this path.
 */
export async function deleteCertification(
  supabase: SupabaseClient,
  path: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(CERTIFICATIONS_BUCKET)
    .remove([path])
  if (error) throw error
}
