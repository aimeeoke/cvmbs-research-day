import { redirect } from 'next/navigation'
import Image from 'next/image'
import {
  ACHIEVEMENTS,
  RARITY_LABELS,
  achievementStickerUrl,
  type AchievementKey,
  type Rarity,
} from '@/lib/leaderboard/achievements-catalog'
import { getAchievementsPageData } from '@/lib/leaderboard/presenter-achievements'

// Presenter-only. Non-presenters bounce quietly to /. Keeps the game-mode
// voice away from faculty/judges who aren't the stars of the show.

export const dynamic = 'force-dynamic'

export default async function AchievementsPage() {
  const data = await getAchievementsPageData()
  if (!data) redirect('/login?next=/achievements')
  if (!data.isPresenter) redirect('/')

  // Build the feed: newest unlock on top, oldest at the bottom. Keyed by
  // the earliest timestamp per badge, which the loader already de-dupes.
  const feed = Array.from(data.earned.entries())
    .map(([key, earnedAt]) => ({ key, earnedAt, achievement: ACHIEVEMENTS[key] }))
    .filter((r) => r.achievement) // defend against stale override rows
    .sort((a, b) => (a.earnedAt < b.earnedAt ? 1 : a.earnedAt > b.earnedAt ? -1 : 0))

  const earnedCount = feed.length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950">
        <div className="relative mx-auto max-w-4xl px-6 py-10">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-300/70">
            Research Crawler Log — Research Day 2027
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {data.displayName}
          </h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <StatPill
              label="Achievements earned"
              value={String(earnedCount)}
            />
            <StatPill label="Abstracts on file" value={String(data.abstractCount)} />
            {data.firstBloodHolder && (
              <StatPill
                label="⚔️ First Blood holder"
                value={data.firstBloodHolder}
                detail="Earliest Draft Submission of the season"
              />
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {feed.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
            <p className="text-slate-300">No achievements unlocked yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Submit an abstract to start your log.
            </p>
          </div>
        ) : (
          <ol className="space-y-4">
            {feed.map(({ key, earnedAt, achievement }) => (
              <FeedRow
                key={key}
                achievement={achievement}
                earnedAt={earnedAt}
                stickerUrl={achievementStickerUrl(key)}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

function StatPill({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="rounded-md border border-slate-700/50 bg-slate-900/70 px-4 py-2">
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 font-semibold text-slate-100">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-slate-500">{detail}</p>}
    </div>
  )
}

function FeedRow({
  achievement,
  earnedAt,
  stickerUrl,
}: {
  achievement: (typeof ACHIEVEMENTS)[AchievementKey]
  earnedAt: string
  stickerUrl: string
}) {
  const rarityClass = RARITY_PILL[achievement.rarity]
  const date = new Date(earnedAt)
  const dateLabel = Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/Denver',
      })

  return (
    <li className="overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-900 to-slate-900/60 shadow-md">
      <div className="flex items-center gap-4 p-4 sm:gap-6 sm:p-5">
        <div className="flex-shrink-0 rounded-lg bg-slate-800/40 p-1">
          <Image
            src={stickerUrl}
            alt={achievement.label}
            width={128}
            height={128}
            className="h-24 w-24 object-contain sm:h-32 sm:w-32"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-100 sm:text-xl">
              {achievement.label}
            </h3>
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${rarityClass}`}
            >
              {RARITY_LABELS[achievement.rarity]}
            </span>
            {dateLabel && (
              <span className="text-xs text-slate-500">· {dateLabel}</span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            <span className="mr-1 font-bold tracking-wider text-amber-300">
              NEW ACHIEVEMENT:
            </span>
            {achievement.announcer}
          </p>
        </div>
      </div>
    </li>
  )
}

const RARITY_PILL: Record<Rarity, string> = {
  common: 'bg-slate-700/60 text-slate-200',
  uncommon: 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30',
  rare: 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/30',
  legendary: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40',
}
