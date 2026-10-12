import Link from 'next/link'
import { BADGES, type BadgeKey } from '@/lib/leaderboard/badges'
import type { PlayerCardData } from '@/lib/leaderboard/player'

type Props = {
  data: PlayerCardData
}

/**
 * Logged-in-only "player card" that sits at the top of /leaderboard. Follows
 * the Oct 12 brainstorm mockup: avatar + name + guild pill + stat line, with
 * a "Your next quest" box on the right. Visible achievement slots show as
 * filled vs. ? below.
 */
export default function PlayerCard({ data }: Props) {
  // Level ties to visible-badge count so earning one feels like leveling.
  // Floor at 1 so a brand-new user is "Level 1 presenter · 0 of N achievements".
  const level = Math.max(1, data.earnedBadges.length)

  // Build the ordered badge-slot list: earned first, then the rest as ?.
  const earnedSet = new Set<BadgeKey>(data.earnedBadges)
  const allKeys = Object.keys(BADGES) as BadgeKey[]
  const slots = allKeys
    .map((k) => ({ key: k, earned: earnedSet.has(k) }))
    .sort((a, b) => (a.earned === b.earned ? 0 : a.earned ? -1 : 1))

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {/* LEFT: identity + stat line */}
        <div className="flex items-start gap-3">
          <div
            className="h-12 w-12 shrink-0 rounded-full bg-[#1E4D2B]/10 text-[#1E4D2B] flex items-center justify-center font-semibold text-sm"
            aria-hidden
          >
            {data.initials || '?'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{data.displayName}</h2>
              {data.guildLabel && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#1E4D2B]/10 text-[#1E4D2B] text-xs font-semibold">
                  {data.guildLabel}
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-gray-600 mt-0.5">
              Level {level} presenter · {data.earnedBadges.length} of{' '}
              {data.visibleBadgesTotal} achievements
              {data.secretsFound > 0 && (
                <> · {data.secretsFound} secret found</>
              )}
            </p>
          </div>
        </div>

        {/* RIGHT: next quest card */}
        {data.nextQuest && (
          <Link
            href={data.nextQuest.href}
            {...(data.nextQuest.href.startsWith('http')
              ? { target: '_blank', rel: 'noreferrer' }
              : {})}
            className="block rounded-md border border-gray-200 hover:border-[#1E4D2B]/40 px-3 py-2 shrink-0 w-full sm:w-auto sm:max-w-xs"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
              Your next quest
            </p>
            <p className="text-sm font-semibold text-[#1E4D2B] mt-0.5">
              {data.nextQuest.title}
            </p>
            <p className="font-mono text-xs text-green-700 mt-0.5">
              {data.nextQuest.reward}
            </p>
          </Link>
        )}
      </div>

      {/* Achievement tiles — earned ones get color, locked show as ?. */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {slots.map((s) => {
          const def = BADGES[s.key]
          return (
            <span
              key={s.key}
              title={s.earned ? `${def.label} — ${def.blurb}` : 'Locked'}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-base border ${
                s.earned
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              {s.earned ? def.emoji : '?'}
            </span>
          )
        })}
        {data.secretsTotal > 0 && (
          <span className="font-mono text-xs text-gray-500 ml-1">
            {data.secretsTotal - data.secretsFound} secret achievements remain
          </span>
        )}
      </div>
    </section>
  )
}
