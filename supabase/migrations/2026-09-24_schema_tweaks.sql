-- Migration: schema tweaks for multi-draft submissions, judge registrations,
-- role requests, and expanded submission access (mentor / presenter / proxy).
--
-- Safe to run on the existing V2 DB (no data yet).

-- ============================================
-- 1. SUBMISSIONS: drop unique-per-submitter
-- ============================================
-- A proxy submitter (lab manager) may submit multiple abstracts for different
-- presenters. The "one presentation per person" rule is enforced at submit-time
-- by presenter email, not by DB constraint.
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_event_id_submitter_id_key;


-- ============================================
-- 2. SUBMISSION_AUTHORS: capture email
-- ============================================
-- Presenter email is the primary identity for the "one submission per presenter"
-- rule. Optional for co-authors.
ALTER TABLE submission_authors ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_submission_authors_email ON submission_authors(LOWER(email));


-- ============================================
-- 3. ACCESS HELPER FUNCTION
-- ============================================
-- Central rule for who can read / edit a submission:
--   - Admin
--   - Submitter (proxy submitter case)
--   - Author whose profile_id matches (linked account)
--   - Author whose email matches the signed-in user's email
--   - Faculty mentor: their linked faculty record is on the author list
CREATE OR REPLACE FUNCTION current_user_can_access_submission(sub_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    current_user_is_admin()
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


-- ============================================
-- 4. RLS: replace submission policies
-- ============================================
DROP POLICY IF EXISTS "submissions_owner_read"    ON submissions;
DROP POLICY IF EXISTS "submissions_admin_read"    ON submissions;
DROP POLICY IF EXISTS "submissions_owner_insert"  ON submissions;
DROP POLICY IF EXISTS "submissions_owner_update"  ON submissions;
DROP POLICY IF EXISTS "submissions_admin_update"  ON submissions;

CREATE POLICY "submissions_access_read"   ON submissions FOR SELECT
  USING (current_user_can_access_submission(id));

CREATE POLICY "submissions_owner_insert"  ON submissions FOR INSERT
  WITH CHECK (submitter_id = auth.uid() OR current_user_is_admin());

CREATE POLICY "submissions_access_update" ON submissions FOR UPDATE
  USING (
    current_user_can_access_submission(id)
    AND (status IN ('draft','submitted') OR current_user_is_admin())
  )
  WITH CHECK (
    current_user_can_access_submission(id)
    AND (status IN ('draft','submitted','finalized','withdrawn'))
  );

-- Replace submission_authors policies
DROP POLICY IF EXISTS "submission_authors_owner_all" ON submission_authors;
DROP POLICY IF EXISTS "submission_authors_admin_all" ON submission_authors;

CREATE POLICY "submission_authors_access_all" ON submission_authors FOR ALL
  USING (
    current_user_can_access_submission(submission_id)
    AND (
      current_user_is_admin()
      OR EXISTS (
        SELECT 1 FROM submissions s
        WHERE s.id = submission_id AND s.status IN ('draft','submitted')
      )
    )
  )
  WITH CHECK (
    current_user_can_access_submission(submission_id)
    AND (
      current_user_is_admin()
      OR EXISTS (
        SELECT 1 FROM submissions s
        WHERE s.id = submission_id AND s.status IN ('draft','submitted')
      )
    )
  );


-- ============================================
-- 5. JUDGE_REGISTRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS judge_registrations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id               UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  first_name             TEXT NOT NULL,
  last_name              TEXT NOT NULL,
  email                  TEXT NOT NULL,

  -- Judging-eligibility bucket that gates format options at sign-up time.
  eligibility            TEXT NOT NULL CHECK (eligibility IN
                           ('faculty','advanced_trainee','early_trainee','undergrad')),
  detailed_role          TEXT,    -- Free text for admin context, e.g. "PhD Student, year 5"

  preferred_time_slots   TEXT[] NOT NULL DEFAULT '{}',
  preferred_formats      TEXT[] NOT NULL DEFAULT '{}',   -- 'oral','poster_regular','poster_undergrad'
  conflicts              TEXT,

  cancelled_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_judge_registrations_event ON judge_registrations(event_id);

DROP TRIGGER IF EXISTS trg_judge_registrations_updated_at ON judge_registrations;
CREATE TRIGGER trg_judge_registrations_updated_at
  BEFORE UPDATE ON judge_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE judge_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "judge_reg_self_read"   ON judge_registrations FOR SELECT
  USING (user_id = auth.uid() OR current_user_is_admin());
CREATE POLICY "judge_reg_self_insert" ON judge_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "judge_reg_self_update" ON judge_registrations FOR UPDATE
  USING (user_id = auth.uid() OR current_user_is_admin())
  WITH CHECK (user_id = auth.uid() OR current_user_is_admin());
CREATE POLICY "judge_reg_admin_delete" ON judge_registrations FOR DELETE
  USING (current_user_is_admin());


-- ============================================
-- 6. ROLE_REQUESTS  (admin queue)
-- ============================================
CREATE TABLE IF NOT EXISTS role_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_role TEXT NOT NULL CHECK (requested_role IN
                   ('submitter','mentor','judge','admin','volunteer')),
  note           TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','granted','denied','resolved')),
  resolved_at    TIMESTAMPTZ,
  resolved_by    UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_requests_status ON role_requests(status);

DROP TRIGGER IF EXISTS trg_role_requests_updated_at ON role_requests;
CREATE TRIGGER trg_role_requests_updated_at
  BEFORE UPDATE ON role_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE role_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_requests_self_read"   ON role_requests FOR SELECT
  USING (user_id = auth.uid() OR current_user_is_admin());
CREATE POLICY "role_requests_self_insert" ON role_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "role_requests_admin_update" ON role_requests FOR UPDATE
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());
CREATE POLICY "role_requests_admin_delete" ON role_requests FOR DELETE
  USING (current_user_is_admin());
