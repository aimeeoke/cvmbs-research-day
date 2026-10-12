'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type LeaderboardConfigUpdate = {
  thermometer_goal: number
  thermometer_marker_2025: number
  thermometer_marker_2026: number
  race_starts_at: string | null
  event_starts_at: string | null
  awards_dark_at: string | null
  champions_published_at: string | null
  ambassador_cap: number
  split_mode: 'equal_by_department' | 'by_mentor'
  show_thermometer: boolean
  show_guild_showdown: boolean
  show_green_pipette: boolean
  guild_cohort_undergrad: number
  guild_cohort_grad: number
  guild_cohort_dvm: number
  guild_cohort_postdoc_resident_intern: number
  guild_cohort_staff: number
}

export async function updateLeaderboardConfig(
  input: LeaderboardConfigUpdate
): Promise<{ ok: true }> {
  const user = await getCurrentUser()
  if (!user?.isAdmin) throw new Error('Admin access required.')

  const supabase = await createClient()
  const { error } = await supabase
    .from('leaderboard_config')
    .update({ ...input, updated_by: user.id })
    .eq('id', 1)

  if (error) throw new Error(error.message)

  revalidatePath('/leaderboard')
  revalidatePath('/admin/leaderboard')
  return { ok: true }
}
