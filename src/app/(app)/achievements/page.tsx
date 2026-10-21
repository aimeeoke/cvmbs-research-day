import { redirect } from 'next/navigation'
import {
  ACHIEVEMENT_LIST,
  FAMILY_LABELS,
  RARITY_LABELS,
  RARITY_ORDER,
  type Achievement,
  type AchievementFamily,
  type Rarity,
} from '@/lib/leaderboard/achievements-catalog'
import { getAchievementsPageData } from '@/lib/leaderboard/presenter-achievements'
import { Lock } from 'lucide-react'

// Presenter-only. Non-presenters bounce quietly to /. Keeps the game-mode
// voice away from faculty/judges who aren't the stars of the show.

export const dynamic = 'force-dynamic'

// Families that keep showing locked / hint tiles so trainees know what's
// still on the board. Everything else only renders earned cards.
const HINT_FAMILIES: ReadonlySet<AchievementFamily> = new Set([
  'green_labs',
  'day_of',
])

export default async function AchievementsPage() {
  const data = await getAchievementsPageData()
  if (!data) redirect('/login?next=/achievements')
  if (!data.isPresenter) redirect('/')

  // Group catalog entries by family in a stable order.
  const families: AchievementFamily[] = [
    'timing',
    'content',
    'boss',
    'authors',
    'affiliations',
    'funding',
    'attendance',
    'green_labs',
    'day_of',
  ]
  const byFamily = new Map<AchievementFamily, Achievement[]>()
  for (const f of families) byFamily.set(f, [])
  for (const a of ACHIEVEMENT_LIST) {
    byFamily.get(a.family)!.push(a)
  }
  for (const [, list] of byFamily) {
    list.sort((a, b) => {
      const r = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
      if (r !== 0) return r
      return a.label.localeCompare(b.label)
    })
  }

  const earnedCount = data.earned.size

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950">
        <div className="relative mx-auto max-w-6xl px-6 py-10">
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

      {/* Family sections */}
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        {families.map((family) => {
          const list = byFamily.get(family) ?? []
          if (list.length === 0) return null

          const showHints = HINT_FAMILIES.has(family)
          const visibleList = showHints
            ? list
            : list.filter((a) => data.earned.has(a.key))
          if (visibleList.length === 0) return null

          return (
            <section key={family}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-100">
                  {FAMILY_LABELS[family]}
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleList.map((a) => (
                  <AchievementCard
                    key={a.key}
                    achievement={a}
                    earned={data.earned.has(a.key)}
                    unlockedAnywhere={data.unlockedAnywhere.has(a.key)}
                  />
                ))}
              </div>
            </section>
          )
        })}
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

function AchievementCard({
  achievement,
  earned,
  unlockedAnywhere,
}: {
  achievement: Achievement
  earned: boolean
  unlockedAnywhere: boolean
}) {
  // Four render states:
  //   earned           → full color, show emoji + announcer
  //   visible, unearn  → muted, show emoji + blurb, no announcer
  //   secret, unlocked → "???" tile, show rarity but hide name
  //   secret, locked   → fully locked
  const isSecret = !achievement.visible
  const showIdentity = earned || achievement.visible || (isSecret && unlockedAnywhere)
  const showName = earned || achievement.visible
  const showAnnouncer = earned

  const rarityClass = RARITY_PILL[achievement.rarity]

  if (!showIdentity) {
    // Fully locked
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-800 text-slate-500">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-slate-500">???</p>
            <p className={`mt-1 inline-block rounded px-1.5 text-[10px] uppercase tracking-wider ${rarityClass}`}>
              {RARITY_LABELS[achievement.rarity]}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={
        earned
          ? 'rounded-lg border border-indigo-500/40 bg-indigo-950/40 p-4 shadow-sm ring-1 ring-indigo-400/20'
          : 'rounded-lg border border-slate-800 bg-slate-900/50 p-4'
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            earned
              ? 'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-indigo-500/20 text-xl'
              : 'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-slate-800 text-xl opacity-40'
          }
        >
          {achievement.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className={earned ? 'font-semibold text-slate-100' : 'font-medium text-slate-300'}>
              {showName ? achievement.label : '???'}
            </p>
            <span
              className={`inline-block rounded px-1.5 text-[10px] uppercase tracking-wider ${rarityClass}`}
            >
              {RARITY_LABELS[achievement.rarity]}
            </span>
            {achievement.availability === 'phase2' && !earned && (
              <span className="inline-block rounded border border-amber-500/40 bg-amber-500/10 px-1.5 text-[10px] uppercase tracking-wider text-amber-200">
                Coming soon
              </span>
            )}
          </div>
          <p
            className={
              earned ? 'mt-2 text-sm text-slate-300' : 'mt-2 text-sm text-slate-500'
            }
          >
            {showAnnouncer ? achievement.announcer : achievement.blurb}
          </p>
        </div>
      </div>
    </div>
  )
}

const RARITY_PILL: Record<Rarity, string> = {
  common: 'bg-slate-700/50 text-slate-300',
  uncommon: 'bg-emerald-500/15 text-emerald-300',
  rare: 'bg-blue-500/15 text-blue-300',
  legendary: 'bg-amber-500/15 text-amber-200',
}
