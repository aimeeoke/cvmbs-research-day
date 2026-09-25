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
  email: null,
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
              Full name (as it should appear in the program)
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
              placeholder="e.g. Jane A. Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]"
            />
            <p className="mt-1 text-xs text-gray-500">
              Include middle initial only if the author uses one professionally.
            </p>
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

          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Role</div>
            <div className="flex flex-wrap gap-2 text-sm">
              <RoleRadio
                name={`role-${idx}`}
                value="author"
                checked={!author.is_presenter && !author.is_mentor}
                disabled={disabled}
                onChange={() => onChange({ is_presenter: false, is_mentor: false })}
                label="Author"
              />
              <RoleRadio
                name={`role-${idx}`}
                value="presenter"
                checked={author.is_presenter}
                disabled={disabled}
                onChange={() => onChange({ is_presenter: true, is_mentor: false })}
                label="Presenter"
              />
              <RoleRadio
                name={`role-${idx}`}
                value="mentor"
                checked={author.is_mentor}
                disabled={disabled}
                onChange={() => onChange({ is_presenter: false, is_mentor: true })}
                label="Mentor"
              />
            </div>
          </div>

          {author.is_presenter && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Presenter email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                value={author.email ?? ''}
                disabled={disabled}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="how the presenter is contacted for assignments"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]"
              />
              <p className="mt-1 text-xs text-gray-500">
                Used to enforce the one-abstract-per-presenter rule and to notify
                the presenter of assignments.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 items-end">
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

function RoleRadio({
  name,
  value,
  checked,
  disabled,
  onChange,
  label,
}: {
  name: string
  value: string
  checked: boolean
  disabled?: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border cursor-pointer ${
        checked
          ? 'bg-[#1E4D2B] text-white border-[#1E4D2B]'
          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  )
}
