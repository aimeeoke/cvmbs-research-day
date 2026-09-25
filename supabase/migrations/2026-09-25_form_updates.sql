-- 2026-09-25: Submit form and judge form updates
--
-- 1) Add `submissions.program` — free-text program name for presenters who
--    aren't in a CVMBS department (undergrads, cross-college programs, etc.).
-- 2) Widen `session_preference` CHECK to include the undergrad poster session.
--
-- The judge form's structured role list is stored in the existing
-- `judge_registrations.detailed_role` (already free TEXT); no schema change.
-- The author-name label change on the submit form is UI-only; the underlying
-- `submission_authors.display_name` column is unchanged.

BEGIN;

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS program TEXT;

ALTER TABLE submissions
  DROP CONSTRAINT IF EXISTS submissions_session_preference_check;

ALTER TABLE submissions
  ADD CONSTRAINT submissions_session_preference_check
  CHECK (
    session_preference IN (
      'Undergraduate poster',
      'Early',
      'Late',
      'No preference'
    )
  );

COMMIT;
