'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { SubmissionStatus } from '@/lib/types/database'

export type BrowserRow = {
  id: string
  title: string
  status: SubmissionStatus
  created_at: string
  submitted_at: string | null
  finalized_at: string | null
  withdrawal_requested_at: string | null
  department_id: string | null
  department_name: string | null
  session_preference: string | null
  preferred_presentation_type: string | null
  research_type: string | null
  submitter_name: string
  submitter_email: string | null
  presenter_name: string | null
  presenter_email: string | null
  mentor_names: string[]
  byline: string
}

type Department = { id: string; name: string }

const SESSION_OPTIONS = ['Undergraduate poster', 'Early', 'Late', 'No preference']

export function AbstractsBrowser({
  rows,
  departments,
  initialStatus,
  initialDept,
  initialSession,
  initialQuery,
}: {
  rows: BrowserRow[]
  departments: Department[]
  initialStatus: string
  initialDept: string
  initialSession: string
  initialQuery: string
}) {
  const [statusF, setStatusF] = useState(initialStatus)
  const [deptF, setDeptF] = useState(initialDept)
  const [sessionF, setSessionF] = useState(initialSession)
  const [query, setQuery] = useState(initialQuery)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusF && r.status !== statusF) return false
      if (deptF && r.department_id !== deptF) return false
      if (sessionF && r.session_preference !== sessionF) return false
      if (q) {
        const hay = [
          r.title,
          r.presenter_name,
          r.presenter_email,
          r.submitter_name,
          r.submitter_email,
          r.byline,
          ...r.mentor_names,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, statusF, deptF, sessionF, query])

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
      <div className="grid sm:grid-cols-4 gap-3">
        <FilterSelect
          label="Status"
          value={statusF}
          onChange={setStatusF}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'finalized', label: 'Finalized' },
            { value: 'withdrawn', label: 'Withdrawn' },
          ]}
        />
        <FilterSelect
          label="Department"
          value={deptF}
          onChange={setDeptF}
          options={[
            { value: '', label: 'All departments' },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
        <FilterSelect
          label="Session preference"
          value={sessionF}
          onChange={setSessionF}
          options={[
            { value: '', label: 'All sessions' },
            ...SESSION_OPTIONS.map((s) => ({ value: s, label: s })),
          ]}
        />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Search
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2 top-2.5 text-gray-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, presenter, mentor…"
              className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]"
            />
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Showing {filtered.length} of {rows.length}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500 italic">
          No abstracts match these filters.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Presenter</th>
                <th className="px-3 py-2 text-left font-semibold">Title</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Mentor(s)</th>
                <th className="px-3 py-2 text-left font-semibold">
                  Session pref
                </th>
                <th className="px-3 py-2 text-right font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 align-top">
                    <Link
                      href={`/admin/abstracts/${r.id}`}
                      className="text-[#1E4D2B] font-medium hover:underline"
                    >
                      {r.presenter_name || (
                        <em className="text-gray-400">Not set</em>
                      )}
                    </Link>
                    {r.presenter_email && (
                      <div className="text-xs text-gray-500">
                        {r.presenter_email}
                      </div>
                    )}
                    {r.submitter_email !== r.presenter_email && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        by {r.submitter_name}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-gray-800 max-w-md">
                    <Link
                      href={`/admin/abstracts/${r.id}`}
                      className="hover:underline"
                    >
                      {r.title || (
                        <em className="text-gray-400">Untitled draft</em>
                      )}
                    </Link>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <StatusPill status={r.status} />
                    {r.withdrawal_requested_at && r.status !== 'withdrawn' && (
                      <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-medium">
                        Withdrawal pending
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-gray-700 text-xs">
                    {r.mentor_names.length > 0 ? (
                      r.mentor_names.join(', ')
                    ) : (
                      <em className="text-gray-400">—</em>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-gray-700 text-xs">
                    {r.session_preference ?? (
                      <em className="text-gray-400">—</em>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-xs text-gray-500 whitespace-nowrap">
                    {formatShort(
                      r.finalized_at ?? r.submitted_at ?? r.created_at
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function StatusPill({ status }: { status: SubmissionStatus }) {
  const tone =
    status === 'draft'
      ? 'bg-gray-100 text-gray-700'
      : status === 'submitted'
        ? 'bg-blue-100 text-blue-800'
        : status === 'finalized'
          ? 'bg-[#1E4D2B] text-white'
          : 'bg-red-100 text-red-800'
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  )
}

function formatShort(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
