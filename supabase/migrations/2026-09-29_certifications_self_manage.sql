-- Certifications: uploader can manage their own unverified cert (Sep 29, 2026)
--
-- Addendum to 2026-09-29_certifications_table.sql. The initial RLS locked
-- UPDATE/DELETE to admin only, which meant a user who uploaded the wrong
-- PDF had to ping admin to swap it. That's a lot of ceremony for a common
-- self-service action.
--
-- New policies below let the uploader edit or remove their OWN row as long
-- as it's still pending review (verified_at IS NULL). Once admin verifies
-- the cert, the row becomes admin-owned and self-management is off again.
-- This preserves the verification trail: users can't quietly change a cert
-- that admin has already vetted.

DROP POLICY IF EXISTS "certifications_self_update_unverified" ON certifications;
DROP POLICY IF EXISTS "certifications_self_delete_unverified" ON certifications;

CREATE POLICY "certifications_self_update_unverified"
  ON certifications FOR UPDATE
  USING (uploaded_by = auth.uid() AND verified_at IS NULL)
  WITH CHECK (uploaded_by = auth.uid() AND verified_at IS NULL);

CREATE POLICY "certifications_self_delete_unverified"
  ON certifications FOR DELETE
  USING (uploaded_by = auth.uid() AND verified_at IS NULL);
