type Props = {
  count: number
  goal: number
  marker2025: number
  marker2026: number
}

/**
 * Five-level progress ladder from the Oct 12 brainstorm. Replaces the
 * earlier single 0/250 bar, which looked like failure during the first
 * weeks when counts are small.
 *
 * Levels are computed from the config markers:
 *   L1: 0 → 49
 *   L2: 50 → 99
 *   L3: 100 → (marker2025 - 1)
 *   L4: marker2025 → marker2026       — "Beat 2025"
 *   L5: (marker2026 + 1) → goal       — "Record → {goal}"
 *
 * Only the current level's segment fills partially. Earlier segments show
 * as full, later segments as empty. Numbers appear as text per the a11y
 * rule in Part 3.2.
 */
export default function Thermometer({ count, goal, marker2025, marker2026 }: Props) {
  // L1..L3 use fixed 50/100 boundaries; L4/L5 pull from markers so the
  // "Beat 2025" and "Record" semantics follow config.
  const levels: Array<{
    label: string
    sublabel: string
    start: number
    end: number
  }> = [
    { label: 'Level 1', sublabel: '0 – 49',                  start: 0,                 end: 49 },
    { label: 'Level 2', sublabel: '50 – 99',                 start: 50,                end: 99 },
    { label: 'Level 3', sublabel: `100 – ${marker2025 - 1}`, start: 100,               end: marker2025 - 1 },
    { label: 'Beat 2025', sublabel: `${marker2025} – ${marker2026}`, start: marker2025, end: marker2026 },
    { label: `Record → ${goal}`, sublabel: `${marker2026 + 1} – ${goal}`, start: marker2026 + 1, end: goal },
  ]

  const currentIdx = levels.findIndex((l) => count >= l.start && count <= l.end)
  // If we're past the goal, show the last level as full.
  const activeIdx = currentIdx === -1 && count > goal ? levels.length - 1 : currentIdx
  const currentLevel = activeIdx >= 0 ? levels[activeIdx] : null
  const nextLevel = activeIdx >= 0 ? levels[activeIdx + 1] ?? null : levels[0] ?? null

  const sub = buildSubline(count, currentLevel, nextLevel, goal)

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="text-base font-semibold text-gray-900">
          🌡️ Level {Math.max(1, activeIdx + 1)} of 5
          <span className="ml-2 text-sm font-normal text-gray-500">
            · {count} abstracts
          </span>
        </h2>
      </div>

      {/* Five side-by-side segments. Current fills proportionally; earlier
          are full; later are empty. */}
      <div className="grid grid-cols-5 gap-1.5">
        {levels.map((l, i) => {
          const fill =
            i < activeIdx
              ? 100
              : i === activeIdx
                ? Math.min(100, ((count - l.start) / Math.max(1, l.end - l.start + 1)) * 100)
                : 0
          return (
            <div key={l.label} className="space-y-1">
              <div
                className={`h-3 rounded-full border overflow-hidden ${
                  i <= activeIdx
                    ? 'bg-gray-100 border-gray-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1E4D2B] to-[#2d6b3f] motion-reduce:transition-none transition-[width] duration-500"
                  style={{ width: `${fill}%` }}
                  aria-hidden
                />
              </div>
              <p className="font-mono text-[10px] text-gray-500 text-center leading-tight">
                {l.sublabel}
              </p>
            </div>
          )
        })}
      </div>

      <p className="font-mono text-sm text-gray-700">{sub}</p>
    </section>
  )
}

function buildSubline(
  count: number,
  current: { label: string; end: number } | null,
  next: { label: string; start: number } | null,
  goal: number
): string {
  if (count >= goal)
    return 'GOAL SMASHED! 🎉 Snack upgrade unlocked.'
  if (current && next) {
    const remaining = next.start - count
    return `${remaining} more to reach ${next.label}. Next unlock: a hint about the snack upgrade.`
  }
  if (count === 0) return 'The first abstract will light this up.'
  return `${goal - count} more to the goal.`
}
