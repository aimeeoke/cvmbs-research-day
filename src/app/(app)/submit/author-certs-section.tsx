'use client'

/**
 * Green Labs Ambassador certifications — one row per author.
 *
 * The section reads the "current authors" list from the form's local state
 * (presenter, coauthors, mentor slots that are filled) and renders a status
 * row for each. Each row shows:
 *
 *   * author name + role tag
 *   * email (if present) — email also enables submitter-uploaded certs
 *   * cert status:
 *       - matched from preloaded list by name OR verified upload → green "Certified"
 *       - pending upload → amber "Pending review" badge + Replace/Remove
 *       - none → "Upload certificate" button (needs an email) OR
 *                "Add an email to upload a certificate" hint
 *   * running total at the bottom (10 pts per certified author, capped at 100)
 *
 * Identity model: an author row is keyed by `authorIdentityKey(row)` which
 * prefers lowercased email, falls back to the name-match key (lastName|first3).
 * This lets preloaded ambassadors (CSV-imported, no email) credit the right
 * author without the submitter typing an email. Uploads still require an
 * email because recordAmbassadorCertForEmail is email-identified.
 */

import { useMemo, useRef, useState, useTransition } from 'react'
import {
  CheckCircle2,
  Clock,
  Leaf,
  Loader2,
  Mail,
  Trash2,
  Upload,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { authorIdentityKey } from '@/lib/name-match'
import {
  CERTIFICATIONS_ALLOWED_MIME,
  CERTIFICATIONS_MAX_BYTES,
  uploadCertification,
} from '@/lib/storage'
import {
  deleteAmbassadorCertForEmail,
  recordAmbassadorCertForEmail,
  type UserAmbassadorCert,
} from './actions'

export type AuthorRow = {
  key: string
  name: string
  email: string
  roleLabel: 'Presenter' | 'Mentor' | 'Coauthor'
  firstName?: string | null
  lastName?: string | null
}

type Props = {
  authors: AuthorRow[]
  initialCerts: Record<string, UserAmbassadorCert>
  currentUserId: string
  currentUserEmail: string
  disabled?: boolean
}

const ACCEPT = CERTIFICATIONS_ALLOWED_MIME.join(',')
const PTS_PER_AUTHOR = 10
const MAX_PTS = 100

export function AuthorCertsSection({
  authors,
  initialCerts,
  currentUserId,
  currentUserEmail,
  disabled,
}: Props) {
  const [certsByKey, setCertsByKey] = useState<Record<string, UserAmbassadorCert | null>>(initialCerts)

  // Dedupe authors by identity key so the same person showing up in two
  // slots (rare but possible while editing) only renders once. Rows that
  // can't be identified at all (no email AND no name) are skipped.
  const rows = useMemo(() => {
    const seen = new Set<string>()
    const out: Array<AuthorRow & { identityKey: string }> = []
    for (const a of authors) {
      const identityKey = authorIdentityKey(a)
      if (!identityKey || seen.has(identityKey)) continue
      seen.add(identityKey)
      out.push({
        ...a,
        email: a.email.trim().toLowerCase(),
        identityKey,
      })
    }
    return out
  }, [authors])

  const unidentifiable = useMemo(
    () => authors.filter((a) => authorIdentityKey(a) === null && !!a.name.trim()),
    [authors]
  )

  const certifiedCount = useMemo(
    () =>
      rows.reduce((n, r) => {
        const c = certsByKey[r.identityKey]
        return c ? n + 1 : n
      }, 0),
    [rows, certsByKey]
  )
  const projectPoints = Math.min(certifiedCount * PTS_PER_AUTHOR, MAX_PTS)

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600 leading-relaxed">
        Every author with a completed My Green Lab Ambassador training is
        worth <strong>10 pts</strong> for the Green Pipette race, up to a
        max of <strong>100 pts</strong> per abstract. If an author is on
        the pre-loaded list, they&apos;re credited automatically by name.
        Otherwise, upload their certificate PDF (or PNG / JPEG, up to{' '}
        {(CERTIFICATIONS_MAX_BYTES / 1024 / 1024).toFixed(0)} MB) — this
        step needs an email. Admin reviews new uploads before points are
        awarded.
      </p>

      {unidentifiable.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <strong>Can&apos;t identify:</strong>{' '}
          {unidentifiable.map((a) => a.name || '(unnamed)').join(', ')}.
          Add a last name (and ideally an email) in their author row above.
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          No eligible authors yet. Fill the Presenter / Coauthors / Mentors sections above.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <CertRow
              key={row.identityKey}
              row={row}
              cert={certsByKey[row.identityKey] ?? null}
              onCertChange={(next) =>
                setCertsByKey((prev) => ({ ...prev, [row.identityKey]: next }))
              }
              currentUserId={currentUserId}
              currentUserEmail={currentUserEmail}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-sm">
        <span className="text-gray-600">
          {certifiedCount} of {rows.length} eligible author
          {rows.length === 1 ? '' : 's'} certified
        </span>
        <span className="font-semibold text-[#1E4D2B]">
          {projectPoints} pts
          {projectPoints === MAX_PTS && (
            <span className="ml-1 text-xs text-gray-500">(max)</span>
          )}
        </span>
      </div>
    </div>
  )
}

function CertRow({
  row,
  cert,
  onCertChange,
  currentUserId,
  currentUserEmail,
  disabled,
}: {
  row: AuthorRow
  cert: UserAmbassadorCert | null
  onCertChange: (next: UserAmbassadorCert | null) => void
  currentUserId: string
  currentUserEmail: string
  disabled?: boolean
}) {
  const [busy, setBusy] = useState<'upload' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const hasEmail = !!row.email
  const isSelf = hasEmail && row.email === currentUserEmail.toLowerCase()
  const uploadedByMe = cert?.uploaded_by === currentUserId

  const canReplace = hasEmail && !!cert && !cert.verified_at && (uploadedByMe || isSelf)
  const canRemove = canReplace

  const clickPicker = () => {
    setError(null)
    inputRef.current?.click()
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !hasEmail) return

    setBusy('upload')
    setError(null)
    try {
      const supabase = createClient()
      // Use the row's email as the storage-folder owner id — keeps files
      // grouped by person even for coauthor uploads on behalf of others.
      // (RLS doesn't care about the path shape; it just checks bucket.)
      const { path } = await uploadCertification(supabase, {
        kind: 'ambassador',
        ownerId: row.email,
        file,
      })
      startTransition(async () => {
        try {
          const { cert: next } = await recordAmbassadorCertForEmail({
            email: row.email,
            firstName: row.firstName ?? nameToParts(row.name).first,
            lastName: row.lastName ?? nameToParts(row.name).last,
            storagePath: path,
          })
          onCertChange(next)
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
    if (!cert || cert.verified_at || !hasEmail) return
    if (
      !window.confirm(
        `Remove the uploaded certificate for ${row.name || row.email}?`
      )
    ) {
      return
    }
    setBusy('delete')
    setError(null)
    startTransition(async () => {
      try {
        await deleteAmbassadorCertForEmail(row.email)
        onCertChange(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove cert.')
      } finally {
        setBusy(null)
      }
    })
  }

  return (
    <div className="border border-gray-200 rounded-md p-3 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 truncate">
              {row.name || <em className="text-gray-400">(unnamed)</em>}
            </span>
            <RoleBadge label={row.roleLabel} />
            {isSelf && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                You
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 truncate">
            <Mail size={11} />
            <span className="font-mono">
              {row.email || (
                <em className="not-italic text-gray-400">no email on file</em>
              )}
            </span>
          </div>
          {error && (
            <div className="mt-2 text-xs rounded-md bg-red-50 border border-red-200 px-2 py-1 text-red-800">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1 flex-shrink-0">
          <CertBadge cert={cert} busy={busy} />
          <RowActions
            cert={cert}
            busy={busy}
            canReplace={canReplace}
            canRemove={canRemove}
            canUpload={hasEmail}
            disabled={disabled}
            onUpload={clickPicker}
            onRemove={onRemove}
          />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onFile}
        disabled={disabled || busy !== null || !hasEmail}
        className="hidden"
      />
    </div>
  )
}

function CertBadge({
  cert,
  busy,
}: {
  cert: UserAmbassadorCert | null
  busy: 'upload' | 'delete' | null
}) {
  if (busy === 'upload') {
    return (
      <Pill tone="pending">
        <Loader2 size={12} className="animate-spin" />
        Uploading…
      </Pill>
    )
  }
  if (busy === 'delete') {
    return (
      <Pill tone="pending">
        <Loader2 size={12} className="animate-spin" />
        Removing…
      </Pill>
    )
  }
  if (!cert) {
    return <Pill tone="neutral">Not registered</Pill>
  }
  if (cert.verified_at) {
    return (
      <Pill tone="verified">
        <CheckCircle2 size={12} />
        {cert.source === 'csv_import' ? 'On pre-loaded list' : 'Verified'}
      </Pill>
    )
  }
  return (
    <Pill tone="pending">
      <Clock size={12} />
      Pending review
    </Pill>
  )
}

function RowActions({
  cert,
  busy,
  canReplace,
  canRemove,
  canUpload,
  disabled,
  onUpload,
  onRemove,
}: {
  cert: UserAmbassadorCert | null
  busy: 'upload' | 'delete' | null
  canReplace: boolean
  canRemove: boolean
  canUpload: boolean
  disabled?: boolean
  onUpload: () => void
  onRemove: () => void
}) {
  if (busy) return null
  if (!cert) {
    if (!canUpload) {
      return (
        <p className="text-[11px] text-gray-500 italic max-w-[14rem] text-right">
          Add an email above to upload a certificate for this author.
        </p>
      )
    }
    return (
      <button
        type="button"
        onClick={onUpload}
        disabled={disabled}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1E4D2B] text-white text-xs font-semibold hover:bg-[#163d22] disabled:opacity-50"
      >
        <Upload size={12} />
        Upload certificate
      </button>
    )
  }
  if (cert.verified_at) return null
  return (
    <div className="flex gap-1.5">
      {canReplace && (
        <button
          type="button"
          onClick={onUpload}
          disabled={disabled}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Upload size={11} />
          Replace
        </button>
      )}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={11} />
          Remove
        </button>
      )}
    </div>
  )
}

function Pill({
  tone,
  children,
}: {
  tone: 'verified' | 'pending' | 'neutral'
  children: React.ReactNode
}) {
  const cls =
    tone === 'verified'
      ? 'bg-green-50 border-green-200 text-green-900'
      : tone === 'pending'
        ? 'bg-amber-50 border-amber-200 text-amber-900'
        : 'bg-gray-50 border-gray-200 text-gray-600'
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {children}
    </div>
  )
}

function RoleBadge({
  label,
}: {
  label: AuthorRow['roleLabel']
}) {
  const cls =
    label === 'Presenter'
      ? 'bg-blue-100 text-blue-900'
      : label === 'Mentor'
        ? 'bg-purple-100 text-purple-900'
        : 'bg-gray-100 text-gray-700'
  return (
    <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-semibold ${cls}`}>
      {label}
    </span>
  )
}

function nameToParts(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

export function SectionHeader() {
  return (
    <div className="flex items-center gap-2">
      <Leaf size={16} className="text-[#1E4D2B]" />
      <span className="text-lg font-bold text-gray-900">
        Green Labs Ambassador certifications
      </span>
    </div>
  )
}
