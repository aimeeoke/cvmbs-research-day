'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Lock, Save, Send } from 'lucide-react'
import type {
  PreferredPresentationType,
  SessionPreference,
  SubmissionStatus,
} from '@/lib/types/database'
import {
  AuthorList,
  type FacultyOption,
} from './author-list'
import {
  saveDraft,
  submitDraft,
  finalizeSubmission,
  type AuthorInput,
  type SubmissionInput,
} from './actions'

type Department = { id: string; name: string }

type Props = {
  submissionId: string
  status: SubmissionStatus
  initial: SubmissionInput
  departments: Department[]
  facultyOptions: FacultyOption[]
  editingLocked: boolean
  finalizeDeadline: string | null
  isSubmitter: boolean
}

const CLASSIFICATION_OPTIONS = [
  'DVM Student',
  'DVM/MBA Student',
  'DVM/MPH Student',
  'DVM/PhD Student',
  'MD Student',
  'MS Student',
  'MPH Student',
  'PhD Student',
  'Post-Baccalaureate',
  'Undergraduate Student',
  'Postdoc',
  'Resident',
  'Resident/PhD Student',
  'Resident/MS Student',
  'Veterinary Intern',
  'Research Staff',
  'Faculty',
] as const

const RESEARCH_TYPES = [
  'Foundational Research',
  'Translational Research',
  'Veterinary Clinical Research',
  'Social Sciences/Pedagogy Research',
] as const

const RESEARCH_STAGES = ['Early', 'Advanced'] as const

const PRESENTATION_PREFS: PreferredPresentationType[] = [
  'Oral only',
  'Prefer oral',
  'Poster only',
  'No preference',
]

const SESSION_PREFS: SessionPreference[] = ['Early', 'Late', 'No preference']

