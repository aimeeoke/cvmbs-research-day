'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, GripVertical, Plus, X } from 'lucide-react'
import {
  AFFILIATION_GROUPS,
  ALL_AFFILIATIONS,
} from '@/lib/affiliations.generated'

export type FacultyOption = {
  id: string
  full_name: string
  department_name: string | null
  green_labs_certified: boolean
}

export type MentorCvmbsState = {
  mode: 'picker' | 'not_listed'
  faculty_id: string | null
  name: string
}

export type MentorExternalState = {
  name: string
  affiliation: string
}

export type CoauthorState = {
  key: string
  name: string
}

function FacultyPicker({
  value,
  onChange,
  facultyOptions,
  disabled,
  placeholder,
}: {
  value: { faculty_id: string | null; name: string }
  onChange: (patch: { faculty_id?: string | null; name?: string }) => void
  facultyOptions: FacultyOption[]
  disabled?: boolean
  placeholder?: string
}) {
  const [showSuggest, setShowSuggest] = useState(false)

  const suggestions = useMemo(() => {
    const q = value.name.trim().toLowerCase()
    if (!q || q.length < 2) return []
    return facultyOptions
      .filter((f) => f.full_name.toLowerCase().includes(q))
      .slice(0, 8)
  }, [value.name, facultyOptions])

  const linkedFaculty = value.faculty_id
    ? facultyOptions.find((f) => f.id === value.faculty_id) ?? null
    : null

  const pickFaculty = (f: FacultyOption) => {
    onChange({ faculty_id: f.id, name: f.full_name })
    setShowSuggest(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value.name}
        disabled={disabled}
        onChange={(e) => {
          onChange({ faculty_id: null, name: e.target.value })
          setShowSuggest(true)
        }}
        onFocus={() => setShowSuggest(true)}
        onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
        placeholder={placeholder ?? 'Search CVMBS faculty…'}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]"
      />
      {showSuggest && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto">
          {suggestions.map((f) => (
            <button
              type="button"
              key={f.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pickFaculty(f)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <div className="text-sm font-medium text-gray-900">{f.full_name}</div>
              <div className="text-xs text-gray-500">
                {f.department_name ?? 'CVMBS Faculty'}
              </div>
            </button>
          ))}
        </div>
      )}
      {linkedFaculty && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#1E4D2B] text-white font-medium">
            Linked · {linkedFaculty.department_name ?? 'CVMBS Faculty'}
          </span>
          <button
            type="button"
            onClick={() => onChange({ faculty_id: null })}
            disabled={disabled}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            unlink
          </button>
        </div>
      )}
    </div>
  )
}

export function CvmbsMentorSlot({
  label,
  required,
  value,
  onChange,
  facultyOptions,
  disabled,
}: {
  label: string
  required?: boolean
  value: MentorCvmbsState
  onChange: (patch: Partial<MentorCvmbsState>) => void
  facultyOptions: FacultyOption[]
  disabled?: boolean
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-gray-800">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        <div className="inline-flex rounded-md overflow-hidden border border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => onChange({ mode: 'picker' })}
            disabled={disabled}
            className={`px-2.5 py-1 ${
              value.mode === 'picker'
                ? 'bg-[#1E4D2B] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } disabled:opacity-60`}
          >
            Pick from CVMBS
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({ mode: 'not_listed', faculty_id: null })
            }
            disabled={disabled}
            className={`px-2.5 py-1 border-l border-gray-200 ${
              value.mode === 'not_listed'
                ? 'bg-[#1E4D2B] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } disabled:opacity-60`}
          >
            Not listed — type name
          </button>
        </div>
      </div>
      {value.mode === 'picker' ? (
        <FacultyPicker
          value={{ faculty_id: value.faculty_id, name: value.name }}
          onChange={(p) => onChange(p)}
          facultyOptions={facultyOptions}
          disabled={disabled}
          placeholder="Search CVMBS faculty…"
        />
      ) : (
        <input
          type="text"
          value={value.name}
          disabled={disabled}
          onChange={(e) => onChange({ name: e.target.value, faculty_id: null })}
          placeholder="Full name (e.g. Dr. Jane A. Doe)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]"
        />
      )}
    </div>
  )
}

