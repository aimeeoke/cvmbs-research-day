'use client'

import { useRef, useState, useTransition } from 'react'
import { CheckCircle2, Clock, Leaf, Loader2, Trash2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  CERTIFICATIONS_ALLOWED_MIME,
  CERTIFICATIONS_MAX_BYTES,
  uploadCertification,
} from '@/lib/storage'
import {
  deleteAmbassadorCert,
  recordAmbassadorCert,
  type UserAmbassadorCert,
} from './actions'

/**
 * Green Labs Ambassador upload widget.
 *
 * Scoped to the SIGNED-IN USER (not the abstract's presenter). It reads and
 * writes the certifications table for `profile_id = user.id` OR
 * `email = user.email`, so it correctly picks up rows that came in via the
 * pre-loaded CSV before this person signed up.
 *
 * Four render states, driven by the passed-in cert (which may be null):
 *   1. `csv_import` + verified  → "Registered from the pre-loaded list"
 *   2. `user_upload` + verified → "Uploaded and verified"
 *   3. `user_upload` + pending  → "Uploaded, pending admin review" (with
 *                                  Replace / Remove buttons)
 *   4. no cert                  → "Upload certificate" file input
 *
 * File goes to Supabase Storage first (via uploadCertification, client-side).
 * Only after storage succeeds do we call the server action to write the DB
 * row. This keeps DB rows honest — no dangling metadata pointing at files
 * that failed to upload.
 */

type Props = {
  userProfileId: string
  userEmail: string
  initialCert: UserAmbassadorCert | null
  disabled?: boolean
}

const ACCEPT = CERTIFICATIONS_ALLOWED_MIME.join(',')

export function AmbassadorUpload({
  userProfileId,
  userEmail,
  initialCert,
  disabled,
}: Props) {
  const [cert, setCert] = useState<UserAmbassadorCert | null>(initialCert)
  const [busy, setBusy] = useState<'upload' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const clickFilePicker = () => {
    setError(null)
    inputRef.current?.click()
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset the input so the same filename can be picked twice in a row.
    e.target.value = ''
    if (!file) return

    setBusy('upload')
    setError(null)
    try {
      const supabase = createClient()
      const { path } = await uploadCertification(supabase, {
        kind: 'ambassador',
        ownerId: userProfileId,
        file,
      })
      startTransition(async () => {
        try {
          const { cert: next } = await recordAmbassadorCert({ storagePath: path })
          setCert(next)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to save cert.')
        } finally {
          setBusy(null)
        }
      })
    } catch (err) {
      setBusy(null)
      setError(err instanceof Error ? err.message : 'Upload failed.')
    }
  }

  const onRemove = () => {
    if (!cert || cert.verified_at) return
    if (
      !window.confirm(
        'Remove your uploaded Ambassador certificate? You can upload a new one after.'
      )
    ) {
      return
    }
    setBusy('delete')
    setError(null)
    startTransition(async () => {
      try {
        await deleteAmbassadorCert()
        setCert(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove cert.')
      } finally {
        setBusy(null)
      }
    })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white space-y-2">
      <div className="flex items-center gap-2">
        <Leaf size={16} className="text-[#1E4D2B]" />
        <div className="text-sm font-medium text-gray-800">
          Your Green Labs Ambassador certificate
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Signed in as{' '}
        <span className="font-mono text-gray-700">{userEmail}</span>. This
        credits <em>you</em> — coauthor and mentor status is matched
        automatically from the pre-loaded list once their email is on it.
      </p>

      <CertBody cert={cert} onUpload={clickFilePicker} onRemove={onRemove} busy={busy} disabled={disabled} />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onFile}
        disabled={disabled || busy !== null}
        className="hidden"
      />

      {error && (
        <div className="text-xs rounded-md bg-red-50 border border-red-200 px-2 py-1 text-red-800">
          {error}
        </div>
      )}
      <p className="text-[11px] text-gray-400">
        PDF, PNG, or JPEG. Up to{' '}
        {(CERTIFICATIONS_MAX_BYTES / 1024 / 1024).toFixed(0)} MB.
        Admin reviews new uploads before points are awarded.
      </p>
    </div>
  )
}

function CertBody({
  cert,
  onUpload,
  onRemove,
  busy,
  disabled,
}: {
  cert: UserAmbassadorCert | null
  onUpload: () => void
  onRemove: () => void
  busy: 'upload' | 'delete' | null
  disabled?: boolean
}) {
  if (busy === 'upload') {
    return (
      <StatusRow tone="pending">
        <Loader2 size={14} className="animate-spin" />
        Uploading…
      </StatusRow>
    )
  }
  if (busy === 'delete') {
    return (
      <StatusRow tone="pending">
        <Loader2 size={14} className="animate-spin" />
        Removing…
      </StatusRow>
    )
  }

  if (!cert) {
    return (
      <div>
        <button
          type="button"
          onClick={onUpload}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1E4D2B] text-white text-xs font-semibold hover:bg-[#163d22] disabled:opacity-50"
        >
          <Upload size={14} />
          Upload certificate
        </button>
      </div>
    )
  }

  // From pre-loaded CSV — user can't do anything, they're already credited.
  if (cert.source === 'csv_import') {
    return (
      <StatusRow tone="verified">
        <CheckCircle2 size={14} />
        Registered from the pre-loaded ambassador list.
      </StatusRow>
    )
  }

  // User's own upload, admin-verified — locked from self-management.
  if (cert.verified_at) {
    return (
      <StatusRow tone="verified">
        <CheckCircle2 size={14} />
        Uploaded and verified. Contact admin if you need to replace it.
      </StatusRow>
    )
  }

  // User's own upload, still pending — offer Replace / Remove.
  return (
    <div className="space-y-2">
      <StatusRow tone="pending">
        <Clock size={14} />
        Uploaded — pending admin review.
      </StatusRow>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onUpload}
          disabled={disabled}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Upload size={12} />
          Replace
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={12} />
          Remove
        </button>
      </div>
    </div>
  )
}

function StatusRow({
  tone,
  children,
}: {
  tone: 'verified' | 'pending'
  children: React.ReactNode
}) {
  const cls =
    tone === 'verified'
      ? 'bg-green-50 border-green-200 text-green-900'
      : 'bg-amber-50 border-amber-200 text-amber-900'
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${cls}`}
    >
      {children}
    </div>
  )
}
