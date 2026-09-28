'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Check, X } from 'lucide-react'
import {
  approveWithdrawal,
  denyRoleRequest,
  grantRoleRequest,
  rejectWithdrawal,
} from './actions'
import type { RoleRequestRow, WithdrawalRow } from './page'

type Props = {
  pendingRoles: RoleRequestRow[]
  recentResolved: RoleRequestRow[]
  pendingWithdrawals: WithdrawalRow[]
}

export function RequestsClient({
  pendingRoles,
  recentResolved,
  pendingWithdrawals,
}: Props) {
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const run = (
    id: string,
    fn: () => Promise<{ ok: true }>,
    okText: string
  ) => {
    setBanner(null)
    setBusyId(id)
    startTransition(async () => {
      try {
        await fn()
        setBanner({ tone: 'success', text: okText })
      } catch (e) {
        setBanner({
          tone: 'error',
          text: e instanceof Error ? e.message : 'Something went wrong.',
        })
      } finally {
        setBusyId(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {banner && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            banner.tone === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {banner.text}
        </div>
      )}

      <Section
        title="Pending role requests"
        count={pendingRoles.length}
        empty="No pending role requests."
      >
        <div className="space-y-2">
          {pendingRoles.map((r) => (
            <RoleRequestCard
              key={r.id}
              row={r}
              busy={busyId === r.id}
              onGrant={() =>
                run(
                  r.id,
                  () => grantRoleRequest(r.id),
                  `Granted ${r.requested_role} to ${displayName(r)}.`
                )
              }
              onDeny={() =>
                run(
                  r.id,
                  () => denyRoleRequest(r.id),
                  `Denied role request from ${displayName(r)}.`
                )
              }
            />
          ))}
        </div>
      </Section>

      <Section
        title="Pending withdrawal requests"
        count={pendingWithdrawals.length}
        empty="No pending withdrawal requests."
      >
        <div className="space-y-2">
          {pendingWithdrawals.map((w) => (
            <WithdrawalCard
              key={w.id}
              row={w}
              busy={busyId === w.id}
              onApprove={() =>
                run(
                  w.id,
                  () => approveWithdrawal(w.id),
                  `Withdrew "${w.title ?? 'Untitled'}".`
                )
              }
              onReject={() =>
                run(
                  w.id,
                  () => rejectWithdrawal(w.id),
                  `Cleared withdrawal request on "${w.title ?? 'Untitled'}".`
                )
              }
            />
          ))}
        </div>
      </Section>

      {recentResolved.length > 0 && (
        <Section
          title="Recently resolved role requests"
          count={recentResolved.length}
          empty=""
        >
          <div className="space-y-1">
            {recentResolved.map((r) => (
              <ResolvedRow key={r.id} row={r} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function displayName(r: RoleRequestRow): string {
  return (
    r.profile?.full_name ||
    [r.profile?.first_name, r.profile?.last_name].filter(Boolean).join(' ') ||
    r.profile?.email ||
    'unknown user'
  )
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string
  count: number
  empty: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-gray-500 italic">{empty}</p>
      ) : (
        children
      )}
    </section>
  )
}

function RoleRequestCard({
  row,
  busy,
  onGrant,
  onDeny,
}: {
  row: RoleRequestRow
  busy: boolean
  onGrant: () => void
  onDeny: () => void
}) {
  const name = displayName(row)
  const already = row.currentRoles.includes(row.requested_role)
  return (
    <div className="border border-gray-200 rounded-md p-3 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-medium text-gray-900">{name}</span>
            <span className="text-xs text-gray-500">
              {row.profile?.email ?? '—'}
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-700">
            Requesting:{' '}
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#1E4D2B] text-white text-xs font-semibold uppercase tracking-wide">
              {row.requested_role}
            </span>
            {already && (
              <span className="ml-2 text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                already has this role
              </span>
            )}
          </div>
          {row.currentRoles.length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Current roles: {row.currentRoles.join(', ')}
            </div>
          )}
          {row.note && (
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line border-l-2 border-gray-200 pl-3">
              {row.note}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Submitted {formatDate(row.created_at)}
          </p>
        </div>
        <div className="flex gap-2 sm:flex-col sm:items-end">
          <button
            type="button"
            onClick={onGrant}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22] disabled:opacity-50"
          >
            <Check size={14} />
            Grant
          </button>
          <button
            type="button"
            onClick={onDeny}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <X size={14} />
            Deny
          </button>
        </div>
      </div>
    </div>
  )
}

function WithdrawalCard({
  row,
  busy,
  onApprove,
  onReject,
}: {
  row: WithdrawalRow
  busy: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const presenterLabel =
    row.presenter?.display_name || row.presenter?.email || 'Presenter TBD'
  const submitterLabel =
    row.submitter?.full_name || row.submitter?.email || 'unknown'
  return (
    <div className="border border-gray-200 rounded-md p-3 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-medium text-gray-900">
              {row.title ?? <em className="text-gray-400">Untitled</em>}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
              {row.status}
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-700">
            Presenter: {presenterLabel}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            Requested by {submitterLabel}
          </div>
          {row.withdrawal_requested_reason && (
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line border-l-2 border-amber-200 pl-3 bg-amber-50/50">
              <span className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
                Reason
              </span>
              <br />
              {row.withdrawal_requested_reason}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Requested {formatDate(row.withdrawal_requested_at)}
          </p>
          <Link
            href={`/admin/abstracts/${row.id}`}
            className="mt-2 inline-block text-xs font-medium text-[#1E4D2B] hover:text-[#163d22] underline"
          >
            View the abstract →
          </Link>
        </div>
        <div className="flex gap-2 sm:flex-col sm:items-end">
          <button
            type="button"
            onClick={onApprove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-700 text-white text-sm font-semibold hover:bg-red-800 disabled:opacity-50"
          >
            <Check size={14} />
            Withdraw
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <X size={14} />
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

function ResolvedRow({ row }: { row: RoleRequestRow }) {
  const name = displayName(row)
  const tone =
    row.status === 'granted'
      ? 'bg-green-100 text-green-800'
      : row.status === 'denied'
        ? 'bg-red-100 text-red-800'
        : 'bg-gray-100 text-gray-700'
  return (
    <div className="flex items-center justify-between text-sm text-gray-700 py-1">
      <div className="min-w-0">
        <span className="font-medium">{name}</span>
        <span className="text-gray-500"> · {row.requested_role}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`px-2 py-0.5 rounded font-medium capitalize ${tone}`}
        >
          {row.status}
        </span>
        <span className="text-gray-400">
          {formatDate(row.resolved_at ?? row.created_at)}
        </span>
      </div>
    </div>
  )
}

function formatDate(s: string): string {
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
