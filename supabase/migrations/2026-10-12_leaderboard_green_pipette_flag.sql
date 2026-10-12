-- Green Pipette feature flag. Default TRUE so the card appears alongside
-- the thermometer and Guild Showdown even before Nov 18 — the card will
-- show zeros until enough certified ambassadors are linked to abstracts.
-- Flip to FALSE from /admin/leaderboard if comms wants it hidden until
-- Nov 18.

ALTER TABLE leaderboard_config
  ADD COLUMN IF NOT EXISTS show_green_pipette BOOLEAN NOT NULL DEFAULT TRUE;
