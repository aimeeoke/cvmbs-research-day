import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeAchievementsForAbstract, EARLY_BIRD_COUNT } from '@/lib/leaderboard/achievements'
import {
  ACHIEVEMENTS,
  FAMILY_LABELS,
  type AchievementKey,
} from '@/lib/leaderboard/achievements-catalog'
import { richTextToPlainText } from '@/lib/rich-text'

export const metadata = { title: 'Badges · Admin' }

export const dynamic = 'force-dynamic'

export default async function AdminBadgesIndex() {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, submission_closes_at')
    .eq('is_active', true)
    .maybeSingle()

  if (!event) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-gray-600">No active event.</p>
      </div>
    )
  }

  const [{ data: subs }, { data: authors }, { data: overrides }, { data: earlyBirdRows }] =
    await Promise.all([
      supabase
        .from('submissions')
        .select(
          'id, status, submitted_at, title, abstract, funding, affiliations'
        )
        .eq('event_id', event.id)
        .neq('status', 'withdrawn')
        .order('submitted_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true }),
      supabase
        .from('submission_authors')
        .select('submission_id, display_name, is_presenter, is_mentor'),
      supabase
        .from('badge_overrides')
        .select('submission_id, badge_key, action'),
      supabase
        .from('submissions')
        .select('id')
        .eq('event_id', event.id)
        .not('submitted_at', 'is', null)
        .neq('status', 'withdrawn')
        .order('submitted_at', { ascending: true })
        .limit(EARLY_BIRD_COUNT),
    ])

  type Sub = {
    id: string
    status: string
    submitted_at: string | null
    title: string | null
    abstract: string | null
    funding: string | null
    affiliations: string[] | null
  }
  const submissions = (subs ?? []) as Sub[]
  const authorsBySub = new Map<
    string,
    Array<{ display_name: string | null; is_presenter: boolean; is_mentor: boolean }>
  >()
  for (const row of (authors ?? []) as Array<{
    submission_id: string
    display_name: string | null
    is_presenter: boolean
    is_mentor: boolean
  }>) {
    const list = authorsBySub.get(row.submission_id) ?? []
    list.push(row)
    authorsBySub.set(row.submission_id, list)
  }
  const overridesBySub = new Map<string, number>()
  for (const row of (overrides ?? []) as Array<{ submission_id: string }>) {
    overridesBySub.set(row.submission_id, (overridesBySub.get(row.submission_id) ?? 0) + 1)
  }

  // First Blood: single min(submitted_at) non-withdrawn.
  let firstBloodId: string | null = null
  let firstBloodTs: string | null = null
  for (const s of submissions) {
    if (!s.submitted_at) continue
    if (firstBloodTs === null || s.submitted_at < firstBloodTs) {
      firstBloodTs = s.submitted_at
      firstBloodId = s.id
    }
  }

  const earliestIds = new Set((earlyBirdRows ?? []).map((r) => r.id as string))

  type Row = {
    id: string
    presenter: string
    status: string
    titlePlain: string
    computedCount: number
    overrideCount: number
  }
  const rows: Row[] = submissions.map((s) => {
    const auth = authorsBySub.get(s.id) ?? []
    const presenterName =
      auth.find((a) => a.is_presenter)?.display_name ?? '(no presenter)'
    const authorCount = auth.length
    const mentorCount = auth.filter((a) => a.is_mentor).length
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
    return {
      id: s.id,
      presenter: presenterName,
      status: s.status,
      titlePlain: richTextToPlainText(s.title) || '(untitled)',
      computedCount: computed.size,
      overrideCount: overridesBySub.get(s.id) ?? 0,
    }
  })

  const totalComputed = rows.reduce((sum, r) => sum + r.computedCount, 0)
  const totalOverrides = Array.from(overridesBySub.values()).reduce(
    (sum, n) => sum + n,
    0
  )
  const familyCount = Object.keys(FAMILY_LABELS).length
  const catalogSize = Object.keys(ACHIEVEMENTS).length

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-indigo-700 hover:underline">
          ← Back to admin
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Badge review</h1>
        <p className="mt-1 text-sm text-gray-600">
          {catalogSize} achievements across {familyCount} families.{' '}
          {totalComputed} total badges would fire across {rows.length} abstracts.{' '}
          {totalOverrides > 0 && (
            <>
              <span className="font-medium">{totalOverrides}</span> admin
              override{totalOverrides === 1 ? '' : 's'} active.
            </>
          )}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2">Presenter</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Badges</th>
              <th className="px-3 py-2 text-right">Overrides</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 align-top text-gray-900">{r.presenter}</td>
                <td className="px-3 py-2 align-top text-gray-700">
                  <span className="line-clamp-2">{r.titlePlain}</span>
                </td>
                <td className="px-3 py-2 align-top">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 align-top text-right tabular-nums text-gray-700">
                  {r.computedCount}
                </td>
                <td className="px-3 py-2 align-top text-right tabular-nums">
                  {r.overrideCount > 0 ? (
                    <span className="font-semibold text-amber-700">
                      {r.overrideCount}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2 align-top text-right">
                  <Link
                    href={`/admin/badges/${r.id}`}
                    className="text-indigo-700 hover:underline"
                  >
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
