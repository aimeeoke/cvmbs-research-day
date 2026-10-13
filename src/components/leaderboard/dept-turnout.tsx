import type { DeptTurnoutResult } from '@/lib/leaderboard/dept-turnout'

type Props = {
  result: DeptTurnoutResult
}

/**
 * Four ranked bars (one per CVMBS dept) sized by weighted presenter count.
 * Shares are the same Part 3.1 split used by Green Pipette: each abstract
 * contributes 1.0 total presenter weight, distributed across departments
 * by mentor dept (or presenter dept, when the only mentors are external).
 *
 * Counts show one decimal because F2 can produce fractional shares
 * (e.g. 0.5 MIP + 0.5 BMS). Rounding to integers would make close ties
 * look identical when they're not.
 */
export default function DeptTurnout({ result }: Props) {
  const rows = [...result.rows].sort((a, b) => b.presenters - a.presenters)
  const max = Math.max(1, ...rows.map((r) => r.presenters))
  const anyPresenters = rows.some((r) => r.presenters > 0)

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          🏛️ Department Turnout
        </h2>
        <p className="font-mono text-xs text-gray-600 mt-0.5">
          Which department is bringing the biggest crew?{' '}
          {result.mode === 'drafts'
            ? 'Counts drafts, submitted, and finalized abstracts.'
            : 'Finalized abstracts only.'}
        </p>
      </div>

      {anyPresenters ? (
        <ol className="space-y-2">
          {rows.map((r, idx) => {
            const pct = Math.max(2, (r.presenters / max) * 100)
            return (
              <li key={r.departmentId} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-gray-800">
                    <span className="mr-1 inline-block w-5 text-right text-gray-500 text-xs font-mono">
                      {idx + 1}.
                    </span>
                    <span className="font-medium">{r.shortName ?? r.name}</span>
                  </span>
                  <span className="font-semibold text-[#1E4D2B]">
                    {r.presenters.toFixed(1)}
                    <span className="text-gray-500 font-normal text-xs">
                      {' '}
                      presenters
                    </span>
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1E4D2B] to-[#2a6b3d] motion-reduce:transition-none transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="font-mono text-xs text-gray-500 italic">
          Waiting for the first creditable abstract.
        </p>
      )}

      {result.needsReviewCount > 0 && (
        <p className="font-mono text-[11px] text-gray-500">
          {result.needsReviewCount} abstract{result.needsReviewCount === 1 ? '' : 's'}{' '}
          couldn&apos;t be credited to a CVMBS department (external mentors + non-CVMBS presenter).
        </p>
      )}
    </section>
  )
}
