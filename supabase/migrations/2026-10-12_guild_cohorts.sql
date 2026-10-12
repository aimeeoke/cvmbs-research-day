-- Guild Showdown fairness fix: score each guild as a percentage of its 2026
-- cohort instead of raw abstract counts. Otherwise small guilds (Research
-- Staff with 4 potential presenters) can never beat large guilds (DVM with
-- 59). Per the Oct 12 brainstorm doc + Aimee's confirmed numbers.
--
-- Cohort totals are editable from /admin/leaderboard — committee may want to
-- revise them as 2027 rosters firm up.

ALTER TABLE leaderboard_config
  ADD COLUMN IF NOT EXISTS guild_cohort_undergrad                INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS guild_cohort_grad                     INTEGER NOT NULL DEFAULT 85,
  ADD COLUMN IF NOT EXISTS guild_cohort_dvm                      INTEGER NOT NULL DEFAULT 59,
  ADD COLUMN IF NOT EXISTS guild_cohort_postdoc_resident_intern  INTEGER NOT NULL DEFAULT 19,
  ADD COLUMN IF NOT EXISTS guild_cohort_staff                    INTEGER NOT NULL DEFAULT 4;

COMMENT ON COLUMN leaderboard_config.guild_cohort_undergrad IS
  '2026 cohort size: 45 undergrads + 5 post-baccs = 50.';
COMMENT ON COLUMN leaderboard_config.guild_cohort_grad IS
  '2026 cohort size: 31 MS/MPH + 51 PhD + 3 MD = 85.';
COMMENT ON COLUMN leaderboard_config.guild_cohort_dvm IS
  '2026 cohort size: 59 DVM trainees including dual-degree.';
COMMENT ON COLUMN leaderboard_config.guild_cohort_postdoc_resident_intern IS
  '2026 cohort size: 7 postdocs + 12 residents + 0 interns = 19.';
COMMENT ON COLUMN leaderboard_config.guild_cohort_staff IS
  '2026 cohort size: 4 research staff.';
