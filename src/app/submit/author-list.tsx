'use client'

import { useMemo, useState } from 'react'
import { X, Plus, GripVertical } from 'lucide-react'
import type { AuthorInput } from './actions'

export type FacultyOption = {
  id: string
  full_name: string
  department_name: string | null
  green_labs_certified: boolean
}

type Props = {
  value: AuthorInput[]
  onChange: (next: AuthorInput[]) => void
  facultyOptions: FacultyOption[]
  disabled?: boolean
}

const emptyAuthor = (): AuthorInput => ({
  position: 0,
  profile_id: null,
  faculty_id: null,
  display_name: '',
  is_presenter: false,
  is_mentor: false,
})

export function AuthorList({ value, onChange, facultyOptions, disabled }: Props) {
  const authors = value.length ? value : [emptyAuthor()]

  const updateAuthor = (idx: number, patch: Partial<AuthorInput>) => {
    const next = authors.map((a, i) => (i === idx ? { ...a, ...patch } : a))
    onChange(next)
  }

  const removeAuthor = (idx: number) => {
    const next = authors.filter((_, i) => i !== idx)
    onChange(next.length ? next : [emptyAuthor()])
  }

  const addAuthor = () => onChange([...authors, emptyAuthor()])

  const moveAuthor = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= authors.length) return
    const next = [...authors]
    const [item] = next.splice(idx, 1)
    next.splice(j, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {authors.map((author, idx) => (
        <AuthorRow
          key={idx}
          idx={idx}
          author={author}
          facultyOptions={facultyOptions}
          disabled={disabled}
          onChange={(patch) => updateAuthor(idx, patch)}
          onRemove={() => removeAuthor(idx)}
          onMoveUp={idx > 0 ? () => moveAuthor(idx, -1) : undefined}
          onMoveDown={idx < authors.length - 1 ? () => moveAuthor(idx, 1) : undefined}
        />
      ))}
      <button
        type="button"
        onClick={addAuthor}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1E4D2B] hover:text-[#163d22] disabled:opacity-50"
      >
        <Plus size={16} /> Add author
      </button>
    </div>
  )
}

function AuthorRow({
  idx,
  author,
  facultyOptions,
  disabled,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  idx: number
  author: AuthorInput
  facultyOptions: FacultyOption[]
  disabled?: boolean
  onChange: (patch: Partial<AuthorInput>) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const [showSuggest, setShowSuggest] = useState(false)
  const displayName = author.display_name ?? ''

  const suggestions = useMemo(() => {
    const q = displayName.trim().toLowerCase()
    if (!q || q.length < 2) return []
    return facultyOptions
      .filter((f) => f.full_name.toLowerCase().includes(q))
      .slice(0, 8)
  }, [displayName, facultyOptions])

  const linkedFacultyName = author.faculty_id
    ? facultyOptions.find((f) => f.id === author.faculty_id)?.full_name ?? null
    : null

  const pickFaculty = (f: FacultyOption) => {
    onChange({
      faculty_id: f.id,
      profile_id: null,
      display_name: f.full_name,
    })
    setShowSuggest(false)
  }

  const clearFacultyLink = () => {
    onChange({ faculty_id: null })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center pt-2 text-gray-400">
          <GripVertical size={16} />
          <span className="text-xs font-medium text-gray-500 mt-1">{idx + 1}</span>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Author name
            </label>
            <input
              type="text"
              value={displayName}
              disabled={disabled}
              onChange={(e) => {
                onChange({
                  display_name: e.target.value,
                  // Typing detaches any existing faculty link so student can edit
                  faculty_id: null,
                })
                setShowSuggest(true)
              }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              placeholder="e.g. Jane Doe"
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
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{f.department_name ?? 'CVMBS Faculty'}</span>
                      {f.green_labs_certified && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-[10px] font-medium">
                          Green Labs
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {linkedFacultyName && (
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#1E4D2B] text-white font-medium">
                  Linked to CVMBS faculty
                </span>
                <button
                  type="button"
                  onClick={clearFacultyLink}
                  disabled={disabled}
                  className="text-gray-500 hover:text-gray-700 underline"
                >
                  unlink
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={author.is_presenter}
                disabled={disabled}
                onChange={(e) => onChange({ is_presenter: e.target.checked })}
              />
              Presenter
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={author.is_mentor}
                disabled={disabled}
                onChange={(e) => onChange({ is_mentor: e.target.checked })}
              />
              Mentor
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!onMoveUp || disabled}
            className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30"
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!onMoveDown || disabled}
            className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30"
            title="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="text-gray-400 hover:text-red-600 disabled:opacity-30"
            title="Remove author"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
