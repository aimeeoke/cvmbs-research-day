-- Dept Turnout feature flag. Default TRUE so the card appears as soon as
-- the first abstract credits a department. Flip to FALSE from
-- /admin/leaderboard if comms wants it hidden.

ALTER TABLE leaderboard_config
  ADD COLUMN IF NOT EXISTS show_dept_turnout BOOLEAN NOT NULL DEFAULT TRUE;
