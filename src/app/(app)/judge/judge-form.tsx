'use client'

import { useMemo, useState, useTransition } from 'react'
import { Gavel, Loader2, XCircle } from 'lucide-react'
import type { JudgeEligibility, JudgeFormat } from '@/lib/types/database'
import {
  cancelJudgeRegistration,
  reactivateJudgeRegistration,
  saveJudgeRegistration,
  type JudgeRegistrationInput,
} from './actions'

export type TimeSlot = { id: string; label: string; hint?: string }
export type FormatOption = { id: JudgeFormat; label: string; hint: string }

const ELIGIBILITY_OPTIONS: {
  id: JudgeEligibility
  label: string
  hint: string
}[] = [
  {
    id: 'faculty',
    label: 'Faculty',
    hint: 'Can judge oral, regular poster, and undergraduate poster sessions.',
  },
  {
    id: 'advanced_trainee',
    label: 'Advanced-stage trainee',
    hint: 'Postdoc, senior PhD, resident, etc. Can judge regular and undergraduate poster sessions.',
  },
  {
    id: 'early_trainee',
    label: 'Early-stage trainee',
    hint: 'Early PhD, DVM, MS, MPH, etc. Can only judge the undergraduate poster session.',
  },
  {
    id: 'undergrad',
    label: 'Undergraduate',
    hint: 'Undergraduates cannot judge Research Day.',
  },
]

const ALLOWED: Record<JudgeEligibility, JudgeFormat[]> = {
  faculty: ['oral', 'poster_regular', 'poster_undergrad'],
  advanced_trainee: ['poster_regular', 'poster_undergrad'],
  early_trainee: ['poster_undergrad'],
  undergrad: [],
}

type ExistingRegistration = {
  first_name: string
  last_name: string
  email: string
  eligibility: JudgeEligibility
  detailed_role: string | null
  preferred_time_slots: string[]
  preferred_formats: JudgeFormat[]
  conflicts: string | null
  cancelled_at: string | null
}

type Props = {
  defaultFirstName: string
  defaultLastName: string
  defaultEmail: string
  timeSlots: TimeSlot[]
  formats: FormatOption[]
  existing: ExistingRegistration | null
}

