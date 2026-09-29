'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Lock, Save, Send } from 'lucide-react'
import type {
  PreferredPresentationType,
  SessionPreference,
  SubmissionStatus,
} from '@/lib/types/database'
import { RichTextEditor } from '@/components/rich-text-editor'
import {
  richTextCharCount,
  richTextIsEmpty,
  richTextWordCount,
} from '@/lib/rich-text'
import {
  AffiliationsPicker,
  CoauthorList,
  CvmbsMentorSlot,
  ExternalMentorSlot,
  type CoauthorState,
  type FacultyOption,
  type MentorCvmbsState,
  type MentorExternalState,
} from './submit-authors'
import {
  saveDraft,
  submitDraft,
  finalizeSubmission,
  type AuthorInput,
  type SubmissionInput,
  type UserAmbassadorCert,
} from './actions'
import { AmbassadorUpload } from './ambassador-upload'

type Department = { id: string; name: string; short_name?: string | null }

type Props = {
  submissionId: string
  status: SubmissionStatus
  initial: SubmissionInput
  departments: Department[]
  facultyOptions: FacultyOption[]
  editingLocked: boolean
  finalizeDeadline: string | null
  isSubmitter: boolean
  /** Admin read-only view — locks the form, hides mentor/edit banners, swaps header. */
  adminView?: boolean
  // Green Labs Ambassador cert for the SIGNED-IN USER (not the presenter on
  // the abstract). Passed from the server page after querying certifications
  // by profile_id or email. Null if the user isn't (yet) an ambassador.
  currentUser?: {
    profileId: string
    email: string
  } | null
  currentUserAmbassadorCert?: UserAmbassadorCert | null
}

type PresenterFields = {
  name: string
  email: string
  profile_id: string | null
  faculty_id: string | null
}

