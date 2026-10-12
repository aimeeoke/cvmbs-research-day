import { GUILDS, type GuildKey } from '@/lib/leaderboard/guilds'

type Props = {
  counts: Record<GuildKey, number>
  cohorts: Record<GuildKey, number>
}

/**
 * Guild race scored as % of each guild's 2026 cohort who have an abstract
 * in — so small guilds (Research Staff with 4 potential presenters) can
 * win against large ones (DVM with 59). Guilds with zero abstracts aren't
 * ranked; they appear in a footer as "Waiting for a first entry". Ties
 * share rank (T-N).
 */
export default function GuildShowdown({ counts, cohorts }: Props) {
  const scored = GUILDS.map((g) => {
    const count = counts[g.key] ?? 0
    const cohort = cohorts[g.key] ?? 0
    const percent = cohort > 0 ? count / cohort : 0
    return { ...g, count, cohort, percent }
  })

  const racing = scored.filter((r) => r.count > 0)
  const waiting = scored.filter((r) => r.count === 0)

  // Sort racers high → low on percent. Then assign tie-aware ranks:
  // 1, 2, T-3, T-3, 5. ("T-" prefix only when two or more guilds tie.)
  racing.sort((a, b) => b.percent - a.percent)
  const ranks: Array<{ label: string }> = []
  for (let i = 0; i < racing.length; i++) {
    const r = racing[i]
    // Count how many share this exact percent, and find the leftmost index.
    const same = racing.filter((x) => x.percent === r.percent)
    const firstIdx = racing.findIndex((x) => x.percent === r.percent)
    const rank = firstIdx + 1
    ranks.push({ label: same.length > 1 ? `T-${rank}` : `${rank}` })
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          ⚔️ Guild Showdown
        </h2>
        <p className="font-mono text-xs text-gray-600 mt-0.5">
          Bars show progress toward each guild&apos;s own 2026 total, so small
          guilds can win.
        </p>
      </div>

      {racing.length > 0 ? (
        <ol className="space-y-2">
          {racing.map((r, idx) => {
            const pct = Math.min(100, r.percent * 100)
            return (
              <li key={r.key} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-gray-800">
                    <span className="mr-1 inline-block w-7 text-right font-mono text-gray-500 text-xs">
                      {ranks[idx].label}·
                    </span>
                    <span className="mr-1" aria-hidden>
                      {r.emoji}
                    </span>
                    {r.label}
                  </span>
                  <span className="font-semibold text-[#1E4D2B]">
                    {r.count} of {r.cohort}
                    <span className="text-gray-500 font-normal text-xs"> · {Math.round(pct)}%</span>
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1E4D2B] to-[#2d6b3f] motion-reduce:transition-none transition-[width] duration-500"
                    style={{ width: `${Math.max(2, pct)}%` }}
                    aria-hidden
                  />
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="font-mono text-sm text-gray-500 py-2">
          Waiting for the first entry.
        </p>
      )}

      {waiting.length > 0 && racing.length > 0 && (
        <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between gap-2 text-xs text-gray-500">
          <span>
            {waiting.map((w, i) => (
              <span key={w.key}>
                {i > 0 ? ', ' : ''}
                <span aria-hidden>{w.emoji}</span> {w.label.replace(' Guild', '')}
              </span>
            ))}
            {waiting.length === 1 ? ' guild' : ' guilds'}
          </span>
          <span className="font-mono">Waiting for a first entry</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Winner is decided by who actually <strong>presents</strong> on
        Research Day and is revealed at the awards ceremony. No-shows don&apos;t count!
      </p>
    </section>
  )
}
