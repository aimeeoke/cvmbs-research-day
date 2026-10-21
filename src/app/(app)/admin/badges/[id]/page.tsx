import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  computeAchievementsForAbstract,
  computeTriggerDetails,
  EARLY_BIRD_COUNT,
} from '@/lib/leaderboard/achievements'
import {
  ACHIEVEMENT_LIST,
  ACHIEVEMENTS,
  FAMILY_LABELS,
  RARITY_LABELS,
  RARITY_ORDER,
  type AchievementKey,
} from '@/lib/leaderboard/achievements-catalog'
import { richTextToPlainText } from '@/lib/rich-text'
import { setBadgeOverride } from '../actions'

export const metadata = { title: 'Review badges · Admin' }

export const dynamic = 'force-dynamic'

type PageParams = Promise<{ id: string }>

export default async function AdminBadgeReview({ params }: { params: PageParams }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, submission_closes_at')
    .eq('is_active', true)
    .maybeSingle()
  if (!event) notFound()

  const [{ data: subs }, { data: authors }, { data: overrides }, { data: earlyBirdRows }] =
    await Promise.all([
      supabase
        .from('submissions')
        .select(
          'id, status, submitted_at, title, abstract, funding, affiliations'
        )
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('submission_authors')
        .select('display_name, is_presenter, is_mentor, position')
        .eq('submission_id', id)
        .order('position', { ascending: true }),
      supabase
        .from('badge_overrides')
        .select('badge_key, action, reason, admin_id, updated_at')
        .eq('submission_id', id),
      supabase
        .from('submissions')
        .select('id')
        .eq('event_id', event.id)
        .not('submitted_at', 'is', null)
        .neq('status', 'withdrawn')
        .order('submitted_at', { ascending: true })
        .limit(EARLY_BIRD_COUNT),
    ])
  const s = subs as
    | {
        id: string
        status: string
        submitted_at: string | null
        title: string | null
        abstract: string | null
        funding: string | null
        affiliations: string[] | null
      }
    | null
  if (!s) notFound()

  // First Blood: scan the whole event for min(submitted_at) non-withdrawn.
  const { data: minRow } = await supabase
    .from('submissions')
    .select('id')
    .eq('event_id', event.id)
    .not('submitted_at', 'is', null)
    .neq('status', 'withdrawn')
    .order('submitted_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  const firstBloodId = minRow?.id ?? null

  const authorList = (authors ?? []) as Array<{
    display_name: string | null
    is_presenter: boolean
    is_mentor: boolean
    position: number
  }>
  const authorCount = authorList.length
  const mentorCount = authorList.filter((a) => a.is_mentor).length
  const presenter = authorList.find((a) => a.is_presenter)
  const earliestIds = new Set((earlyBirdRows ?? []).map((r) => r.id as string))

  const computed = computeAchievementsForAbstract({
    id: s.id,
    submittedAt: s.submitted_at,
    submissionClosesAt: event.submission_closes_at ?? null,
    isAmongFirstN: earliestIds.has(s.id),
    isFirstBlood: s.id === firstBloodId,
    authorCount,
    mentorCount,
    titleHtml: s.title,
    abstractHtml: s.abstract,
    affiliations: s.affiliations ?? [],
    funding: s.funding,
  })

  const triggers = computeTriggerDetails({
    titleHtml: s.title,
    abstractHtml: s.abstract,
    funding: s.funding,
  })

  const overrideMap = new Map<string, { action: 'grant' | 'revoke'; reason: string | null }>()
  for (const o of (overrides ?? []) as Array<{
    badge_key: string
    action: 'grant' | 'revoke'
    reason: string | null
  }>) {
    overrideMap.set(o.badge_key, { action: o.action, reason: o.reason })
  }

  // Final effective set: computed ∪ grants − revokes.
  const effective = new Set<AchievementKey>(computed)
  for (const [key, o] of overrideMap) {
    const k = key as AchievementKey
    if (o.action === 'grant') effective.add(k)
    else effective.delete(k)
  }

  // Order catalog like /achievements: by family then rarity.
  const familyOrder: Array<keyof typeof FAMILY_LABELS> = [
    'timing', 'content', 'boss', 'authors', 'affiliations',
    'funding', 'attendance', 'green_labs', 'day_of',
  ]
  const sortedList = [...ACHIEVEMENT_LIST].sort((a, b) => {
    const fa = familyOrder.indexOf(a.family)
    const fb = familyOrder.indexOf(b.family)
    if (fa !== fb) return fa - fb
    const r = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
    if (r !== 0) return r
    return a.label.localeCompare(b.label)
  })

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Link href="/admin/badges" className="text-sm text-indigo-700 hover:underline">
        ← Back to badge review
      </Link>
      <h1 className="mt-2 text-2xl font-bold">
        {richTextToPlainText(s.title) || '(untitled)'}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Presenter: {presenter?.display_name ?? '—'} · Status: {s.status} ·{' '}
        {authorCount} author{authorCount === 1 ? '' : 's'} · {mentorCount} mentor
        {mentorCount === 1 ? '' : 's'}
      </p>
      {s.id === firstBloodId && (
        <p className="mt-2 inline-block rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
          ⚔️ Current First Blood holder on this event
        </p>
      )}

      <div className="mt-6 rounded border border-gray-200 bg-gray-50 p-4 text-sm">
        <p className="font-semibold text-gray-900">
          {effective.size} badge{effective.size === 1 ? '' : 's'} effective
        </p>
        <p className="text-gray-600">
          {computed.size} computed + {overrideMap.size === 0 ? '0' : overrideMap.size} override
          {overrideMap.size === 1 ? '' : 's'}. Grant adds a badge the keyword
          logic missed; revoke removes a false positive.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {familyOrder.map((fam) => {
          const inFam = sortedList.filter((a) => a.family === fam)
          if (inFam.length === 0) return null
          return (
            <section key={fam}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {FAMILY_LABELS[fam]}
              </h2>
              <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
                {inFam.map((a) => {
                  const key = a.key
                  const didCompute = computed.has(key)
                  const override = overrideMap.get(key)
                  const isEffective = effective.has(key)
                  const kwHits = triggers[key] ?? []
                  return (
                    <div key={key} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-lg">
                          {a.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-gray-900">{a.label}</p>
                            <span className="rounded bg-gray-100 px-1.5 text-[10px] uppercase tracking-wider text-gray-600">
                              {RARITY_LABELS[a.rarity]}
                            </span>
                            {isEffective ? (
                              <span className="rounded bg-green-100 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-green-800">
                                Earned
                              </span>
                            ) : (
                              <span className="rounded bg-gray-100 px-1.5 text-[10px] uppercase tracking-wider text-gray-500">
                                Not earned
                              </span>
                            )}
                            {override && (
                              <span
                                className={`rounded px-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                                  override.action === 'grant'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {override.action}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{a.blurb}</p>
                          {kwHits.length > 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                              Keyword hits:{' '}
                              <span className="font-mono text-gray-700">
                                {kwHits.join(', ')}
                              </span>
                            </p>
                          )}
                          {override?.reason && (
                            <p className="mt-1 text-xs italic text-gray-600">
                              Override reason: {override.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                        {!didCompute && !override && (
                          <OverrideButton
                            submissionId={s.id}
                            badgeKey={key}
                            action="grant"
                            label="Grant"
                            tone="indigo"
                          />
                        )}
                        {didCompute && !override && (
                          <OverrideButton
                            submissionId={s.id}
                            badgeKey={key}
                            action="revoke"
                            label="Revoke"
                            tone="rose"
                          />
                        )}
                        {override && (
                          <OverrideButton
                            submissionId={s.id}
                            badgeKey={key}
                            action="clear"
                            label="Clear override"
                            tone="gray"
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function OverrideButton({
  submissionId,
  badgeKey,
  action,
  label,
  tone,
}: {
  submissionId: string
  badgeKey: string
  action: 'grant' | 'revoke' | 'clear'
  label: string
  tone: 'indigo' | 'rose' | 'gray'
}) {
  const toneClass = {
    indigo: 'bg-indigo-600 text-white hover:bg-indigo-700',
    rose: 'bg-rose-600 text-white hover:bg-rose-700',
    gray: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  }[tone]
  return (
    <form action={setBadgeOverride}>
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="badge_key" value={badgeKey} />
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        className={`whitespace-nowrap rounded px-3 py-1 text-xs font-medium ${toneClass}`}
      >
        {label}
      </button>
    </form>
  )
}