type FormState = {
  title: string
  abstract: string
  classification: string | null
  department_id: string | null
  program: string | null
  affiliations: string[]
  research_type: string | null
  research_stage: string | null
  funding: string | null
  preferred_presentation_type: PreferredPresentationType | null
  session_preference: SessionPreference | null
  previously_presented: boolean | null
  previous_format: 'Oral' | 'Poster' | null
  presenter: PresenterFields
  mentor_cvmbs_1: MentorCvmbsState
  mentor_cvmbs_2: MentorCvmbsState
  mentor_external: MentorExternalState
  coauthors: CoauthorState[]
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

// Legacy separator that older drafts used to squeeze the External Mentor's
// affiliation into `display_name` before we had a real column. Kept for the
// load-side parse only — new writes go into `submission_authors.affiliation`
// via the 2026-09-29 migration.
const LEGACY_OTHER_MENTOR_SEP = ' · '

const RESEARCH_STAGE_HINT =
  'Early = undergrad, post-bacc, or graduate student / resident with ≤ 2 years in the research program. ' +
  'Advanced = completed prelims and/or more than 2 years of research experience.'

const PRESENTATION_PREFS: PreferredPresentationType[] = [
  'Oral only',
  'Prefer oral',
  'Poster only',
  'No preference',
]

const SESSION_PREFS: { value: SessionPreference; label: string }[] = [
  { value: 'Undergraduate poster', label: 'Undergraduate poster (10:15–11:15 am)' },
  { value: 'Early', label: 'Early (11:30 am – 1:30 pm)' },
  { value: 'Late', label: 'Late (1:45 – 3:45 pm)' },
  { value: 'No preference', label: 'No preference' },
]

function deserialize(initial: SubmissionInput): FormState {
  const authors = [...initial.authors].sort((a, b) => a.position - b.position)
  const presenterRow = authors.find((a) => a.is_presenter)
  const mentorRows = authors.filter((a) => a.is_mentor)
  const coauthorRows = authors.filter((a) => !a.is_presenter && !a.is_mentor)

  // Save order is [Other, cvmbs2, cvmbs1] (last mentor by position is Faculty
  // Mentor 1). The External Mentor row is identified by the absence of a
  // faculty_id AND presence of affiliation data (new column, or the legacy
  // " · " suffix in display_name for pre-migration drafts).
  const externalRow = mentorRows.find(
    (m) =>
      !m.faculty_id &&
      (!!m.affiliation ||
        !!m.department_id ||
        (m.display_name ?? '').includes(LEGACY_OTHER_MENTOR_SEP))
  )
  const cvmbsRows = mentorRows.filter((m) => m !== externalRow)
  // Reverse so the highest-position CVMBS mentor becomes cvmbs1.
  const [cvmbs1Row, cvmbs2Row] = [...cvmbsRows].reverse()

  return {
    title: initial.title,
    abstract: initial.abstract,
    classification: initial.classification,
    department_id: initial.department_id,
    program: initial.program,
    affiliations: initial.affiliations,
    research_type: initial.research_type,
    research_stage: initial.research_stage,
    funding: initial.funding,
    preferred_presentation_type: initial.preferred_presentation_type,
    session_preference: initial.session_preference,
    previously_presented: initial.previously_presented,
    previous_format: initial.previous_format,
    presenter: {
      name: presenterRow?.display_name ?? '',
      email: presenterRow?.email ?? '',
      profile_id: presenterRow?.profile_id ?? null,
      faculty_id: presenterRow?.faculty_id ?? null,
    },
    // Default to the CVMBS faculty picker so people don't rush past the
    // autocomplete and type a name that's actually in the roster. We only fall
    // back to 'not_listed' when an existing row was previously saved that way
    // (no faculty_id set).
    mentor_cvmbs_1: {
      mode: cvmbs1Row && !cvmbs1Row.faculty_id ? 'not_listed' : 'picker',
      faculty_id: cvmbs1Row?.faculty_id ?? null,
      name: cvmbs1Row?.display_name ?? '',
      department_id: cvmbs1Row?.department_id ?? null,
    },
    mentor_cvmbs_2: {
      mode: cvmbs2Row && !cvmbs2Row.faculty_id ? 'not_listed' : 'picker',
      faculty_id: cvmbs2Row?.faculty_id ?? null,
      name: cvmbs2Row?.display_name ?? '',
      department_id: cvmbs2Row?.department_id ?? null,
    },
    mentor_external: loadExternalMentor(externalRow ?? null),
    coauthors: coauthorRows.map((c, i) => ({
      key: `co-load-${i}`,
      name: c.display_name ?? '',
      department_id: c.department_id ?? null,
      affiliation: c.affiliation ?? '',
    })),
  }
}

function serializeAuthors(state: FormState): AuthorInput[] {
  const authors: AuthorInput[] = []
  let pos = 1
  const push = (row: Omit<AuthorInput, 'position'>) => {
    authors.push({ ...row, position: pos++ })
  }

  if (state.presenter.name.trim()) {
    push({
      profile_id: state.presenter.profile_id,
      faculty_id: state.presenter.faculty_id,
      display_name: state.presenter.name.trim(),
      email: state.presenter.email.trim() || null,
      // Presenter's dept lives on the parent submission row, not the author row.
      department_id: null,
      affiliation: null,
      is_presenter: true,
      is_mentor: false,
    })
  }

  for (const c of state.coauthors) {
    if (c.name.trim()) {
      push({
        profile_id: null,
        faculty_id: null,
        display_name: c.name.trim(),
        email: null,
        department_id: c.department_id,
        affiliation: c.affiliation.trim() || null,
        is_presenter: false,
        is_mentor: false,
      })
    }
  }

  // Mentor byline order: Other Mentor → Faculty Mentor 2 → Faculty Mentor 1
  // (Faculty Mentor 1 ends up in the last byline position).
  if (state.mentor_external.name.trim()) {
    push({
      profile_id: null,
      faculty_id: null,
      display_name: state.mentor_external.name.trim(),
      email: null,
      department_id: state.mentor_external.department_id,
      affiliation: state.mentor_external.affiliation.trim() || null,
      is_presenter: false,
      is_mentor: true,
    })
  }
  const cvmbsMentors = [state.mentor_cvmbs_2, state.mentor_cvmbs_1]
  for (const m of cvmbsMentors) {
    const hasName = m.name.trim().length > 0
    const hasFaculty = m.mode === 'picker' && !!m.faculty_id
    if (hasName || hasFaculty) {
      push({
        profile_id: null,
        faculty_id: m.mode === 'picker' ? m.faculty_id : null,
        display_name: m.name.trim() || null,
        email: null,
        // Only carry dept when the person typed a name (not_listed); when
        // linked via the picker the dept comes from the linked faculty row.
        department_id: m.mode === 'not_listed' ? m.department_id : null,
        affiliation: null,
        is_presenter: false,
        is_mentor: true,
      })
    }
  }

  return authors
}

// Load External Mentor from a saved row. Prefer the new `affiliation` /
// `department_id` columns; fall back to parsing the legacy " · " suffix out
// of display_name for any pre-migration drafts.
function loadExternalMentor(row: AuthorInput | null): MentorExternalState {
  if (!row) return { name: '', department_id: null, affiliation: '' }
  const raw = row.display_name ?? ''
  const hasNewShape = !!row.affiliation || !!row.department_id
  if (hasNewShape) {
    return {
      name: raw,
      department_id: row.department_id ?? null,
      affiliation: row.affiliation ?? '',
    }
  }
  const idx = raw.indexOf(LEGACY_OTHER_MENTOR_SEP)
  if (idx === -1) return { name: raw, department_id: null, affiliation: '' }
  return {
    name: raw.slice(0, idx),
    department_id: null,
    affiliation: raw.slice(idx + LEGACY_OTHER_MENTOR_SEP.length),
  }
}

function computeBylineNames(state: FormState): string[] {
  return [
    state.presenter.name.trim(),
    ...state.coauthors.map((c) => c.name.trim()),
    state.mentor_external.name.trim(),
    state.mentor_cvmbs_2.name.trim(),
    state.mentor_cvmbs_1.name.trim(),
  ].filter(Boolean)
}

function validate(state: FormState): string | null {
  if (richTextIsEmpty(state.title)) return 'Add a title before submitting.'
  if (richTextIsEmpty(state.abstract)) return 'Add the abstract body before submitting.'
  if (!state.department_id && !state.program?.trim())
    return 'Pick a Department or enter a Program in the Presenter section.'
  if (!state.presenter.name.trim())
    return 'Presenter name is required.'
  if (!state.presenter.email.trim())
    return 'Presenter email is required.'
  if (!state.mentor_cvmbs_1.name.trim())
    return 'Faculty Mentor 1 is required — pick a CVMBS faculty member or use "not listed" to type a name.'

  const bylineLower = computeBylineNames(state).map((n) => n.toLowerCase())
  const mentorNames = [
    state.mentor_cvmbs_1.name.trim(),
    state.mentor_cvmbs_2.name.trim(),
    state.mentor_external.name.trim(),
  ].filter(Boolean)
  for (const mn of mentorNames) {
    if (!bylineLower.includes(mn.toLowerCase())) {
      return `Mentor "${mn}" isn't in the Authors byline. Add them to the Authors list or clear the Mentors slot.`
    }
  }
  return null
}

export function SubmitForm(props: Props) {
  const [state, setState] = useState<FormState>(() => deserialize(props.initial))
  const [status, setStatus] = useState<SubmissionStatus>(props.status)
  const [isPending, startTransition] = useTransition()
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  // Admins can edit any submission regardless of status; only the submitter
  // view honors the finalize deadline + finalized/withdrawn lock.
  const disabled = props.adminView
    ? false
    : props.editingLocked ||
      status === 'finalized' ||
      status === 'withdrawn'

  const patch = (p: Partial<FormState>) => setState((s) => ({ ...s, ...p }))

  const toSubmissionInput = (s: FormState): SubmissionInput => ({
    title: s.title,
    abstract: s.abstract,
    classification: s.classification,
    department_id: s.department_id,
    program: s.program,
    research_type: s.research_type,
    research_stage: s.research_stage,
    funding: s.funding,
    affiliations: s.affiliations,
    preferred_presentation_type: s.preferred_presentation_type,
    session_preference: s.session_preference,
    previously_presented: s.previously_presented,
    previous_format: s.previous_format,
    authors: serializeAuthors(s),
  })

  const run = (
    fn: (id: string, input: SubmissionInput) => Promise<{ ok: true }>,
    nextStatus: SubmissionStatus,
    successText: string
  ) => {
    startTransition(async () => {
      try {
        await fn(props.submissionId, toSubmissionInput(state))
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

  const onSaveDraft = () => {
    setBanner(null)
    run(saveDraft, status === 'draft' ? 'draft' : status, 'Draft saved.')
  }

  const onSubmit = () => {
    setBanner(null)
    const err = validate(state)
    if (err) {
      setBanner({ tone: 'error', text: err })
      return
    }
    run(submitDraft, 'submitted', 'Submitted. You can keep editing until the finalize deadline.')
  }

  const onFinalize = () => {
    setBanner(null)
    const err = validate(state)
    if (err) {
      setBanner({ tone: 'error', text: err })
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

  const bylineNames = computeBylineNames(state)
  const bylinePreview = bylineNames.join(', ')

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {props.adminView ? (
        <AdminViewHeader status={status} />
      ) : (
        <StatusHeader
          status={status}
          finalizeDeadline={props.finalizeDeadline}
          editingLocked={props.editingLocked}
        />
      )}

      {!props.adminView && !props.isSubmitter && !disabled && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          You&apos;re editing this abstract as a mentor or presenter — the changes save
          against the submission owned by whoever originally created it.
        </div>
      )}

      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <p>
          <strong>Presenters can only present once.</strong> Because of space and time
          constraints, each presenter is limited to a single abstract. If more than one
          abstract is created for the same presenter, only the first one submitted will
          be accepted.
        </p>
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

      <Section
        title="Presenter"
        hint="Who's actually presenting on the day. Drives assignments and program credit."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Full name"
            required
            hint="Include middle initial only if used professionally."
          >
            <input
              type="text"
              value={state.presenter.name}
              disabled={disabled}
              onChange={(e) =>
                patch({
                  presenter: {
                    ...state.presenter,
                    name: e.target.value,
                    profile_id: null,
                    faculty_id: null,
                  },
                })
              }
              placeholder="e.g. Jane A. Doe"
              className={inputClass}
            />
          </Field>
          <Field
            label="Email"
            required
            hint="Used to notify the presenter of format and slot assignments."
          >
            <input
              type="email"
              value={state.presenter.email}
              disabled={disabled}
              onChange={(e) =>
                patch({ presenter: { ...state.presenter, email: e.target.value } })
              }
              placeholder="presenter@colostate.edu"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Classification">
            <select
              value={state.classification ?? ''}
              disabled={disabled}
              onChange={(e) => patch({ classification: e.target.value || null })}
              className={inputClass}
            >
              <option value="">Select…</option>
              {CLASSIFICATION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Department"
            hint="Leave blank if the presenter isn't in a CVMBS department."
          >
            <select
              value={state.department_id ?? ''}
              disabled={disabled}
              onChange={(e) => patch({ department_id: e.target.value || null })}
              className={inputClass}
            >
              <option value="">Select…</option>
              {props.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          label="Program"
          hint="If not in a CVMBS department, name the program (e.g. Cell & Molecular Biology, One Health, undergraduate major)."
        >
          <input
            type="text"
            value={state.program ?? ''}
            disabled={disabled}
            onChange={(e) => patch({ program: e.target.value || null })}
            className={inputClass}
          />
        </Field>
        <Field
          label="Affiliations"
          hint="Centers, institutes, labs, programs, or training grants that support this work. Pick all that apply."
        >
          <AffiliationsPicker
            value={state.affiliations}
            onChange={(next) => patch({ affiliations: next })}
            disabled={disabled}
          />
        </Field>
        {props.currentUser && !props.adminView && (
          <AmbassadorUpload
            userProfileId={props.currentUser.profileId}
            userEmail={props.currentUser.email}
            initialCert={props.currentUserAmbassadorCert ?? null}
            disabled={disabled}
          />
        )}
      </Section>

      <Section
        title="Mentors"
        hint="At least one faculty mentor is required. You can also add a second faculty mentor and one other mentor. Do not include degrees or affiliations in the name field."
      >
        <CvmbsMentorSlot
          label="Faculty Mentor 1"
          required
          value={state.mentor_cvmbs_1}
          onChange={(p) =>
            patch({ mentor_cvmbs_1: { ...state.mentor_cvmbs_1, ...p } })
          }
          facultyOptions={props.facultyOptions}
          departments={props.departments}
          disabled={disabled}
        />
        <CvmbsMentorSlot
          label="Faculty Mentor 2 (optional)"
          value={state.mentor_cvmbs_2}
          onChange={(p) =>
            patch({ mentor_cvmbs_2: { ...state.mentor_cvmbs_2, ...p } })
          }
          facultyOptions={props.facultyOptions}
          departments={props.departments}
          disabled={disabled}
        />
        <ExternalMentorSlot
          value={state.mentor_external}
          onChange={(p) =>
            patch({ mentor_external: { ...state.mentor_external, ...p } })
          }
          departments={props.departments}
          disabled={disabled}
        />
      </Section>

      <Section title="Research classification">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Research type">
            <select
              value={state.research_type ?? ''}
              disabled={disabled}
              onChange={(e) => patch({ research_type: e.target.value || null })}
              className={inputClass}
            >
              <option value="">Select…</option>
              {RESEARCH_TYPES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Research stage" hint={RESEARCH_STAGE_HINT}>
            <select
              value={state.research_stage ?? ''}
              disabled={disabled}
              onChange={(e) => patch({ research_stage: e.target.value || null })}
              className={inputClass}
            >
              <option value="">Select…</option>
              {RESEARCH_STAGES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Title">
        <Field
          label="Abstract title"
          required
          hint="Use the Italic button (or Ctrl+I) for species names — e.g. E. coli. Superscripts and subscripts work too."
        >
          <RichTextEditor
            value={state.title}
            disabled={disabled}
            onChange={(html) => patch({ title: html })}
            multiline={false}
            ariaLabel="Abstract title"
          />
        </Field>
      </Section>

      <Section
        title="Authors"
        hint="Full byline in program order: presenter first, additional coauthors next, then any other mentor, then the faculty mentor(s) — with Faculty Mentor 1 in the last position."
      >
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Byline preview
          </div>
          <div className="text-sm text-gray-800">
            {bylinePreview || (
              <span className="italic text-gray-500">
                Fill Presenter and Mentors above to build the byline.
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            Additional coauthors
          </div>
          <CoauthorList
            value={state.coauthors}
            onChange={(next) => patch({ coauthors: next })}
            departments={props.departments}
            disabled={disabled}
          />
          <p className="mt-2 text-xs text-gray-500">
            Anyone besides the presenter and mentors — collaborators, lab members,
            external coauthors. Order matters; they&apos;ll appear between the presenter
            and the mentor(s) in the byline.
          </p>
        </div>
      </Section>

      <Section title="Abstract">
        <Field
          label="Abstract body"
          required
          hint="Aim for ~250–500 words. Paste from Word — italics for species names, sub/superscripts, Greek letters (α, β, μ), and math symbols all come through."
        >
          <RichTextEditor
            value={state.abstract}
            disabled={disabled}
            onChange={(html) => patch({ abstract: html })}
            minRows={10}
            ariaLabel="Abstract body"
          />
          <AbstractCount html={state.abstract} />
        </Field>
      </Section>

      <Section title="Funding">
        <Field
          label="Funding acknowledgement"
          hint="Grants, foundations, or sponsors to credit."
        >
          <input
            type="text"
            value={state.funding ?? ''}
            disabled={disabled}
            onChange={(e) => patch({ funding: e.target.value || null })}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Preferences">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong>There are only 32 oral presentation slots.</strong> Individuals who
          have not previously given an oral presentation will be prioritized in format
          assignment.
        </div>
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
                key={p.value}
                name="session_preference"
                value={p.value}
                checked={state.session_preference === p.value}
                disabled={disabled}
                onChange={() => patch({ session_preference: p.value })}
                label={p.label}
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

function AdminViewHeader({ status }: { status: SubmissionStatus }) {
  const label = statusLabel(status)
  const tone = statusTone(status)
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h1 className="text-2xl font-bold text-[#1E4D2B]">
          Abstract (admin editing)
        </h1>
        <p className="text-sm text-gray-600 mt-0.5">
          You can edit any field regardless of status. Save Draft to persist
          without changing status; Finalize &amp; lock if you&apos;re resolving
          it for the submitter.
        </p>
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

// Word + char count for the abstract body. Colored amber if outside the
// ~250–500 word target so submitters have a visual nudge — no hard cap,
// since the guideline is a suggestion, not a rule.
function AbstractCount({ html }: { html: string }) {
  const words = richTextWordCount(html)
  const chars = richTextCharCount(html)
  const inRange = words >= 250 && words <= 500
  const tone = words === 0
    ? 'text-gray-400'
    : inRange
      ? 'text-gray-500'
      : 'text-amber-700'
  return (
    <p className={`mt-1 text-xs tabular-nums ${tone}`}>
      {words.toLocaleString()} {words === 1 ? 'word' : 'words'} ·{' '}
      {chars.toLocaleString()} characters
      {words > 0 && !inRange && (
        <span className="ml-1 text-amber-700">
          (target ~250–500)
        </span>
      )}
    </p>
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
