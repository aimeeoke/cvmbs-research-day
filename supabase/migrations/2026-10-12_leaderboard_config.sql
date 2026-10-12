-- Research Day 2027 Leaderboard foundation (F1): single-row config table.
--
-- Holds leaderboard-specific knobs that need to flip without a code deploy:
-- phase milestones, thermometer values, Green Labs scoring parameters, and
-- per-competition feature flags.
--
-- Not duplicated here: the submission-close and finalize deadlines, which
-- already live on `events` (submission_closes_at, finalize_deadline_at).
-- Phase-computation code reads both tables.

BEGIN;

CREATE TABLE leaderboard_config (
  -- Enforce single-row semantics: PK is a const.
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  -- Thermometer (goal + two markers).
  thermometer_goal          INTEGER NOT NULL DEFAULT 250,
  thermometer_marker_2025   INTEGER NOT NULL DEFAULT 163,
  thermometer_marker_2026   INTEGER NOT NULL DEFAULT 217,

  -- Leaderboard-specific milestones. The drafts/finals due dates are
  -- intentionally NOT duplicated here — the `events` row owns those.
  race_starts_at            TIMESTAMPTZ,  -- Nov 18: dept races light up
  event_starts_at           TIMESTAMPTZ,  -- Jan 23 morning: event-day phase
  awards_dark_at            TIMESTAMPTZ,  -- ~30 min before awards: everything hides
  champions_published_at    TIMESTAMPTZ,  -- Jan 24: admin publishes finals

  -- Green Pipette scoring. ambassador_cap is per-abstract (committee: 100).
  -- split_mode controls Part 3.1 department credit — "equal_by_department" is
  -- the committee default; "by_mentor" is kept as an alternative knob.
  ambassador_cap            INTEGER NOT NULL DEFAULT 100,
  split_mode                TEXT NOT NULL DEFAULT 'equal_by_department'
                              CHECK (split_mode IN ('equal_by_department','by_mentor')),

  -- Feature flags per competition. Add new flags here as items ship so the
  -- /leaderboard page can light them up (or hide them if comms wants a delay).
  show_thermometer          BOOLEAN NOT NULL DEFAULT TRUE,
  show_guild_showdown       BOOLEAN NOT NULL DEFAULT TRUE,

  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by                UUID REFERENCES profiles(id)
);

-- Seed the single row with 2027 defaults. Dates are editable from
-- /admin/leaderboard. Times are in America/Denver (MST, UTC-7 in Nov & Jan).
INSERT INTO leaderboard_config (id, race_starts_at, event_starts_at, awards_dark_at)
VALUES (
  1,
  '2026-11-18T00:00:00-07:00',  -- Nov 18, 12:00 AM MST
  '2027-01-23T08:00:00-07:00',  -- Jan 23, 8:00 AM MST (event day begins)
  '2027-01-23T16:30:00-07:00'   -- Jan 23, 4:30 PM MST (awards at 5 PM)
);

CREATE TRIGGER trg_leaderboard_config_updated_at
  BEFORE UPDATE ON leaderboard_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE leaderboard_config ENABLE ROW LEVEL SECURITY;

-- Public read: the /leaderboard page is public and needs to render phase
-- messages before login. No sensitive data lives here.
CREATE POLICY "leaderboard_config_public_read"  ON leaderboard_config
  FOR SELECT USING (TRUE);

-- Write access gated to admins (not committee members — this controls when
-- awards go dark and when thermometer goals change, which are platform-level
-- knobs rather than content review).
CREATE POLICY "leaderboard_config_admin_write"  ON leaderboard_config
  FOR ALL USING (current_user_is_admin()) WITH CHECK (current_user_is_admin());

COMMIT;
