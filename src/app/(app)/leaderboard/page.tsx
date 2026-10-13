import { TrendingUp } from 'lucide-react'
import {
  computePhase,
  getLeaderboardConfig,
  phaseSubheading,
} from '@/lib/leaderboard/config'
import { getGuildCounts, getThermometerCount } from '@/lib/leaderboard/queries'
import { getGreenPipette } from '@/lib/leaderboard/green-pipette'
import { getPlatinumMentoring } from '@/lib/leaderboard/platinum'
import { getPlayerCardData } from '@/lib/leaderboard/player'
import AutoRefresh from '@/components/leaderboard/auto-refresh'
import Thermometer from '@/components/leaderboard/thermometer'
import GuildShowdown from '@/components/leaderboard/guild-showdown'
import GreenPipette from '@/components/leaderboard/green-pipette'
import PlatinumMentoring from '@/components/leaderboard/platinum-mentoring'
import PlayerCard from '@/components/leaderboard/player-card'
import HowToEarn from '@/components/leaderboard/how-to-earn'

// Re-render data on every request. The AutoRefresh client component triggers
// a router.refresh() every 60 seconds so counts stay fresh without the
// visitor reloading.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Leaderboard · CVMBS Research Day' }

export default async function LeaderboardPage() {
  const now = new Date()
  const [config, thermometer, guilds, greenPipette, platinum, player] = await Promise.all([
    getLeaderboardConfig(),
    getThermometerCount(now),
    getGuildCounts(now),
    getGreenPipette(),
    getPlatinumMentoring(now),
    getPlayerCardData(),
  ])
  const phase = computePhase(config, now)
  const sub = phaseSubheading(phase)

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Hero */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-11 w-11 rounded-full bg-[#1E4D2B]/10 text-[#1E4D2B]">
            <TrendingUp size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1E4D2B]">The Leaderboard</h1>
            <p
              className="font-mono text-sm text-gray-700 mt-0.5"
              title={sub.hoverTitle}
            >
              {sub.text}
            </p>
          </div>
        </div>
        <AutoRefresh renderedAt={now.toISOString()} />
      </div>

      {/* Competition cards. Each card is self-contained so adding one
          doesn't disturb the others. */}
      <div className="space-y-4">
        {player && <PlayerCard data={player} />}

        {config.show_thermometer && (
          <Thermometer
            count={thermometer.count}
            goal={config.thermometer_goal}
            marker2025={config.thermometer_marker_2025}
            marker2026={config.thermometer_marker_2026}
          />
        )}

        {config.show_guild_showdown && (
          <GuildShowdown
            counts={guilds.counts}
            cohorts={{
              undergrad: config.guild_cohort_undergrad,
              grad: config.guild_cohort_grad,
              dvm: config.guild_cohort_dvm,
              postdoc_resident_intern: config.guild_cohort_postdoc_resident_intern,
              staff: config.guild_cohort_staff,
            }}
          />
        )}

        {config.show_green_pipette && <GreenPipette result={greenPipette} />}

        {config.show_platinum_mentoring && <PlatinumMentoring result={platinum} />}

        <HowToEarn />
      </div>
    </div>
  )
}
