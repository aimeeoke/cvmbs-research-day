-- Widen self-delete on submissions (Sep 29, 2026)
--
-- The original 2026-09-28_withdrawal_and_delete migration only allowed the
-- submitter to delete their OWN draft. Anything past draft required a
-- withdrawal request that admin had to approve.
--
-- Product decision: pre-finalize, submitters own their submission. They can
-- delete it themselves whether it's a draft or already-submitted. The
-- withdrawal flow (admin-approved, requires a reason) is only needed after
-- Finalize + Lock, because after that the abstract is in the printed program
-- and yanking it has downstream implications (session planning, judge
-- assignments, etc).
--
-- New shape:
--   * submitter can DELETE their own row while status IN ('draft','submitted')
--   * finalized/withdrawn stay admin-only for DELETE
--   * withdrawal_requested_at is now only meaningful for finalized rows

DROP POLICY IF EXISTS "submissions_owner_delete_draft" ON submissions;
DROP POLICY IF EXISTS "submissions_owner_delete_prefinalized" ON submissions;

CREATE POLICY "submissions_owner_delete_prefinalized" ON submissions FOR DELETE
  USING (
    submitter_id = auth.uid()
    AND status IN ('draft', 'submitted')
  );