export function SubmitForm(props: Props) {
  const [state, setState] = useState<SubmissionInput>(props.initial)
  const [affiliationsText, setAffiliationsText] = useState(
    (props.initial.affiliations ?? []).join(', ')
  )
  const [status, setStatus] = useState<SubmissionStatus>(props.status)
  const [isPending, startTransition] = useTransition()
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const disabled = props.editingLocked || status === 'finalized' || status === 'withdrawn'

  const patch = (p: Partial<SubmissionInput>) => setState((s) => ({ ...s, ...p }))

  const setAffiliationsFromText = (raw: string) => {
    setAffiliationsText(raw)
    const parts = raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
    patch({ affiliations: parts })
  }

  const run = async (
    fn: (id: string, input: SubmissionInput) => Promise<{ ok: true }>,
    nextStatus: SubmissionStatus,
    successText: string
  ) => {
    setBanner(null)
    startTransition(async () => {
      try {
        await fn(props.submissionId, state)
        setStatus(nextStatus)
        setBanner({ tone: 'success', text: successText })
      } catch (e) {
        setBanner({
          tone: 'error',
          text: e instanceof Error ? e.message : 'Something went wrong. Try again?',
        })
      }
    })
  }

  const onSaveDraft = () =>
    run(saveDraft, status === 'draft' ? 'draft' : status, 'Draft saved.')

  const onSubmit = () => {
    if (!confirmFieldsFilled(state)) {
      setBanner({
        tone: 'error',
        text: 'Please fill in title, abstract, department, and at least one author before submitting.',
      })
      return
    }
    run(submitDraft, 'submitted', 'Submitted. You can keep editing until the finalize deadline.')
  }

  const onFinalize = () => {
    if (!confirmFieldsFilled(state)) {
      setBanner({
        tone: 'error',
        text: 'Please fill in the required fields before finalizing.',
      })
      return
    }
    if (
      !window.confirm(
        'Finalize this submission? Once finalized you can no longer edit it. Continue?'
      )
    )
      return
    run(finalizeSubmission, 'finalized', 'Submission finalized and locked.')
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <StatusHeader
        status={status}
        finalizeDeadline={props.finalizeDeadline}
        editingLocked={props.editingLocked}
      />

      {!props.isSubmitter && !disabled && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          You're editing this abstract as a mentor or presenter — the changes save
          against the submission owned by whoever originally created it.
        </div>
      )}

      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <strong>Presenters can only present once.</strong> Because of space and time
        constraints, each presenter is limited to a single abstract. If more than one
        abstract is created for the same presenter, only the first one submitted will
        be accepted.
      </div>

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

      <Section title="Research">
        <Field label="Title" required>
          <input
            type="text"
            value={state.title}
            disabled={disabled}
            onChange={(e) => patch({ title: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Abstract" required hint="Plain text. Aim for ~250–500 words.">
          <textarea
            value={state.abstract}
            disabled={disabled}
            onChange={(e) => patch({ abstract: e.target.value })}
            rows={10}
            className={inputClass}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Research type">
            <select
              value={state.research_type ?? ''}
              disabled={disabled}
              onChange={(e) => patch({ research_type: e.target.value || null })}
              className={inputClass}
            >
              <option value="">Select...</option>
              {RESEARCH_TYPES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Research stage">
            <select
              value={state.research_stage ?? ''}
              disabled={disabled}
              onChange={(e) => patch({ research_stage: e.target.value || null })}
              className={inputClass}
            >
              <option value="">Select...</option>
              {RESEARCH_STAGES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Funding acknowledgement" hint="Grants, foundations, or sponsors to credit.">
          <input
            type="text"
            value={state.funding ?? ''}
            disabled={disabled}
            onChange={(e) => patch({ funding: e.target.value || null })}
            className={inputClass}
          />
        </Field>
        <Field
          label="Affiliations"
          hint="Centers or programs, comma-separated (e.g. CVID, PREP, ARBL)."
        >
          <input
            type="text"
            value={affiliationsText}
            disabled={disabled}
            onChange={(e) => setAffiliationsFromText(e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Presenter">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Classification">
            <select
              value={state.classification ?? ''}
              disabled={disabled}
              onChange={(e) => patch({ classification: e.target.value || null })}
              className={inputClass}
            >
              <option value="">Select...</option>
              {CLASSIFICATION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Department" required>
            <select
              value={state.department_id ?? ''}
              disabled={disabled}
              onChange={(e) => patch({ department_id: e.target.value || null })}
              className={inputClass}
            >
              <option value="">Select...</option>
              {props.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section
        title="Authors"
        hint="Add every author in citation order. For CSU folks, pick from the faculty list when it appears so we can credit Green Labs correctly. External coauthors can be added by name only."
      >
        <AuthorList
          value={state.authors}
          onChange={(next) =>
            patch({ authors: next.map((a, i) => ({ ...a, position: i + 1 })) })
          }
          facultyOptions={props.facultyOptions}
          disabled={disabled}
        />
      </Section>

      <Section title="Preferences">
        <Field label="Preferred presentation type">
          <div className="flex flex-wrap gap-2">
            {PRESENTATION_PREFS.map((p) => (
              <RadioButton
                key={p}
                name="preferred_presentation_type"
                value={p}
                checked={state.preferred_presentation_type === p}
                disabled={disabled}
                onChange={() => patch({ preferred_presentation_type: p })}
                label={p}
              />
            ))}
          </div>
        </Field>
        <Field label="Session preference">
          <div className="flex flex-wrap gap-2">
            {SESSION_PREFS.map((p) => (
              <RadioButton
                key={p}
                name="session_preference"
                value={p}
                checked={state.session_preference === p}
                disabled={disabled}
                onChange={() => patch({ session_preference: p })}
                label={p}
              />
            ))}
          </div>
        </Field>
        <Field label="Have you previously presented at CVMBS Research Day?">
          <div className="flex gap-2">
            <RadioButton
              name="previously_presented"
              value="yes"
              checked={state.previously_presented === true}
              disabled={disabled}
              onChange={() => patch({ previously_presented: true })}
              label="Yes"
            />
            <RadioButton
              name="previously_presented"
              value="no"
              checked={state.previously_presented === false}
              disabled={disabled}
              onChange={() =>
                patch({ previously_presented: false, previous_format: null })
              }
              label="No"
            />
          </div>
        </Field>
        {state.previously_presented === true && (
          <Field label="If yes, in what format?">
            <div className="flex gap-2">
              <RadioButton
                name="previous_format"
                value="Oral"
                checked={state.previous_format === 'Oral'}
                disabled={disabled}
                onChange={() => patch({ previous_format: 'Oral' })}
                label="Oral"
              />
              <RadioButton
                name="previous_format"
                value="Poster"
                checked={state.previous_format === 'Poster'}
                disabled={disabled}
                onChange={() => patch({ previous_format: 'Poster' })}
                label="Poster"
              />
            </div>
          </Field>
        )}
      </Section>

      {!disabled && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save draft
          </button>
          {status !== 'submitted' && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22] disabled:opacity-50"
            >
              <Send size={16} />
              Submit draft
            </button>
          )}
          <button
            type="button"
            onClick={onFinalize}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-[#1E4D2B] text-[#1E4D2B] text-sm font-semibold hover:bg-[#1E4D2B]/5 disabled:opacity-50"
          >
            <Lock size={16} />
            Finalize &amp; lock
          </button>
        </div>
      )}
    </div>
  )
}

function confirmFieldsFilled(s: SubmissionInput) {
  if (!s.title.trim()) return false
  if (!s.abstract.trim()) return false
  if (!s.department_id) return false
  const nonEmpty = s.authors.filter(
    (a) => a.profile_id || a.faculty_id || (a.display_name && a.display_name.trim())
  )
  return nonEmpty.length > 0
}

function StatusHeader({
  status,
  finalizeDeadline,
  editingLocked,
}: {
  status: SubmissionStatus
  finalizeDeadline: string | null
  editingLocked: boolean
}) {
  const label = statusLabel(status)
  const tone = statusTone(status)

  const deadlineText = finalizeDeadline
    ? new Date(finalizeDeadline).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h1 className="text-2xl font-bold text-[#1E4D2B]">Your Submission</h1>
        {deadlineText && (
          <p className="text-sm text-gray-600 mt-0.5">
            {status === 'finalized'
              ? `Finalized. This submission is locked.`
              : editingLocked
                ? `Editing closed on ${deadlineText}.`
                : `Edit until ${deadlineText}. After that, submissions lock automatically.`}
          </p>
        )}
      </div>
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium ${tone}`}
      >
        {status === 'finalized' ? <Lock size={14} /> : <CheckCircle2 size={14} />}
        {label}
      </div>
    </div>
  )
}

function statusLabel(s: SubmissionStatus): string {
  switch (s) {
    case 'draft':
      return 'Draft'
    case 'submitted':
      return 'Submitted'
    case 'finalized':
      return 'Finalized'
    case 'withdrawn':
      return 'Withdrawn'
  }
}

function statusTone(s: SubmissionStatus): string {
  switch (s) {
    case 'draft':
      return 'bg-gray-100 text-gray-700'
    case 'submitted':
      return 'bg-blue-100 text-blue-800'
    case 'finalized':
      return 'bg-[#1E4D2B] text-white'
    case 'withdrawn':
      return 'bg-red-100 text-red-800'
  }
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B] disabled:bg-gray-50 disabled:text-gray-600'

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

function RadioButton({
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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm cursor-pointer ${
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
