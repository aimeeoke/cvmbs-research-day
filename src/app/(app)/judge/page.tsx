import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import type { JudgeEligibility, JudgeFormat } from '@/lib/types/database'
import { JudgeForm, type FormatOption, type TimeSlot } from './judge-form'

export const metadata = { title: 'Volunteer to Judge · CVMBS Research Day' }

// TODO: pull these from src/lib/schedule.ts once the 2027 schedule is loaded.
const TIME_SLOTS: TimeSlot[] = [
  { id: 'morning', label: 'Morning session', hint: 'Morning of Research Day' },
  { id: 'afternoon_a', label: 'Early afternoon session' },
  { id: 'afternoon_b', label: 'Late afternoon session' },
]

const FORMATS: FormatOption[] = [
  {
    id: 'oral',
    label: 'Oral presentations',
    hint: 'Faculty only — judge trainee talks in the auditorium.',
  },
  {
    id: 'poster_regular',
    label: 'Regular poster session',
    hint: 'Faculty and advanced-stage trainees. Advanced trainees will not be assigned to other advanced trainees.',
  },
  {
    id: 'poster_undergrad',
    label: 'Undergraduate poster session',
    hint: 'Anyone can judge except undergraduates themselves.',
  },
]

export default async function JudgePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/judge')

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()

  const { data: existing } = event
    ? await supabase
        .from('judge_registrations')
        .select(
          'first_name, last_name, email, eligibility, detailed_role, preferred_time_slots, preferred_formats, conflicts, cancelled_at'
        )
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

  const existingTyped = existing
    ? {
        ...existing,
        eligibility: existing.eligibility as JudgeEligibility,
        preferred_formats: existing.preferred_formats as JudgeFormat[],
      }
    : null

  return (
    <JudgeForm
      defaultFirstName={user.profile?.first_name ?? ''}
      defaultLastName={user.profile?.last_name ?? ''}
      defaultEmail={user.email}
      timeSlots={TIME_SLOTS}
      formats={FORMATS}
      existing={existingTyped}
    />
  )
}
