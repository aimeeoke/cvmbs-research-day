import Link from 'next/link'
import { Clock, TrendingUp } from 'lucide-react'

export const metadata = { title: 'Leaderboard · CVMBS Research Day' }

/**
 * Placeholder page for the eventual live leaderboard (Golden Pipette
 * scores during the event + Green Pipette standings starting Nov 18).
 *
 * The full feature is being designed by the committee — see
 * "Where we are on the Green Labs epic" in CLAUDE.md for context. This
 * page exists so the About page's leaderboard callout has somewhere to
 * link to.
 */
export default function LeaderboardPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-11 w-11 rounded-full bg-[#1E4D2B]/10 text-[#1E4D2B]">
          <TrendingUp size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1E4D2B]">Leaderboard</h1>
          <p className="text-sm text-gray-600">CVMBS Research Day 2027</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-10 text-center space-y-4">
        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-amber-100 text-amber-700">
          <Clock size={28} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Coming soon</h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          The Golden Pipette standings will update live during Research Day.
          The Green Pipette race starts <strong>November 18, 2026</strong> —
          every co-author who completes the My Green Lab Ambassador training
          earns points for their department.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Link
            href="/green-labs"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22]"
          >
            See the Green Labs list
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-50"
          >
            About the awards
          </Link>
        </div>
      </div>
    </div>
  )
}
