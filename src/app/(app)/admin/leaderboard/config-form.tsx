'use client'

import { useState, useTransition } from 'react'
import { Loader2, Save } from 'lucide-react'
import {
  updateLeaderboardConfig,
  type LeaderboardConfigUpdate,
} from './actions'

type Props = {
  initial: LeaderboardConfigUpdate
}

export default function LeaderboardConfigForm({ initial }: Props) {
  const [state, setState] = useState<LeaderboardConfigUpdate>(initial)
  const [isPending, startTransition] = useTransition()
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const patch = (p: Partial<LeaderboardConfigUpdate>) =>
    setState((s) => ({ ...s, ...p }))

  const onSave = () => {
    startTransition(async () => {
      try {
        await updateLeaderboardConfig(state)
        setBanner({ tone: 'success', text: 'Config saved.' })
      } catch (e) {
        setBanner({ tone: 'error', text: e instanceof Error ? e.message : 'Save failed.' })
      }
    })
  }

  return (
    <div className="space-y-6">
      {banner && (
        <div
          className={`rounded-md border p-3 text-sm ${
            banner.tone === 'success'
              ? 'bg-green-50 border-green-200 text-green-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {banner.text}
        </div>
      )}

      <Section title="Submission thermometer">
        <NumberField
          label="Goal"
          value={state.thermometer_goal}
          onChange={(v) => patch({ thermometer_goal: v })}
        />
        <NumberField
          label="2025 marker"
          value={state.thermometer_marker_2025}
          onChange={(v) => patch({ thermometer_marker_2025: v })}
        />
        <NumberField
          label="2026 marker"
          value={state.thermometer_marker_2026}
          onChange={(v) => patch({ thermometer_marker_2026: v })}
        />
      </Section>

      <Section title="Phase milestones">
        <p className="text-xs text-gray-600 col-span-full">
          Times are entered in your local timezone (America/Denver). Drafts
          and finals deadlines live on the Event row — change those from
          the Supabase dashboard.
        </p>
        <DateTimeField
          label="Race starts at (Nov 18 — department races light up)"
          value={state.race_starts_at}
          onChange={(v) => patch({ race_starts_at: v })}
        />
        <DateTimeField
          label="Event day begins (Jan 23 morning)"
          value={state.event_starts_at}
          onChange={(v) => patch({ event_starts_at: v })}
        />
        <DateTimeField
          label="Awards go dark at (30 min before ceremony)"
          value={state.awards_dark_at}
          onChange={(v) => patch({ awards_dark_at: v })}
        />
        <DateTimeField
          label="Champions published at (leave blank until Jan 24)"
          value={state.champions_published_at}
          onChange={(v) => patch({ champions_published_at: v })}
        />
      </Section>

      <Section title="Green Pipette scoring">
        <NumberField
          label="Ambassador points cap per abstract"
          value={state.ambassador_cap}
          onChange={(v) => patch({ ambassador_cap: v })}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-700">
            Department credit split mode
          </label>
          <select
            value={state.split_mode}
            onChange={(e) =>
              patch({ split_mode: e.target.value as 'equal_by_department' | 'by_mentor' })
            }
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="equal_by_department">
              Equal by distinct department (committee default)
            </option>
            <option value="by_mentor">By mentor count</option>
          </select>
        </div>
      </Section>

      <Section title="Guild Showdown — 2026 cohort sizes">
        <p className="text-xs text-gray-600 col-span-full">
          Each guild&apos;s rank is % of its 2026 cohort who have an abstract in,
          so small guilds can win. Numbers below are the 2026 trainee counts
          for each role group — update as 2027 rosters firm up.
        </p>
        <NumberField
          label="Undergraduate Guild (undergrads + post-baccs)"
          value={state.guild_cohort_undergrad}
          onChange={(v) => patch({ guild_cohort_undergrad: v })}
        />
        <NumberField
          label="Graduate Guild (MS, PhD, MD, MPH)"
          value={state.guild_cohort_grad}
          onChange={(v) => patch({ guild_cohort_grad: v })}
        />
        <NumberField
          label="DVM Guild (incl. all dual-degrees)"
          value={state.guild_cohort_dvm}
          onChange={(v) => patch({ guild_cohort_dvm: v })}
        />
        <NumberField
          label="Postdoc, Resident & Intern Guild"
          value={state.guild_cohort_postdoc_resident_intern}
          onChange={(v) => patch({ guild_cohort_postdoc_resident_intern: v })}
        />
        <NumberField
          label="Research Staff Guild"
          value={state.guild_cohort_staff}
          onChange={(v) => patch({ guild_cohort_staff: v })}
        />
      </Section>

      <Section title="Feature flags">
        <CheckboxField
          label="Show submission thermometer"
          checked={state.show_thermometer}
          onChange={(v) => patch({ show_thermometer: v })}
        />
        <CheckboxField
          label="Show Guild Showdown"
          checked={state.show_guild_showdown}
          onChange={(v) => patch({ show_guild_showdown: v })}
        />
        <CheckboxField
          label="Show Green Pipette"
          checked={state.show_green_pipette}
          onChange={(v) => patch({ show_green_pipette: v })}
        />
        <CheckboxField
          label="Show Platinum Mentoring Top 10"
          checked={state.show_platinum_mentoring}
          onChange={(v) => patch({ show_platinum_mentoring: v })}
        />
        <CheckboxField
          label="Show Department Turnout"
          checked={state.show_dept_turnout}
          onChange={(v) => patch({ show_dept_turnout: v })}
        />
      </Section>

      <div className="flex justify-end border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22] disabled:opacity-50"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save config
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </section>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
      />
    </div>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  )
}

// datetime-local <-> ISO conversion. The input value is in local time with
// no timezone info; we read it as local and store as UTC ISO.
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

function fromLocalInput(v: string): string | null {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | null
  onChange: (v: string | null) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <input
        type="datetime-local"
        value={toLocalInput(value)}
        onChange={(e) => onChange(fromLocalInput(e.target.value))}
        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
      />
    </div>
  )
}
