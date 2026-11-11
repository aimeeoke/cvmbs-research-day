'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from 'lucide-react'
import type { SubmissionStatus } from '@/lib/types/database'
import { RichTextView } from '@/components/rich-text-view'
import { richTextIsEmpty, richTextToPlainText } from '@/lib/rich-text'
import {
  buildCsv,
  dateStamp,
  downloadCsv,
  formatEventTime,
  type CsvColumn,
} from '@/lib/csv-export'
import { AdminDeleteButton } from './admin-delete-button'

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
  classification: string | null
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

type SortField = 'presenter' | 'title' | 'status' | 'updated'
type SortDir = 'asc' | 'desc'

// Status is sorted by workflow order (draft → submitted → finalized → withdrawn)
// rather than alphabetically — alphabetical ordering ('Draft, Finalized,
// Submitted, Withdrawn') doesn't match how admins think about the queue.
const STATUS_RANK: Record<SubmissionStatus, number> = {
  draft: 0,
  submitted: 1,
  finalized: 2,
  withdrawn: 3,
}

// "Last name" = the final whitespace-separated token in the presenter's
// display name. Good enough for this list — handles "First Last" and
// "First Middle Last" naturally; "Jane Smith Jr." will sort under J
// which is fine for a human eyeballing the list.
function presenterLastName(name: string | null): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts[parts.length - 1] ?? '').toLowerCase()
}

function rowSortKey(r: BrowserRow, field: SortField): string | number {
  switch (field) {
    case 'presenter':
      return presenterLastName(r.presenter_name)
    case 'title':
      return richTextToPlainText(r.title).trim().toLowerCase()
    case 'status':
      return STATUS_RANK[r.status]
    case 'updated': {
      const t = r.finalized_at ?? r.submitted_at ?? r.created_at
      return t ? new Date(t).getTime() : 0
    }
  }
}

