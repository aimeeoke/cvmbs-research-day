'use client'

import { useState, useTransition } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'
import type { UserRole } from '@/lib/types/database'
import { submitRoleRequest } from './actions'

type RequestableRole = Exclude<UserRole, 'submitter'>

const ROLE_DESCRIPTIONS: Record<RequestableRole, string> = {
  mentor:
    'Faculty PIs mentoring student presenters. Lets you view and edit abstracts you mentor.',
  judge:
    'Score abstracts during the event. (You can also register directly on the Judge page.)',
  committee_member:
    'Research Day committee members. Access to abstracts overview, author names, and Green Labs certifications — but not role requests or withdrawal approvals.',
  admin:
    'Manage the entire event: users, submissions, judging assignments, scoring, role requests, and withdrawals.',
  volunteer:
    'Help with day-of logistics (registration desk, session moderation, etc.).',
}

const ROLE_LABELS: Record<RequestableRole, string> = {
  mentor: 'Mentor',
  judge: 'Judge',
  committee_member: 'Committee member',
  admin: 'Admin',
  volunteer: 'Volunteer',
}

export function RoleRequestForm({
  currentRoles,
  pendingRoles,
}: {
  currentRoles: UserRole[]
  pendingRoles: UserRole[]
}) {
  const [requestedRole, setRequestedRole] = useState<RequestableRole | ''>('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const availableRoles = (Object.keys(ROLE_DESCRIPTIONS) as RequestableRole[]).filter(
    (r) => !currentRoles.includes(r) && !pendingRoles.includes(r)
  )

  const noAvailable = availableRoles.length === 0

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!requestedRole) {
      setError('Choose a role to request.')
      return
    }
    startTransition(async () => {
      try {
        await submitRoleRequest({ requested_role: requestedRole, note })
        setRequestedRole('')
        setNote('')
        setSuccess(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not submit request.')
      }
    })
  }

  if (noAvailable) {
    return (
      <p className="text-sm text-gray-600">
        You already have (or have pending requests for) every role that can be requested
        through this form. Talk to the Research Day admin if you need something else.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-gray-600">
        Request an additional role. An admin will review and approve.
      </p>

      <div>
        <label htmlFor="requested-role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="requested-role"
          value={requestedRole}
          onChange={(e) => setRequestedRole(e.target.value as RequestableRole | '')}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-[#1E4D2B] focus:border-[#1E4D2B] sm:text-sm"
        >
          <option value="">Select a role…</option>
          {availableRoles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        {requestedRole && (
          <p className="mt-1 text-xs text-gray-500">{ROLE_DESCRIPTIONS[requestedRole]}</p>
        )}
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700">
          Note for the admin <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1E4D2B] focus:border-[#1E4D2B] sm:text-sm"
          placeholder="e.g. I'm the PI mentoring three students this year."
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Request submitted. An admin will review it.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !requestedRole}
        className="inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1E4D2B] hover:bg-[#163d22] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E4D2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            Submitting...
          </>
        ) : (
          'Submit request'
        )}
      </button>
    </form>
  )
}
