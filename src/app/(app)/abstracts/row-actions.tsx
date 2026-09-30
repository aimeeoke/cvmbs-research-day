'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react'
import type { SubmissionStatus } from '@/lib/types/database'
import { deleteOwnSubmission, requestWithdrawal } from './actions'

export function RowActions({
  submissionId,
  status,
  editable,
  isSubmitter,
  withdrawalRequestedAt,
}: {
  submissionId: string
  status: SubmissionStatus
  editable: boolean
  isSubmitter: boolean
  withdrawalRequestedAt: string | null
}) {
  const [modal, setModal] = useState<'delete' | 'withdraw' | null>(null)

  const canDelete =
    isSubmitter && (status === 'draft' || status === 'submitted')
  const canRequestWithdrawal =
    isSubmitter && !withdrawalRequestedAt && status === 'finalized'

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/submit?id=${submissionId}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1E4D2B] text-[#1E4D2B] text-xs font-semibold hover:bg-[#1E4D2B]/5"
      >
        {editable ? 'Edit' : 'View'}
      </Link>
      {canDelete && (
        <button
          type="button"
          onClick={() => setModal('delete')}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50"
          title="Delete submission"
        >
          <Trash2 size={14} />
        </button>
      )}
      {canRequestWithdrawal && (
        <button
          type="button"
          onClick={() => setModal('withdraw')}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-50"
          title="Request withdrawal"
        >
          <AlertTriangle size={14} />
        </button>
      )}

      {modal === 'delete' && (
        <DeleteModal
          submissionId={submissionId}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'withdraw' && (
        <WithdrawModal
          submissionId={submissionId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function DeleteModal({
  submissionId,
  onClose,
}: {
  submissionId: string
  onClose: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onConfirm = () => {
    setError(null)
    startTransition(async () => {
      try {
        await deleteOwnSubmission(submissionId)
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not delete.')
      }
    })
  }

  return (
    <ModalShell onClose={onClose} title="Delete this submission?">
      <p className="text-sm text-gray-700">
        This permanently deletes the abstract, including all authors and any
        uploaded files. This action can&apos;t be undone. Are you sure?
      </p>
      {error && (
        <div className="rounded-md bg-red-50 p-2 text-sm text-red-700 mt-3">{error}</div>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-800 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete submission
        </button>
      </div>
    </ModalShell>
  )
}

function WithdrawModal({
  submissionId,
  onClose,
}: {
  submissionId: string
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const onSubmit = () => {
    setError(null)
    if (!reason.trim()) {
      setError('Please give a short reason.')
      return
    }
    startTransition(async () => {
      try {
        await requestWithdrawal(submissionId, reason)
        setSuccess(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not submit request.')
      }
    })
  }

  return (
    <ModalShell onClose={onClose} title="Request withdrawal">
      {success ? (
        <div>
          <p className="text-sm text-gray-700">
            Your withdrawal request has been sent. An admin will review it.
          </p>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22]"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-700">
            After finalize + lock, the abstract is in the printed program and
            judge assignments — admin has to review before removing it. Please
            add a short reason so they can approve quickly.
          </p>
          <label className="block text-sm font-medium text-gray-700 mt-3">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="e.g. duplicate submission, presenter is no longer available…"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]"
          />
          {error && (
            <div className="rounded-md bg-red-50 p-2 text-sm text-red-700 mt-3">{error}</div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-800 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isPending || !reason.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <AlertTriangle size={14} />
              )}
              Submit request
            </button>
          </div>
        </>
      )}
    </ModalShell>
  )
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
