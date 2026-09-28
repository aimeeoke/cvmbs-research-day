'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2, User, Users, GraduationCap } from 'lucide-react'
import type { SubmitterRole } from '../submit/actions'
import { startNewSubmission } from './actions'

type Option = {
  value: SubmitterRole
  icon: React.ReactNode
  title: string
  description: string
}

const OPTIONS: Option[] = [
  {
    value: 'presenter',
    icon: <User size={18} />,
    title: "I'm the presenter",
    description:
      "You're the one giving the talk / standing at the poster. Your name will be pre-filled as the Presenter.",
  },
  {
    value: 'submitter',
    icon: <Users size={18} />,
    title: "I'm submitting on behalf of the presenter",
    description:
      "You're helping someone else submit (lab manager, coordinator, etc.). You'll enter the presenter's info separately.",
  },
  {
    value: 'mentor',
    icon: <GraduationCap size={18} />,
    title: "I'm the presenter's mentor",
    description:
      "You're a faculty mentor submitting on behalf of your student. Your name will be pre-filled as a Mentor.",
  },
]

export function NewSubmissionButton() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<SubmitterRole | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const close = () => {
    if (isPending) return
    setOpen(false)
    setSelected(null)
    setError(null)
  }

  const onContinue = () => {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      try {
        await startNewSubmission(selected)
        // startNewSubmission redirects, so we never reach here on success
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not start a new submission.')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22]"
      >
        <Plus size={16} />
        New submission
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Who&apos;s filling this out?
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  We&apos;ll pre-fill the form based on your role on this abstract.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="text-gray-400 hover:text-gray-700 shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`block border rounded-lg p-3 cursor-pointer transition-colors ${
                    selected === opt.value
                      ? 'border-[#1E4D2B] bg-[#1E4D2B]/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="submitter-role"
                      value={opt.value}
                      checked={selected === opt.value}
                      onChange={() => setSelected(opt.value)}
                      className="mt-1 accent-[#1E4D2B]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className="text-[#1E4D2B]">{opt.icon}</span>
                        {opt.title}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{opt.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-2 text-sm text-red-700 mt-3">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={close}
                disabled={isPending}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onContinue}
                disabled={isPending || !selected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22] disabled:opacity-50"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
