#!/usr/bin/env node
// Prints the earliest submissions on the active event, oldest first.
// Useful for settling First Blood (the catalog's Legendary "earliest
// timestamp of the season" badge) and for sanity-checking draft order.
//
// Usage:
//   node --env-file=.env.local scripts/first-submission.mjs
//
// Needs NEXT_PUBLIC_SUPABASE_URL + researchday_secret_key in .env.local.

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.researchday_secret_key

if (!url || !key) {
  console.error(
    'Missing env. Need NEXT_PUBLIC_SUPABASE_URL + researchday_secret_key in .env.local.'
  )
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: event, error: eventErr } = await supabase
  .from('events')
  .select('id, year, name')
  .eq('is_active', true)
  .single()

if (eventErr || !event) {
  console.error('Could not find the active event:', eventErr?.message)
  process.exit(1)
}

console.log(`Active event: ${event.name} (${event.year})\n`)

const { data: subs, error: subsErr } = await supabase
  .from('submissions')
  .select('id, status, created_at, submitted_at, finalized_at')
  .eq('event_id', event.id)
  .neq('status', 'withdrawn')
  .order('created_at', { ascending: true })
  .limit(10)

if (subsErr || !subs) {
  console.error('Could not fetch submissions:', subsErr?.message)
  process.exit(1)
}

if (subs.length === 0) {
  console.log('No submissions yet.')
  process.exit(0)
}

const ids = subs.map((s) => s.id)
const { data: authors, error: authorsErr } = await supabase
  .from('submission_authors')
  .select('submission_id, display_name, is_presenter')
  .in('submission_id', ids)
  .eq('is_presenter', true)

if (authorsErr) {
  console.error('Could not fetch presenters:', authorsErr?.message)
  process.exit(1)
}

const presenterBySub = new Map()
for (const a of authors ?? []) {
  presenterBySub.set(a.submission_id, a.display_name)
}

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-US', {
        timeZone: 'America/Denver',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' MT'
    : '—'

console.log('Rank  Created (MT)                 Submitted (MT)               Status        Presenter')
console.log('----  ---------------------------  ---------------------------  ------------  --------------------')
subs.forEach((s, i) => {
  const rank = String(i + 1).padStart(2, ' ')
  const created = fmt(s.created_at).padEnd(27, ' ')
  const submitted = fmt(s.submitted_at).padEnd(27, ' ')
  const status = (s.status ?? '').padEnd(12, ' ')
  const presenter = presenterBySub.get(s.id) ?? '(no presenter row)'
  console.log(`${rank}.   ${created}  ${submitted}  ${status}  ${presenter}`)
})
