import { createClient } from '@/lib/supabase/server'
import { classificationToGuild, GUILDS, type GuildKey } from './guilds'

/**
 * Thermometer count rule from the committee doc (Part 2 · item 5):
 *   - Before Jan 7 finals deadline: count submissions in draft/submitted/
 *     finalized (excluding withdrawn)
 *   - On/after Jan 7: count only finalized submissions
 *
 * Jan 7 cutover reads events.finalize_deadline_at so admin can shift it.
 */
export async function getThermometerCount(now: Date = new Date()): Promise<{
  count: number
  mode: 'drafts' | 'finals'
}> {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, finalize_deadline_at')
    .eq('is_active', true)
    .maybeSingle()

  if (!event) return { count: 0, mode: 'drafts' }

  const finalsCutover = event.finalize_deadline_at
    ? new Date(event.finalize_deadline_at)
    : null
  const mode: 'drafts' | 'finals' =
    finalsCutover && now >= finalsCutover ? 'finals' : 'drafts'

  const query = supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', event.id)

  if (mode === 'finals') {
    query.eq('status', 'finalized')
  } else {
    query.neq('status', 'withdrawn')
  }

  const { count } = await query
  return { count: count ?? 0, mode }
}

/**
 * Guild Showdown: count non-withdrawn submissions per guild for the active
 * event. Drafts phase (per the committee doc) counts drafts + submitted;
 * post-Jan 7 switches to finalized-only, same cutover as the thermometer.
 */
export async function getGuildCounts(
  now: Date = new Date()
): Promise<{ counts: Record<GuildKey, number>; unassigned: number; mode: 'drafts' | 'finals' }> {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, finalize_deadline_at')
    .eq('is_active', true)
    .maybeSingle()

  const empty = GUILDS.reduce(
    (acc, g) => ({ ...acc, [g.key]: 0 }),
    {} as Record<GuildKey, number>
  )

  if (!event) return { counts: empty, unassigned: 0, mode: 'drafts' }

  const finalsCutover = event.finalize_deadline_at
    ? new Date(event.finalize_deadline_at)
    : null
  const mode: 'drafts' | 'finals' =
    finalsCutover && now >= finalsCutover ? 'finals' : 'drafts'

  const query = supabase
    .from('submissions')
    .select('classification')
    .eq('event_id', event.id)

  if (mode === 'finals') {
    query.eq('status', 'finalized')
  } else {
    query.neq('status', 'withdrawn')
  }

  const { data: rows } = await query

  const counts = { ...empty }
  let unassigned = 0
  for (const r of rows ?? []) {
    const g = classificationToGuild((r as { classification: string | null }).classification)
    if (g) counts[g]++
    else unassigned++
  }

  return { counts, unassigned, mode }
}
