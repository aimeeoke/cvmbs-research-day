import Link from 'next/link'
import type { GreenPipetteResult } from '@/lib/leaderboard/green-pipette'

type Props = {
  result: GreenPipetteResult
}

/**
 * Four ranked bars (one per CVMBS dept) sized by Green Pipette points.
 * Point totals and a "+N ambassadors this week" line echo the committee
 * doc. Numbers appear as text so the bars aren't the only cue.
 */
export default function GreenPipette({ result }: Props) {
  const rows = [...result.rows].sort((a, b) => b.points - a.points)
  const max = Math.max(1, ...rows.map((r) => r.points))

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            🌱 Green Pipette
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Every certified Ambassador adds 10 points to their department
            {result.cap ? ` · capped at ${result.cap} per abstract` : ''}.
          </p>
        </div>
        {result.newThisWeek > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-900">
            +{result.newThisWeek} this week
          </span>
        )}
      </div>

      <ol className="space-y-2">
        {rows.map((r, idx) => {
          const pct = Math.max(2, (r.points / max) * 100)
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
                  {r.points}
                  <span className="text-gray-500 font-normal text-xs"> pts · {r.projectCount} abstract{r.projectCount === 1 ? '' : 's'}</span>
                </span>
              </div>
              <div className="h-3 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-500 motion-reduce:transition-none transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              </div>
            </li>
          )
        })}
      </ol>

      <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
        <Link
          href="https://mygreenlab.org/programs/ambassador-program/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-900"
        >
          Become an Ambassador →
        </Link>
        <Link
          href="/green-labs"
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          See the certified list
        </Link>
      </div>

      {result.needsReviewCount > 0 && (
        <p className="text-xs text-gray-500">
          {result.needsReviewCount} abstract{result.needsReviewCount === 1 ? '' : 's'} contributed to no department (no CVMBS mentor + no CVMBS presenter dept).
        </p>
      )}
    </section>
  )
}
