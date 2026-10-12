import { createClient } from '@/lib/supabase/server'

// Single-row config table — see 2026-10-12_leaderboard_config.sql.
// Phase-computation code reads this plus the active event's submission
// deadlines to decide what to show on /leaderboard.

export type LeaderboardConfig = {
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
}

// Phase names follow Part 3.2 of the leaderboard spec. "pre_race" and
// "race_on" are the two pre-event phases; "event" is the single Jan 23
// window; "sealed" is awards-minus-30 → champions-publish; "champions" is
// Jan 24 onward.
export type LeaderboardPhase =
  | 'pre_race'
  | 'race_on'
  | 'event'
  | 'sealed'
  | 'champions'

export async function getLeaderboardConfig(): Promise<LeaderboardConfig> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leaderboard_config')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) throw new Error(`Failed to load leaderboard config: ${error.message}`)
  return data as LeaderboardConfig
}

// Pure phase computation. Takes config + current time; returns the phase
// label. Separated from the data fetch so it's trivial to unit-test.
export function computePhase(
  config: LeaderboardConfig,
  now: Date = new Date()
): LeaderboardPhase {
  const t = now.getTime()
  const after = (iso: string | null) => iso !== null && t >= new Date(iso).getTime()

  if (after(config.champions_published_at)) return 'champions'
  if (after(config.awards_dark_at)) return 'sealed'
  if (after(config.event_starts_at)) return 'event'
  if (after(config.race_starts_at)) return 'race_on'
  return 'pre_race'
}

// Human-readable subheading per phase. Pulled verbatim from Part 3.2 so the
// committee doc and the page agree.
export function phaseSubheading(phase: LeaderboardPhase): string {
  switch (phase) {
    case 'pre_race':
      return 'The Guild Showdown has begun. ⚔️ The department races start November 18.'
    case 'race_on':
      return 'The race is on! Every abstract, every ambassador and every judge counts.'
    case 'event':
      return "It's Research Day! 🔴 Scores drop at 11:30 and 2:00."
    case 'sealed':
      return '🔒 Results sealed. Winners revealed at the awards ceremony!'
    case 'champions':
      return 'The pipettes have been awarded. Congratulations, crawlers! 🏆'
  }
}
