-- Research Day 2027 Leaderboard foundation (F4): capture how many previous
-- Research Days the presenter has attended, so we can tier the First-Timer /
-- Veteran badges proposed by the committee.
--
-- Semantics: 0 = First-Timer, 1-3 = exact count, 4 = "4 or more".
-- NULL means "unknown" (pre-migration drafts). Existing boolean
-- previously_presented column stays — on save, the server derives it from the
-- count so the oral-session prioritization logic that reads it keeps working.

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS presenter_previous_rd_count INTEGER
  CHECK (presenter_previous_rd_count IS NULL
         OR (presenter_previous_rd_count >= 0 AND presenter_previous_rd_count <= 4));

COMMENT ON COLUMN submissions.presenter_previous_rd_count IS
  '0 = First-Timer, 1-3 = exact count, 4 = four or more. NULL = unknown (legacy drafts).';
