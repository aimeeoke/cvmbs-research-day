// Who can see /achievements and the game-mode sidebar entry.
//
// The audience is intentionally narrow: PRESENTERS on the active event only.
// Non-presenter faculty, mentors, judges, and the general public don't see
// any of the Dungeon Crawler Carl voice — keeps the game vibe for the
// stars of Research Day without worrying about senior faculty finding the
// announcer tone unprofessional.
//
// "Presenter" = at least one row in submission_authors with is_presenter=true,
// on a non-withdrawn submission on the active event, linked to this user by
// profile_id OR email match.

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

/**
 * Returns true if the signed-in user is a presenter on at least one
 * non-withdrawn abstract on the active event. React-cached per request
 * so repeated calls (sidebar + page) only query once.
 */
export const isPresenterOnActiveEvent = cache(
  async (userId: string, email: string | null): Promise<boolean> => {
    const supabase = await createClient()

    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()

    if (!event) return false

    // Two possible identity matches on submission_authors: profile_id (the
    // user has linked their account) OR email (proxy-submitted and the user
    // hasn't signed in yet, or email alias). Email can be absent (null user).
    const normalizedEmail = (email ?? '').toLowerCase()
    const orClause = normalizedEmail
      ? `profile_id.eq.${userId},email.eq.${normalizedEmail}`
      : `profile_id.eq.${userId}`

    const { data: rows } = await supabase
      .from('submission_authors')
      .select('submission_id, submissions!inner(status, event_id)')
      .eq('is_presenter', true)
      .eq('submissions.event_id', event.id)
      .neq('submissions.status', 'withdrawn')
      .or(orClause)
      .limit(1)

    return (rows ?? []).length > 0
  }
)
