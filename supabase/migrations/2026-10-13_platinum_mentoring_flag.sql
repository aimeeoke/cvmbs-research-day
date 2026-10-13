-- Platinum Mentoring feature flag. Default TRUE so the card is visible as
-- soon as the first faculty mentor crosses the Bronze (3-mentee) threshold.
-- Flip to FALSE from /admin/leaderboard if comms wants it hidden until
-- Nov 18.

ALTER TABLE leaderboard_config
  ADD COLUMN IF NOT EXISTS show_platinum_mentoring BOOLEAN NOT NULL DEFAULT TRUE;
