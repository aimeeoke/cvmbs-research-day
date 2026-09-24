'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { JudgeEligibility, JudgeFormat } from '@/lib/types/database'

export type JudgeRegistrationInput = {
  first_name: string
  last_name: string
  email: string
  eligibility: JudgeEligibility
  detailed_role: string | null
  preferred_time_slots: string[]
  preferred_formats: JudgeFormat[]
  conflicts: string | null
}

const ALLOWED_FORMATS: Record<JudgeEligibility, JudgeFormat[]> = {
  faculty: ['oral', 'poster_regular', 'poster_undergrad'],
  advanced_trainee: ['poster_regular', 'poster_undergrad'],
  early_trainee: ['poster_undergrad'],
  undergrad: [],
}

async function requireUserAndEvent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/judge')

  const { data: event, error } = await supabase
    .from('events')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!event) throw new Error('No active event configured.')

  return { supabase, user, event }
}

function sanitize(input: JudgeRegistrationInput) {
  const first = input.first_name.trim()
  const last = input.last_name.trim()
  const email = input.email.trim().toLowerCase()
  if (!first) throw new Error('First name is required.')
  if (!last) throw new Error('Last name is required.')
  if (!email) throw new Error('Email is required.')

  if (input.eligibility === 'undergrad') {
    throw new Error(
      'Undergraduates are not eligible to judge. Please talk to the Research Day admin if you think this is a mistake.'
    )
  }

  const allowed = ALLOWED_FORMATS[input.eligibility] ?? []
  const formats = input.preferred_formats.filter((f) => allowed.includes(f))
  if (formats.length === 0) {
    throw new Error('Choose at least one judging format you can cover.')
  }
  if (input.preferred_time_slots.length === 0) {
    throw new Error('Choose at least one preferred time slot.')
  }

  return {
    first_name: first,
    last_name: last,
    email,
    eligibility: input.eligibility,
    detailed_role: input.detailed_role?.trim() || null,
    preferred_time_slots: input.preferred_time_slots,
    preferred_formats: formats,
    conflicts: input.conflicts?.trim() || null,
  }
}

export async function saveJudgeRegistration(input: JudgeRegistrationInput) {
  const { supabase, user, event } = await requireUserAndEvent()
  const cleaned = sanitize(input)

  const { error } = await supabase
    .from('judge_registrations')
    .upsert(
      {
        event_id: event.id,
        user_id: user.id,
        cancelled_at: null,
        ...cleaned,
      },
      { onConflict: 'event_id,user_id' }
    )

  if (error) throw new Error(error.message)
  revalidatePath('/judge')
  return { ok: true as const }
}

export async function cancelJudgeRegistration() {
  const { supabase, user, event } = await requireUserAndEvent()
  const { error } = await supabase
    .from('judge_registrations')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('event_id', event.id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/judge')
  return { ok: true as const }
}

export async function reactivateJudgeRegistration() {
  const { supabase, user, event } = await requireUserAndEvent()
  const { error } = await supabase
    .from('judge_registrations')
    .update({ cancelled_at: null })
    .eq('event_id', event.id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/judge')
  return { ok: true as const }
}
