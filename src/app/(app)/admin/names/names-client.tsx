'use client'

import { useMemo, useState, useTransition } from 'react'
import { Check, Pencil, Search, X } from 'lucide-react'
import { renameAuthorName } from './actions'

export type UnlinkedNameRow = {
  name: string
  count: number
  submissionCount: number
  roles: { presenter: number; mentor: number; coauthor: number }
  depts: string[]
  affiliations: string[]
}

export function NamesClient({ rows }: { rows: UnlinkedNameRow[] }) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [banner, setBanner] = useState<{
    tone: 'success' | 'error'
    text: string
  } | null>(null)
  const [busyName, setBusyName] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.name.toLowerCase().includes(q))
  }, [rows, query])

  const startEdit = (name: string) => {
    setEditing(name)
    setDraft(name)
    setBanner(null)
  }
  const cancelEdit = () => {
    setEditing(null)
    setDraft('')
  }

  const save = (oldName: string) => {
    const cleanNew = draft.trim()
    if (!cleanNew) {
      setBanner({ tone: 'error', text: 'New name cannot be blank.' })
      return
    }
    if (cleanNew === oldName) {
      cancelEdit()
      return
    }
    setBusyName(oldName)
    startTransition(async () => {
      try {
        const result = await renameAuthorName(oldName, cleanNew)
        setBusyName(null)
        setEditing(null)
        setDraft('')
        setBanner({
          tone: 'success',
          text:
            result.updated === 0
              ? `No rows to update. "${oldName}" may have already been renamed.`
              : `Renamed "${oldName}" → "${cleanNew}" on ${result.updated} row${
                  result.updated === 1 ? '' : 's'
                }.`,
        })
      } catch (err) {
        setBusyName(null)
        setBanner({
          tone: 'error',
          text: err instanceof Error ? err.message : 'Failed to rename.',
        })
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-3 sm:p-4 border-b border-gray-200 space-y-2">
        <div className="relative max-w-sm">
          <Search
            size={14}
            className="absolute left-2 top-2.5 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search names…"
            className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]"
          />
        </div>
        <p className="text-xs text-gray-500">
          {filtered.length.toLocaleString()} of{' '}
          {rows.length.toLocaleString()} distinct name
          {rows.length === 1 ? '' : 's'}
        </p>
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
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-500">
          {rows.length === 0
            ? 'No unlinked author names yet. When people submit abstracts with hand-typed names, they show up here.'
            : 'No names match your search.'}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filtered.map((row) => (
            <NameRow
              key={row.name}
              row={row}
              editing={editing === row.name}
              draft={editing === row.name ? draft : ''}
              onStartEdit={() => startEdit(row.name)}
              onCancel={cancelEdit}
              onDraftChange={setDraft}
              onSave={() => save(row.name)}
              busy={busyName === row.name}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NameRow({
  row,
  editing,
  draft,
  onStartEdit,
  onCancel,
  onDraftChange,
  onSave,
  busy,
}: {
  row: UnlinkedNameRow
  editing: boolean
  draft: string
  onStartEdit: () => void
  onCancel: () => void
  onDraftChange: (v: string) => void
  onSave: () => void
  busy: boolean
}) {
  return (
    <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            type="text"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            disabled={busy}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave()
              if (e.key === 'Escape') onCancel()
            }}
            className="w-full px-2 py-1.5 border border-[#1E4D2B] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B]"
          />
        ) : (
          <div className="font-medium text-gray-900 truncate">{row.name}</div>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
          <span>
            {row.count} row{row.count === 1 ? '' : 's'} · {row.submissionCount}{' '}
            submission{row.submissionCount === 1 ? '' : 's'}
          </span>
          {row.roles.presenter > 0 && (
            <span className="inline-flex px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-medium">
              {row.roles.presenter}× presenter
            </span>
          )}
          {row.roles.mentor > 0 && (
            <span className="inline-flex px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-medium">
              {row.roles.mentor}× mentor
            </span>
          )}
          {row.roles.coauthor > 0 && (
            <span className="inline-flex px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
              {row.roles.coauthor}× coauthor
            </span>
          )}
          {row.depts.map((d) => (
            <span
              key={`d-${d}`}
              className="inline-flex px-1.5 py-0.5 rounded bg-[#1E4D2B] text-white font-medium"
            >
              {d}
            </span>
          ))}
          {row.affiliations.map((a) => (
            <span
              key={`a-${a}`}
              className="inline-flex px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-medium"
              title="Free-text affiliation"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 self-start sm:self-auto">
        {editing ? (
          <>
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#1E4D2B] text-white text-xs font-semibold hover:bg-[#163d22] disabled:opacity-50"
            >
              <Check size={14} />
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <X size={14} />
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50"
          >
            <Pencil size={12} />
            Rename
          </button>
        )}
      </div>
    </div>
  )
}