export function JudgeForm({
  defaultFirstName,
  defaultLastName,
  defaultEmail,
  timeSlots,
  formats,
  existing,
}: Props) {
  const [firstName, setFirstName] = useState(existing?.first_name ?? defaultFirstName)
  const [lastName, setLastName] = useState(existing?.last_name ?? defaultLastName)
  const [email, setEmail] = useState(existing?.email ?? defaultEmail)
  const [eligibility, setEligibility] = useState<JudgeEligibility>(
    existing?.eligibility ?? 'faculty'
  )
  const [detailedRole, setDetailedRole] = useState(existing?.detailed_role ?? '')
  const [slots, setSlots] = useState<string[]>(existing?.preferred_time_slots ?? [])
  const [selectedFormats, setSelectedFormats] = useState<JudgeFormat[]>(
    existing?.preferred_formats ?? []
  )
  const [conflicts, setConflicts] = useState(existing?.conflicts ?? '')

  const [isPending, startTransition] = useTransition()
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const isCancelled = !!existing?.cancelled_at
  const allowedFormats = ALLOWED[eligibility]
  const eligibleFormats = useMemo(
    () => formats.filter((f) => allowedFormats.includes(f.id)),
    [formats, allowedFormats]
  )

  const toggleSlot = (id: string) =>
    setSlots((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))

  const toggleFormat = (id: JudgeFormat) =>
    setSelectedFormats((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )

  // Drop any selected formats that are no longer allowed for the new eligibility.
  const changeEligibility = (next: JudgeEligibility) => {
    setEligibility(next)
    const allowed = ALLOWED[next]
    setSelectedFormats((prev) => prev.filter((f) => allowed.includes(f)))
  }

  const submit = () => {
    setBanner(null)
    const input: JudgeRegistrationInput = {
      first_name: firstName,
      last_name: lastName,
      email,
      eligibility,
      detailed_role: detailedRole || null,
      preferred_time_slots: slots,
      preferred_formats: selectedFormats,
      conflicts: conflicts || null,
    }
    startTransition(async () => {
      try {
        await saveJudgeRegistration(input)
        setBanner({
          tone: 'success',
          text: existing
            ? 'Preferences updated.'
            : 'Thanks for volunteering! You will hear about assignments closer to the event.',
        })
      } catch (e) {
        setBanner({
          tone: 'error',
          text: e instanceof Error ? e.message : 'Something went wrong.',
        })
      }
    })
  }

  const cancel = () => {
    if (!window.confirm('Cancel your judge volunteering for this year?')) return
    startTransition(async () => {
      try {
        await cancelJudgeRegistration()
        setBanner({ tone: 'success', text: 'You have been removed from the judge list.' })
      } catch (e) {
        setBanner({
          tone: 'error',
          text: e instanceof Error ? e.message : 'Could not cancel.',
        })
      }
    })
  }

  const reactivate = () => {
    startTransition(async () => {
      try {
        await reactivateJudgeRegistration()
        setBanner({ tone: 'success', text: 'You are back on the judge list.' })
      } catch (e) {
        setBanner({
          tone: 'error',
          text: e instanceof Error ? e.message : 'Could not reactivate.',
        })
      }
    })
  }

  if (isCancelled) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        <h1 className="text-3xl font-bold text-[#1E4D2B]">Volunteer to Judge</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-900 space-y-2">
          <p className="font-medium">You cancelled your judge volunteering for this year.</p>
          <p>Your preferences are saved — you can re-activate below if you change your mind.</p>
        </div>
        {banner && <Banner {...banner} />}
        <button
          type="button"
          onClick={reactivate}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22] disabled:opacity-50"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Gavel size={16} />}
          Reactivate my volunteering
        </button>
      </div>
    )
  }

  const cannotJudge = eligibility === 'undergrad'

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1E4D2B]">Volunteer to Judge</h1>
        <p className="text-sm text-gray-600 mt-1">
          {existing
            ? 'Edit your preferences below or cancel your volunteering.'
            : 'Tell us when you can judge and what formats you can cover. You will get assignments closer to the event.'}
        </p>
      </div>

      {banner && <Banner {...banner} />}

      <Section title="Your details">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="First name" required>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Last name" required>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Email" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Your role">
        <div className="space-y-2">
          {ELIGIBILITY_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className="flex items-start gap-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name="eligibility"
                value={opt.id}
                checked={eligibility === opt.id}
                onChange={() => changeEligibility(opt.id)}
                className="mt-1"
              />
              <span className="text-sm text-gray-800">
                <span className="font-medium">{opt.label}</span>
                <span className="block text-xs text-gray-500">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <Field label="More detail (optional)" hint="e.g., PhD Student, Year 5 · Postdoc in Popichak Lab">
          <input
            type="text"
            value={detailedRole}
            onChange={(e) => setDetailedRole(e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      {cannotJudge ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-900">
          Undergraduates aren&apos;t eligible to judge Research Day. Thanks for your
          interest — consider volunteering in another capacity!
        </div>
      ) : (
        <>
          <Section
            title="Preferred time slots"
            hint="Check every slot you can be available for."
          >
            <div className="space-y-2">
              {timeSlots.map((s) => (
                <label
                  key={s.id}
                  className="flex items-start gap-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={slots.includes(s.id)}
                    onChange={() => toggleSlot(s.id)}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-800">
                    <span className="font-medium">{s.label}</span>
                    {s.hint && <span className="block text-xs text-gray-500">{s.hint}</span>}
                  </span>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Preferred formats" hint="Options are limited by your role.">
            {eligibleFormats.length === 0 ? (
              <p className="text-sm text-gray-500">No formats available.</p>
            ) : (
              <div className="space-y-2">
                {eligibleFormats.map((f) => (
                  <label
                    key={f.id}
                    className="flex items-start gap-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFormats.includes(f.id)}
                      onChange={() => toggleFormat(f.id)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-800">
                      <span className="font-medium">{f.label}</span>
                      <span className="block text-xs text-gray-500">{f.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Conflicts"
            hint="Anyone we should keep off your judging list (e.g., trainees or collaborators)."
          >
            <textarea
              rows={3}
              value={conflicts}
              onChange={(e) => setConflicts(e.target.value)}
              className={inputClass}
              placeholder="Jane Doe (PhD student in my lab); Popichak lab members"
            />
          </Section>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end pt-2 border-t border-gray-200">
            {existing && (
              <button
                type="button"
                onClick={cancel}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle size={16} />
                Cancel volunteering
              </button>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22] disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Gavel size={16} />
              )}
              {existing ? 'Save preferences' : 'Sign me up'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Banner({ tone, text }: { tone: 'success' | 'error'; text: string }) {
  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${
        tone === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      {text}
    </div>
  )
}

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
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-3">
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

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]'
