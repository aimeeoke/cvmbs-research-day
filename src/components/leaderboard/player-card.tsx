import Link from 'next/link'
import { BADGES, SECRET_BADGES, type BadgeKey, type SecretBadgeKey } from '@/lib/leaderboard/badges'
import type { PlayerCardData } from '@/lib/leaderboard/player'

type Props = {
  data: PlayerCardData
}

/**
 * Logged-in-only "player card" that sits at the top of /leaderboard. Follows
 * the Oct 12 brainstorm mockup: avatar + name + guild pill + stat line, with
 * a "Your next quest" box on the right.
 *
 * Badge strip shows every earned badge (visible = amber, secret = purple)
 * followed by TEASER_SLOTS "?" tiles. The teasers are intentionally fixed —
 * never shows a denominator — so new badges can be added without ruining
 * the "there's always more to find" feeling.
 */
const TEASER_SLOTS = 3

export default function PlayerCard({ data }: Props) {
  // Level ties to visible-badge count so earning one feels like leveling.
  // Floor at 1 so a brand-new user is "Level 1 presenter".
  const level = Math.max(1, data.earnedBadges.length)
  const totalEarned = data.earnedBadges.length + data.earnedSecrets.length

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
              Level {level} presenter · {totalEarned} badge
              {totalEarned === 1 ? '' : 's'} earned
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

      {/* Earned badges only — amber for visible, purple for secrets —
          followed by TEASER_SLOTS "?" tiles to hint there's always more. */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {data.earnedBadges.map((key: BadgeKey) => {
          const def = BADGES[key]
          return (
            <span
              key={key}
              title={`${def.label} — ${def.blurb}`}
              className="h-8 w-8 rounded-full flex items-center justify-center text-base border bg-amber-50 border-amber-300"
            >
              {def.emoji}
            </span>
          )
        })}
        {data.earnedSecrets.map((key: SecretBadgeKey) => {
          const def = SECRET_BADGES[key]
          return (
            <span
              key={`secret-${key}`}
              title={`${def.label} — ${def.blurb}`}
              className="h-8 w-8 rounded-full flex items-center justify-center text-base border bg-purple-50 border-purple-300"
            >
              {def.emoji}
            </span>
          )
        })}
        {Array.from({ length: TEASER_SLOTS }).map((_, i) => (
          <span
            key={`teaser-${i}`}
            title="More to earn — keep going."
            className="h-8 w-8 rounded-full flex items-center justify-center text-base border bg-gray-50 border-gray-200 text-gray-400"
          >
            ?
          </span>
        ))}
      </div>
    </section>
  )
}
