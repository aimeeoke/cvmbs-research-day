import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { getLeaderboardConfig } from '@/lib/leaderboard/config'
import LeaderboardConfigForm from './config-form'

export const metadata = { title: 'Leaderboard config · Admin' }

export default async function AdminLeaderboardPage() {
  const config = await getLeaderboardConfig()

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-[#1E4D2B] hover:underline">
          ← Admin
        </Link>
        <h1 className="text-3xl font-bold text-[#1E4D2B] flex items-center gap-2 mt-1">
          <TrendingUp size={28} />
          Leaderboard config
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Phase milestones, thermometer values, Green Pipette scoring,
          and feature flags for the <Link href="/leaderboard" className="underline">/leaderboard</Link> page.
        </p>
      </div>

      <LeaderboardConfigForm
        initial={{
          thermometer_goal: config.thermometer_goal,
          thermometer_marker_2025: config.thermometer_marker_2025,
          thermometer_marker_2026: config.thermometer_marker_2026,
          race_starts_at: config.race_starts_at,
          event_starts_at: config.event_starts_at,
          awards_dark_at: config.awards_dark_at,
          champions_published_at: config.champions_published_at,
          ambassador_cap: config.ambassador_cap,
          split_mode: config.split_mode,
          show_thermometer: config.show_thermometer,
          show_guild_showdown: config.show_guild_showdown,
          show_green_pipette: config.show_green_pipette,
        }}
      />
    </div>
  )
}
