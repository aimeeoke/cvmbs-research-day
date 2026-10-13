import {
  PLATINUM_TIER_META,
  type PlatinumResult,
  type PlatinumTier,
} from '@/lib/leaderboard/platinum'

type Props = {
  result: PlatinumResult
}

/**
 * Platinum Mentoring Top 10 — ranks CVMBS faculty by distinct abstracts
 * they mentor on. Loot-box tier chips (Bronze/Silver/Platinum) decorate
 * the earners. The Celestial Box tier at 10+ is intentionally not listed
 * in the explainer; the emoji just appears when someone unlocks it, so
 * it reads as a surprise reveal rather than a documented goal.
 *
 * Tie-breaker: alphabetical by name. See src/lib/leaderboard/platinum.ts
 * for the sort rationale (determinism across page loads).
 */
export default function PlatinumMentoring({ result }: Props) {
  const rows = result.rows
  const celestialRevealed = result.topTierOnBoard === 'celestial'

  // Rank labels: 1, 2, T-3, T-3, 5. Same pattern as Guild Showdown.
  const ranks: string[] = []
  for (let i = 0; i < rows.length; i++) {
    const same = rows.filter((x) => x.menteeCount === rows[i].menteeCount)
    const firstIdx = rows.findIndex((x) => x.menteeCount === rows[i].menteeCount)
    const rank = firstIdx + 1
    ranks.push(same.length > 1 ? `T-${rank}` : `${rank}`)
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          💎 Platinum Mentoring Top 10
        </h2>
        <p className="font-mono text-xs text-gray-600 mt-0.5">
          Faculty mentors ranked by number of mentees presenting. Platinum
          beats Gold. 😉
        </p>
      </div>

      {rows.length > 0 ? (
        <ol className="space-y-1">
          {rows.map((r, idx) => (
            <li
              key={r.facultyId}
              className="flex items-baseline justify-between gap-2 text-sm py-1"
            >
              <span className="text-gray-800 min-w-0">
                <span className="mr-1 inline-block w-7 text-right font-mono text-gray-500 text-xs">
                  {ranks[idx]}·
                </span>
                <span className="font-medium">{r.name}</span>
                {r.deptShort && (
                  <span className="font-mono text-xs text-gray-500 ml-1.5">
                    ({r.deptShort})
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                {r.tier !== 'none' && <TierChip tier={r.tier} />}
                <span className="font-semibold text-[#1E4D2B]">
                  {r.menteeCount}
                  <span className="text-gray-500 font-normal text-xs">
                    {' '}
                    mentee{r.menteeCount === 1 ? '' : 's'}
                  </span>
                </span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="font-mono text-xs text-gray-500 italic">
          Waiting for the first faculty mentor to hit Bronze (3 mentees).
        </p>
      )}

      {/* Tier legend — hide Celestial until someone surfaces it on the board. */}
      <div className="pt-1 flex items-center gap-3 flex-wrap text-xs text-gray-600 font-mono">
        <span className="text-gray-500">Tiers:</span>
        <TierLegendItem tier="bronze" />
        <TierLegendItem tier="silver" />
        <TierLegendItem tier="platinum" />
        {celestialRevealed && <TierLegendItem tier="celestial" />}
      </div>
    </section>
  )
}

function TierChip({ tier }: { tier: Exclude<PlatinumTier, 'none'> }) {
  const meta = PLATINUM_TIER_META[tier]
  const tone = tierTone(tier)
  return (
    <span
      title={`${meta.label} (${meta.threshold}+ mentees)`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[11px] font-semibold ${tone}`}
    >
      <span aria-hidden>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  )
}

function TierLegendItem({ tier }: { tier: Exclude<PlatinumTier, 'none'> }) {
  const meta = PLATINUM_TIER_META[tier]
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden>{meta.emoji}</span>
      <span>
        {meta.label} ({meta.threshold}+)
      </span>
    </span>
  )
}

function tierTone(tier: Exclude<PlatinumTier, 'none'>): string {
  switch (tier) {
    case 'bronze':
      return 'bg-amber-50 border-amber-300 text-amber-900'
    case 'silver':
      return 'bg-gray-100 border-gray-300 text-gray-800'
    case 'platinum':
      return 'bg-indigo-50 border-indigo-300 text-indigo-900'
    case 'celestial':
      return 'bg-purple-50 border-purple-300 text-purple-900'
  }
}
