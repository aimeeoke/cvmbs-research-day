'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X, Loader2 } from 'lucide-react'
import { adminDeleteSubmission } from './actions'

type Props = {
  submissionId: string
  /** Short identifying string shown in the confirm modal, e.g. the title
   *  (plain text) or "Untitled draft · AC Bobadilla". */
  label: string
  /** 'icon' = square icon button for row cells; 'full' = labelled button
   *  for the detail-page header. */
  variant?: 'icon' | 'full'
  /** Where to send the user after a successful delete. Used by the detail
   *  page so you don't land on a 404 for the just-deleted id. The browser
   *  rows pass nothing and let revalidatePath refresh in place. */
  redirectTo?: string
}

export function AdminDeleteButton({
  submissionId,
  label,
  variant = 'icon',
  redirectTo,
}: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onConfirm = () => {
    setError(null)
    startTransition(async () => {
      try {
        await adminDeleteSubmission(submissionId)
        setOpen(false)
        if (redirectTo) router.push(redirectTo)
        else router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not delete.')
      }
    })
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setOpen(true)
          }}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50"
          title="Delete submission (admin only)"
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-300 text-red-700 text-sm font-semibold hover:bg-red-50"
        >
          <Trash2 size={14} />
          Delete submission
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Delete this submission?
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-700">
              You are about to permanently delete:
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5">
              {label}
            </p>
            <p className="text-sm text-gray-700 mt-3">
              This also removes every author row attached to it. The action
              can&apos;t be undone.
            </p>
            {error && (
              <div className="rounded-md bg-red-50 p-2 text-sm text-red-700 mt-3">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete submission
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
