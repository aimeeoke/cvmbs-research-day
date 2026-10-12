import { GUILDS, type GuildKey } from '@/lib/leaderboard/guilds'

type Props = {
  counts: Record<GuildKey, number>
}

/**
 * Five horizontal bars, ranked, with abstract counts. Bar width is relative
 * to the top guild so leading guilds dominate the visual even when totals
 * are small. Numbers also appear as text per the committee a11y rule.
 */
export default function GuildShowdown({ counts }: Props) {
  const rows = GUILDS.map((g) => ({ ...g, count: counts[g.key] })).sort(
    (a, b) => b.count - a.count
  )
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          ⚔️ Guild Showdown
        </h2>
        <p className="text-xs text-gray-600 mt-0.5">
          The winner is decided by who actually <strong>presents</strong> on
          Research Day and is revealed at the awards ceremony. No-shows don&apos;t count!
        </p>
      </div>

      <ol className="space-y-2">
        {rows.map((r, idx) => {
          const pct = Math.max(2, (r.count / max) * 100)
          return (
            <li key={r.key} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-gray-800">
                  <span className="mr-1 inline-block w-5 text-right text-gray-500 text-xs font-mono">
                    {idx + 1}.
                  </span>
                  <span className="mr-1" aria-hidden>
                    {r.emoji}
                  </span>
                  {r.label}
                </span>
                <span className="font-semibold text-[#1E4D2B]">
                  {r.count} <span className="text-gray-500 font-normal text-xs">abstract{r.count === 1 ? '' : 's'}</span>
                </span>
              </div>
              <div className="h-3 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1E4D2B] to-[#2d6b3f] motion-reduce:transition-none transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