export function ExternalMentorSlot({
  value,
  onChange,
  disabled,
}: {
  value: MentorExternalState
  onChange: (patch: Partial<MentorExternalState>) => void
  disabled?: boolean
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white space-y-2">
      <label className="text-sm font-medium text-gray-800">
        Other Mentor{' '}
        <span className="text-xs text-gray-500 font-normal">(optional)</span>
      </label>
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          type="text"
          value={value.name}
          disabled={disabled}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Full name (e.g. Alex Chen)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]"
        />
        <input
          type="text"
          value={value.affiliation}
          disabled={disabled}
          onChange={(e) => onChange({ affiliation: e.target.value })}
          placeholder="Affiliation (e.g. Graduate student, Smith Lab)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]"
        />
      </div>
      <p className="text-xs text-gray-500">
        For non-faculty mentors — e.g. graduate students, postdocs, or mentors
        from another institution. Only the name will appear in the byline;
        affiliation is stored for reference.
      </p>
    </div>
  )
}

export function CoauthorList({
  value,
  onChange,
  disabled,
}: {
  value: CoauthorState[]
  onChange: (next: CoauthorState[]) => void
  disabled?: boolean
}) {
  const update = (idx: number, patch: Partial<CoauthorState>) => {
    onChange(value.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))
  const add = () =>
    onChange([
      ...value,
      { key: `co-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: '' },
    ])
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    const [item] = next.splice(idx, 1)
    next.splice(j, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No additional coauthors yet. Add anyone besides the presenter and mentors here.
        </p>
      )}
      {value.map((c, idx) => (
        <div
          key={c.key}
          className="flex items-center gap-2 border border-gray-200 rounded-md p-2 bg-white"
        >
          <GripVertical size={14} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 font-medium w-6 text-center">
            {idx + 1}
          </span>
          <input
            type="text"
            value={c.name}
            disabled={disabled}
            onChange={(e) => update(idx, { name: e.target.value })}
            placeholder="Full name"
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]"
          />
          <button
            type="button"
            onClick={() => move(idx, -1)}
            disabled={disabled || idx === 0}
            className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30"
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => move(idx, 1)}
            disabled={disabled || idx === value.length - 1}
            className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30"
            title="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => remove(idx)}
            disabled={disabled}
            className="text-gray-400 hover:text-red-600 disabled:opacity-30"
            title="Remove"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1E4D2B] hover:text-[#163d22] disabled:opacity-50"
      >
        <Plus size={16} /> Add coauthor
      </button>
    </div>
  )
}

export function AffiliationsPicker({
  value,
  onChange,
  disabled,
}: {
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => new Set(value), [value])
  const knownSet = useMemo(() => new Set(ALL_AFFILIATIONS), [])

  const toggle = (name: string) => {
    if (selected.has(name)) {
      onChange(value.filter((v) => v !== name))
    } else {
      onChange([...value, name])
    }
  }

  const remove = (name: string) => {
    onChange(value.filter((v) => v !== name))
  }

  // Any selected entry that isn't in the CSV list — legacy free-text carries
  // over, shown as a chip so it's not silently dropped.
  const legacy = value.filter((v) => !knownSet.has(v))

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span
              key={v}
              className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium border ${
                knownSet.has(v)
                  ? 'bg-[#1E4D2B] text-white border-[#1E4D2B]'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
              title={
                knownSet.has(v)
                  ? undefined
                  : 'Free-text entry (not in the current affiliations list).'
              }
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                disabled={disabled}
                className="rounded-full p-0.5 hover:bg-black/10 disabled:opacity-40"
                title="Remove"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1E4D2B] hover:text-[#163d22] disabled:opacity-50"
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {value.length === 0 ? 'Select affiliations' : 'Edit affiliations'}
      </button>
      {open && (
        <div className="border border-gray-200 rounded-md p-3 bg-white max-h-72 overflow-y-auto space-y-3">
          {AFFILIATION_GROUPS.map((group) => (
            <div key={group.type}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {group.type}
              </div>
              <div className="grid sm:grid-cols-2 gap-1">
                {group.items.map((item) => {
                  const checked = selected.has(item)
                  return (
                    <label
                      key={item}
                      className={`flex items-center gap-2 px-2 py-1 rounded text-sm cursor-pointer ${
                        checked ? 'bg-[#1E4D2B]/10 text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(item)}
                        className="rounded border-gray-300 text-[#1E4D2B] focus:ring-[#1E4D2B]"
                      />
                      <span>{item}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
          {legacy.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-amber-800">
                Free-text entries from earlier saves are kept as tags but
                can&apos;t be re-added from this list. Remove them above if
                they no longer apply.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
