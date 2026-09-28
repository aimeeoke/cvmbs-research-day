-- 2026-09-28: Draft self-delete + admin-approved withdrawal request
--
-- 1) Adds `submissions.withdrawal_requested_at` — when a submitted or finalized
--    abstract's owner asks for withdrawal. Admin then flips `status='withdrawn'`
--    (via existing admin update policy) to make it official.
-- 2) Adds delete policies: submitter can delete their own DRAFT (nothing has
--    been submitted yet); admin can delete anything.

BEGIN;

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS withdrawal_requested_at TIMESTAMPTZ;

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS withdrawal_requested_reason TEXT;

DROP POLICY IF EXISTS "submissions_owner_delete_draft" ON submissions;
CREATE POLICY "submissions_owner_delete_draft" ON submissions FOR DELETE
  USING (
    submitter_id = auth.uid()
    AND status = 'draft'
  );

DROP POLICY IF EXISTS "submissions_admin_delete" ON submissions;
CREATE POLICY "submissions_admin_delete" ON submissions FOR DELETE
  USING (current_user_is_admin());

COMMIT;
