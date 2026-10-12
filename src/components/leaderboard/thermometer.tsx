type Props = {
  count: number
  goal: number
  marker2025: number
  marker2026: number
}

/**
 * Horizontal submission thermometer. The committee doc requires:
 *   - Numbers shown as text, not just color (mobile a11y)
 *   - Markers at the two historical totals + the goal
 *   - A milestone message that upgrades as the count crosses each threshold
 *
 * Pure presentational — the parent passes in the current count and config.
 */
export default function Thermometer({ count, goal, marker2025, marker2026 }: Props) {
  const pct = Math.min(100, (count / goal) * 100)
  const message = milestoneMessage(count, marker2025, marker2026, goal)

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="text-base font-semibold text-gray-900">
          🌡️ Submission thermometer
        </h2>
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-[#1E4D2B]">{count}</span>
          <span className="text-gray-500"> / {goal} abstracts</span>
        </p>
      </div>

      {/* Bar + marker overlay. Markers are absolutely positioned at their %. */}
      <div className="relative h-6 rounded-full bg-gray-100 border border-gray-200 overflow-visible">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#1E4D2B] to-[#2d6b3f] motion-reduce:transition-none transition-[width] duration-500"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
        <Marker label="2025" value={marker2025} goal={goal} />
        <Marker label="2026 record" value={marker2026} goal={goal} />
        <Marker label="Goal" value={goal} goal={goal} highlight />
      </div>

      {/* Keep enough bottom padding so the Marker's dangling label doesn't
          overlap the message below. */}
      <div className="pt-5">
        <p className="text-sm text-gray-700">{message}</p>
      </div>
    </section>
  )
}

function Marker({
  label,
  value,
  goal,
  highlight = false,
}: {
  label: string
  value: number
  goal: number
  highlight?: boolean
}) {
  const pct = Math.min(100, (value / goal) * 100)
  return (
    <div
      className="absolute -top-1 h-8 flex flex-col items-center pointer-events-none"
      style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
    >
      <div
        className={`w-0.5 h-8 ${
          highlight ? 'bg-[#1E4D2B]' : 'bg-gray-400'
        }`}
        aria-hidden
      />
      <span
        className={`text-[10px] mt-0.5 whitespace-nowrap ${
          highlight ? 'font-semibold text-[#1E4D2B]' : 'text-gray-500'
        }`}
      >
        {label} ({value})
      </span>
    </div>
  )
}

function milestoneMessage(
  count: number,
  marker2025: number,
  marker2026: number,
  goal: number
): string {
  if (count >= goal)
    return 'GOAL SMASHED! 🎉 [surprise unlocked: Upgraded Snack Stations at Event]'
  if (count >= marker2026 + 1) return 'NEW RECORD TERRITORY! 🚀'
  if (count >= marker2025) return "We've matched 2025! 📈"
  if (count >= 100) return 'Triple digits! 💯'
  if (count === 0) return 'The first abstract will light this up.'
  return `${goal - count} to go.`
}