export function AbstractsBrowser({
  rows,
  departments,
  initialStatus,
  initialDept,
  initialSession,
  initialQuery,
  isAdmin,
}: {
  rows: BrowserRow[]
  departments: Department[]
  initialStatus: string
  initialDept: string
  initialSession: string
  initialQuery: string
  /** True admin — not committee. Gates the per-row delete button. */
  isAdmin: boolean
}) {
  const [statusF, setStatusF] = useState(initialStatus)
  const [deptF, setDeptF] = useState(initialDept)
  const [sessionF, setSessionF] = useState(initialSession)
  const [query, setQuery] = useState(initialQuery)
  // Default to presenter last-name ascending — primary admin workflow is
  // locating a submitter by last name. Click a header to change.
  const [sortField, setSortField] = useState<SortField>('presenter')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      // Dates feel more natural newest-first; text fields A→Z.
      setSortDir(field === 'updated' ? 'desc' : 'asc')
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = rows.filter((r) => {
      if (statusF && r.status !== statusF) return false
      if (deptF && r.department_id !== deptF) return false
      if (sessionF && r.session_preference !== sessionF) return false
      if (q) {
        const hay = [
          richTextToPlainText(r.title),
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

    const sorted = matched.slice().sort((a, b) => {
      const av = rowSortKey(a, sortField)
      const bv = rowSortKey(b, sortField)
      if (av === bv) {
        // Tiebreaker so rows don't shuffle unpredictably — always presenter
        // last name ascending as the secondary sort.
        const al = presenterLastName(a.presenter_name)
        const bl = presenterLastName(b.presenter_name)
        return al.localeCompare(bl)
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })

    return sorted
  }, [rows, statusF, deptF, sessionF, query, sortField, sortDir])

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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-gray-500">
          Showing {filtered.length} of {rows.length}
        </div>
        <div className="flex items-center gap-2">
          {filtered.length !== rows.length && (
            <button
              type="button"
              onClick={() => exportTrackingCsv(filtered, 'view')}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1E4D2B] text-[#1E4D2B] text-xs font-semibold hover:bg-[#1E4D2B]/5 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Download only the rows matching your current filter + search"
            >
              <Download size={14} />
              Export view ({filtered.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => exportTrackingCsv(rows, 'all')}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1E4D2B] text-white text-xs font-semibold hover:bg-[#163d22] disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download every abstract regardless of filter"
          >
            <Download size={14} />
            Export all ({rows.length})
          </button>
        </div>
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
                <SortableTh
                  field="presenter"
                  label="Presenter"
                  sortField={sortField}
                  sortDir={sortDir}
                  onClick={toggleSort}
                />
                <SortableTh
                  field="title"
                  label="Title"
                  sortField={sortField}
                  sortDir={sortDir}
                  onClick={toggleSort}
                />
                <SortableTh
                  field="status"
                  label="Status"
                  sortField={sortField}
                  sortDir={sortDir}
                  onClick={toggleSort}
                />
                <th className="px-3 py-2 text-left font-semibold">Mentor(s)</th>
                <th className="px-3 py-2 text-left font-semibold">
                  Session pref
                </th>
                <SortableTh
                  field="updated"
                  label="Updated"
                  align="right"
                  sortField={sortField}
                  sortDir={sortDir}
                  onClick={toggleSort}
                />
                {isAdmin && (
                  <th className="px-3 py-2 text-right font-semibold w-10"></th>
                )}
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
                      {richTextIsEmpty(r.title) ? (
                        <em className="text-gray-400">Untitled draft</em>
                      ) : (
                        <RichTextView html={r.title} inline />
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
                  {isAdmin && (
                    <td className="px-3 py-2 align-top text-right">
                      <AdminDeleteButton
                        submissionId={r.id}
                        label={deleteLabel(r)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Split a "First [Middle] Last" string into first + last so admins can
// sort by last name in Excel without running text-to-columns. Last name
// = the final whitespace token; everything before is the first-name
// bucket. Single-token names (or email fallback for unknown submitters)
// drop into last name so a last-name sort groups them sensibly.
function splitPersonName(name: string | null): { first: string; last: string } {
  if (!name) return { first: '', last: '' }
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: '', last: parts[0] }
  return {
    first: parts.slice(0, -1).join(' '),
    last: parts[parts.length - 1],
  }
}

// Tracking-CSV column spec. One row per abstract, no deep author list
// and no abstract body — that stuff goes to the detail page. See
// src/lib/csv-export.ts for the deferred "topic / research-area" export
// note; that one needs a classifier + semantic search before it's useful.
const TRACKING_CSV_COLUMNS: CsvColumn<BrowserRow>[] = [
  { header: 'Presenter first name', value: (r) => splitPersonName(r.presenter_name).first },
  { header: 'Presenter last name', value: (r) => splitPersonName(r.presenter_name).last },
  { header: 'Presenter email', value: (r) => r.presenter_email ?? '' },
  { header: 'Classification', value: (r) => r.classification ?? '' },
  { header: 'Department', value: (r) => r.department_name ?? '' },
  { header: 'Title', value: (r) => richTextToPlainText(r.title).trim() },
  { header: 'Status', value: (r) => r.status.charAt(0).toUpperCase() + r.status.slice(1) },
  { header: 'Mentor(s)', value: (r) => r.mentor_names.join('; ') },
  { header: 'Research type', value: (r) => r.research_type ?? '' },
  { header: 'Session preference', value: (r) => r.session_preference ?? '' },
  { header: 'Preferred presentation type', value: (r) => r.preferred_presentation_type ?? '' },
  { header: 'Submitter first name', value: (r) => splitPersonName(r.submitter_name).first },
  { header: 'Submitter last name', value: (r) => splitPersonName(r.submitter_name).last },
  { header: 'Submitter email', value: (r) => r.submitter_email ?? '' },
  { header: 'Submitted at (MT)', value: (r) => formatEventTime(r.submitted_at) },
  { header: 'Finalized at (MT)', value: (r) => formatEventTime(r.finalized_at) },
  { header: 'Created at (MT)', value: (r) => formatEventTime(r.created_at) },
  { header: 'Withdrawal requested at (MT)', value: (r) => formatEventTime(r.withdrawal_requested_at) },
]

function exportTrackingCsv(rows: readonly BrowserRow[], scope: 'view' | 'all') {
  const csv = buildCsv(rows, TRACKING_CSV_COLUMNS)
  const suffix = scope === 'view' ? 'filtered' : 'all'
  downloadCsv(`cvmbs-abstracts-${suffix}-${dateStamp()}.csv`, csv)
}

function SortableTh({
  field,
  label,
  align = 'left',
  sortField,
  sortDir,
  onClick,
}: {
  field: SortField
  label: string
  align?: 'left' | 'right'
  sortField: SortField
  sortDir: SortDir
  onClick: (f: SortField) => void
}) {
  const active = sortField === field
  const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th className={`px-3 py-2 ${align === 'right' ? 'text-right' : 'text-left'} font-semibold`}>
      <button
        type="button"
        onClick={() => onClick(field)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide ${
          align === 'right' ? 'flex-row-reverse' : ''
        } ${active ? 'text-[#1E4D2B]' : 'text-gray-700 hover:text-gray-900'}`}
        aria-label={`Sort by ${label}`}
      >
        {label}
        <Icon size={12} className={active ? '' : 'text-gray-400'} />
      </button>
    </th>
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

function deleteLabel(r: BrowserRow): string {
  const titlePlain = richTextToPlainText(r.title).trim()
  const title = titlePlain || 'Untitled draft'
  const presenter = r.presenter_name?.trim()
  return presenter ? `${title} — ${presenter}` : title
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
