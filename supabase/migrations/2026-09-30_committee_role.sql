-- Add committee_member role (Sep 30, 2026)
--
-- Committee members have functional access to the admin console for
-- reviewing abstracts, canonicalizing author names, and verifying
-- Green Labs certifications. They do NOT get access to role requests
-- or withdrawal approvals — those remain admin-only.
--
-- Shape:
--   * user_roles.role CHECK widens to include 'committee_member'
--   * role_requests.requested_role CHECK widens the same way
--   * New helper current_user_has_admin_access() = admin OR committee_member
--   * RLS bypasses for submissions + certifications swap in the new helper
--   * role_requests policies keep current_user_is_admin() — admin-only

BEGIN;

-- ============================================
-- Widen CHECK constraints
-- ============================================
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_role_check CHECK (
    role IN ('submitter','mentor','judge','admin','volunteer','committee_member')
  );

ALTER TABLE role_requests DROP CONSTRAINT IF EXISTS role_requests_requested_role_check;
ALTER TABLE role_requests
  ADD CONSTRAINT role_requests_requested_role_check CHECK (
    requested_role IN ('submitter','mentor','judge','admin','volunteer','committee_member')
  );


-- ============================================
-- New helper: admin OR committee_member
-- ============================================
-- Naming: keep `current_user_is_admin()` semantically pure (strictly admin)
-- so any policy that needs true admin can still ask for it. Anything that
-- should also accept committee members uses the new helper.
CREATE OR REPLACE FUNCTION current_user_has_admin_access()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'committee_member')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ============================================
-- Submissions: swap admin-only bypass for admin-or-committee
-- ============================================
CREATE OR REPLACE FUNCTION current_user_can_access_submission(sub_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    current_user_has_admin_access()
    OR EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = sub_id AND s.submitter_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM submission_authors sa
      WHERE sa.submission_id = sub_id AND sa.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM submission_authors sa
      WHERE sa.submission_id = sub_id
        AND sa.email IS NOT NULL
        AND LOWER(sa.email) = (SELECT LOWER(email) FROM profiles WHERE id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM submission_authors sa
      JOIN faculty f ON sa.faculty_id = f.id
      WHERE sa.submission_id = sub_id AND f.profile_id = auth.uid()
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

DROP POLICY IF EXISTS "submissions_access_update" ON submissions;
CREATE POLICY "submissions_access_update" ON submissions FOR UPDATE
  USING (
    current_user_can_access_submission(id)
    AND (status IN ('draft','submitted') OR current_user_has_admin_access())
  )
  WITH CHECK (
    current_user_can_access_submission(id)
    AND (status IN ('draft','submitted','finalized','withdrawn'))
  );

DROP POLICY IF EXISTS "submission_authors_access_all" ON submission_authors;
CREATE POLICY "submission_authors_access_all" ON submission_authors FOR ALL
  USING (
    current_user_can_access_submission(submission_id)
    AND (
      current_user_has_admin_access()
      OR EXISTS (
        SELECT 1 FROM submissions s
        WHERE s.id = submission_id AND s.status IN ('draft','submitted')
      )
    )
  )
  WITH CHECK (
    current_user_can_access_submission(submission_id)
    AND (
      current_user_has_admin_access()
      OR EXISTS (
        SELECT 1 FROM submissions s
        WHERE s.id = submission_id AND s.status IN ('draft','submitted')
      )
    )
  );


-- ============================================
-- Certifications: verify/edit accessible to committee too
-- ============================================
DROP POLICY IF EXISTS "certifications_admin_write" ON certifications;
CREATE POLICY "certifications_admin_write"
  ON certifications FOR ALL
  USING (current_user_has_admin_access())
  WITH CHECK (current_user_has_admin_access());


-- ============================================
-- Deliberately unchanged (admin only):
-- ============================================
-- role_requests_admin_update, role_requests_admin_delete → current_user_is_admin()
-- user_roles_admin_write                                 → current_user_is_admin()
-- departments/faculty/events admin_write                 → current_user_is_admin()

COMMIT;
