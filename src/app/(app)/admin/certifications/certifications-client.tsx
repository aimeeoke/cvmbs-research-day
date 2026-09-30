'use client'

import { useState, useTransition } from 'react'
import {
  Check,
  ExternalLink,
  Leaf,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react'
import {
  approveCertification,
  denyCertification,
  unverifyCertification,
} from './actions'

export type CertRow = {
  id: string
  kind: 'ambassador' | 'my_green_lab' | 'green_paw'
  source: 'csv_import' | 'user_upload' | 'admin_manual'
  subjectName: string
  subjectEmail: string | null
  labName: string | null
  storagePath: string | null
  fileUrl: string | null
  uploadedAt: string
  uploaderName: string | null
  uploaderEmail: string | null
  verifiedAt: string | null
  verifierName: string | null
}

const KIND_LABEL: Record<CertRow['kind'], string> = {
  ambassador: 'Ambassador',
  my_green_lab: 'My Green Lab (lab cert)',
  green_paw: 'Green Paw (clinic cert)',
}

const SOURCE_LABEL: Record<CertRow['source'], string> = {
  csv_import: 'CSV import',
  user_upload: 'User upload',
  admin_manual: 'Admin manual',
}

export function CertificationsClient({
  rows,
  mode,
}: {
  rows: CertRow[]
  mode: 'pending' | 'verified'
}) {
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    null
  )
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const run = (id: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusyId(id)
    setBanner(null)
    startTransition(async () => {
      try {
        await fn()
        setBanner({ tone: 'success', text: okMsg })
      } catch (err) {
        setBanner({
          tone: 'error',
          text: err instanceof Error ? err.message : 'Action failed.',
        })
      } finally {
        setBusyId(null)
      }
    })
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-500">
        {mode === 'pending'
          ? 'No pending certifications right now. When people upload from the submit form, they appear here for review.'
          : 'No recently verified certifications yet.'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {banner && (
        <div
          className={`text-sm rounded-md px-3 py-2 ${
            banner.tone === 'success'
              ? 'bg-green-50 text-green-900 border border-green-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="space-y-2">
        {rows.map((row) => (
          <CertCard
            key={row.id}
            row={row}
            mode={mode}
            busy={busyId === row.id}
            onApprove={() =>
              run(
                row.id,
                () => approveCertification(row.id),
                `Approved cert for ${row.subjectName}.`
              )
            }
            onDeny={() => {
              if (
                !window.confirm(
                  `Deny and delete this certification for ${row.subjectName}? The file will be removed. The person can re-upload after.`
                )
              ) {
                return
              }
              run(
                row.id,
                () => denyCertification(row.id),
                `Denied cert for ${row.subjectName}.`
              )
            }}
            onUnverify={() =>
              run(
                row.id,
                () => unverifyCertification(row.id),
                `Un-verified cert for ${row.subjectName}. It's now pending again.`
              )
            }
          />
        ))}
      </div>
    </div>
  )
}

function CertCard({
  row,
  mode,
  busy,
  onApprove,
  onDeny,
  onUnverify,
}: {
  row: CertRow
  mode: 'pending' | 'verified'
  busy: boolean
  onApprove: () => void
  onDeny: () => void
  onUnverify: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Leaf size={14} className="text-[#1E4D2B]" />
            <span className="font-medium text-gray-900">{row.subjectName}</span>
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-semibold bg-[#1E4D2B]/10 text-[#1E4D2B]">
              {KIND_LABEL[row.kind]}
            </span>
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-semibold bg-gray-100 text-gray-700">
              {SOURCE_LABEL[row.source]}
            </span>
          </div>
          {row.subjectEmail && (
            <div className="text-xs text-gray-600 font-mono truncate">
              {row.subjectEmail}
            </div>
          )}
          <div className="text-xs text-gray-500">
            Uploaded {formatDate(row.uploadedAt)}
            {row.uploaderName && (
              <>
                {' '}by <span className="text-gray-700">{row.uploaderName}</span>
                {row.uploaderEmail && (
                  <span className="text-gray-400"> ({row.uploaderEmail})</span>
                )}
              </>
            )}
          </div>
          {row.verifiedAt && (
            <div className="text-xs text-green-800">
              Verified {formatDate(row.verifiedAt)}
              {row.verifierName && <> by {row.verifierName}</>}
            </div>
          )}
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0">
          {row.fileUrl ? (
            <a
              href={row.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink size={12} />
              View file
            </a>
          ) : (
            <span className="text-[11px] text-gray-400 italic px-1">
              No file (imported)
            </span>
          )}

          <div className="flex gap-1.5">
            {mode === 'pending' ? (
              <>
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={busy}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#1E4D2B] text-white text-xs font-semibold hover:bg-[#163d22] disabled:opacity-50"
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={onDeny}
                  disabled={busy}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-red-300 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-50"
                >
                  <X size={12} />
                  Deny
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onUnverify}
                disabled={busy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-50 disabled:opacity-50"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                Un-verify
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}
