-- CVMBS Research Day Platform - Database Schema (V2, Sep 2026 rewrite)
--
-- Run this ONCE in the Supabase SQL Editor to set up a fresh database.
-- This drops any existing tables in this app, so DO NOT run against a DB with real data.
--
-- Design notes:
-- * Multi-role model: user_roles is a M2M so one profile can be
--   submitter + mentor + judge + admin + volunteer simultaneously.
-- * CSU-only author tracking: submission_authors links to profiles/faculty
--   for CSU folks; non-CSU authors are captured as free-text display_name only.
-- * Green Labs points (display-time computation):
--     - +10 per person who is is_green_labs_ambassador (lifetime status)
--     - +100 per faculty lab that is either my_green_labs OR green_paw certified
-- * Submission workflow: draft -> submitted -> finalized (locked).
--   Owner can edit until finalize_deadline_at on the event.


-- ============================================
-- RESET (safe because no real data yet)
-- ============================================
DROP TABLE IF EXISTS submission_authors CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
-- Legacy tables from V1 schema — dropped in case a partial rebuild happened.
DROP TABLE IF EXISTS submission_status_history CASCADE;
DROP TABLE IF EXISTS judge_registrations CASCADE;
DROP TABLE IF EXISTS judge_assignments CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS withdrawal_requests CASCADE;
DROP TABLE IF EXISTS event_config CASCADE;

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS current_user_has_role(TEXT) CASCADE;
DROP FUNCTION IF EXISTS current_user_is_admin() CASCADE;


-- ============================================
-- DEPARTMENTS  (4 CVMBS departments, seeded below)
-- ============================================
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  short_name  TEXT,
  sort_order  INTEGER DEFAULT 0
);

INSERT INTO departments (name, short_name, sort_order) VALUES
  ('Biomedical Sciences', 'BMS', 1),
  ('Clinical Sciences', 'CS', 2),
  ('Environmental & Radiological Health Sciences', 'ERHS', 3),
  ('Microbiology, Immunology, and Pathology', 'MIP', 4);


-- ============================================
-- PROFILES  (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id                          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                       TEXT UNIQUE NOT NULL,
  full_name                   TEXT,
  department_id               UUID REFERENCES departments(id),
  classification              TEXT,        -- e.g. "PhD Student", "Postdoc", "Faculty"
  phone                       TEXT,

  -- Green Labs (personal, lifetime status = 10 pts)
  is_green_labs_ambassador    BOOLEAN NOT NULL DEFAULT FALSE,

  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- FACULTY  (pre-loaded, pickable in author + mentor fields)
-- ============================================
CREATE TABLE faculty (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name                TEXT NOT NULL,
  email                    TEXT UNIQUE,
  department_id            UUID REFERENCES departments(id),

  -- Green Labs lab certification (either counts as certified, worth 100 pts)
  my_green_labs_certified  BOOLEAN NOT NULL DEFAULT FALSE,
  green_paw_certified      BOOLEAN NOT NULL DEFAULT FALSE,

  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  profile_id               UUID REFERENCES profiles(id), -- linked when faculty logs in
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faculty_active_name ON faculty(is_active, full_name);


-- ============================================
-- USER_ROLES  (multi-role: submitter / mentor / judge / admin / volunteer)
-- ============================================
CREATE TABLE user_roles (
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('submitter','mentor','judge','admin','volunteer')),
  granted_at  TIMESTAMPTZ DEFAULT NOW(),
  granted_by  UUID REFERENCES profiles(id),
  PRIMARY KEY (user_id, role)
);


-- ============================================
-- EVENTS  (one row per year; one active at a time)
-- ============================================
CREATE TABLE events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year                    INTEGER NOT NULL UNIQUE,
  name                    TEXT NOT NULL,
  event_date              DATE,

  submission_opens_at     TIMESTAMPTZ,
  submission_closes_at    TIMESTAMPTZ,   -- last day to START a new submission
  finalize_deadline_at    TIMESTAMPTZ,   -- last day to edit; after this, submissions lock

  is_active               BOOLEAN NOT NULL DEFAULT FALSE,

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Seed 2027 event (edit dates in Supabase after schema runs)
INSERT INTO events (year, name, is_active) VALUES
  (2027, 'CVMBS Research Day 2027', TRUE);


-- ============================================
-- SUBMISSIONS  (draft -> submitted -> finalized)
-- ============================================
CREATE TABLE submissions (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  submitter_id                    UUID NOT NULL REFERENCES profiles(id),

  -- Presenter fields (submitter presents by default)
  classification                  TEXT,
  department_id                   UUID REFERENCES departments(id),

  -- Research content
  title                           TEXT NOT NULL DEFAULT '',
  abstract                        TEXT NOT NULL DEFAULT '',
  research_type                   TEXT,
  research_stage                  TEXT,
  funding                         TEXT,
  affiliations                    TEXT[],

  -- Preferences
  preferred_presentation_type     TEXT CHECK (preferred_presentation_type IN
                                    ('Oral only','Prefer oral','Poster only','No preference')),
  session_preference              TEXT CHECK (session_preference IN
                                    ('Early','Late','No preference')),
  previously_presented            BOOLEAN,
  previous_format                 TEXT CHECK (previous_format IN ('Oral','Poster') OR previous_format IS NULL),

  -- Status
  status                          TEXT NOT NULL DEFAULT 'draft'
                                    CHECK (status IN ('draft','submitted','finalized','withdrawn')),
  submitted_at                    TIMESTAMPTZ,
  finalized_at                    TIMESTAMPTZ,
  withdrawn_at                    TIMESTAMPTZ,
  withdrawn_reason                TEXT,

  admin_notes                     TEXT,

  created_at                      TIMESTAMPTZ DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (event_id, submitter_id)
);

CREATE INDEX idx_submissions_event    ON submissions(event_id);
CREATE INDEX idx_submissions_status   ON submissions(status);


-- ============================================
-- SUBMISSION_AUTHORS  (ordered list; CSU-linked when possible)
-- ============================================
CREATE TABLE submission_authors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  position       INTEGER NOT NULL,        -- 1, 2, 3... byline order

  -- Preferred: link to a CSU profile or faculty record for point attribution
  profile_id     UUID REFERENCES profiles(id),
  faculty_id     UUID REFERENCES faculty(id),

  -- Fallback: free-text display name (used when the CSU person isn't in profiles/faculty yet)
  display_name   TEXT,

  is_presenter   BOOLEAN NOT NULL DEFAULT FALSE,
  is_mentor      BOOLEAN NOT NULL DEFAULT FALSE,

  created_at     TIMESTAMPTZ DEFAULT NOW(),

  -- Must have some way to identify the author
  CHECK (profile_id IS NOT NULL OR faculty_id IS NOT NULL OR display_name IS NOT NULL),

  UNIQUE (submission_id, position)
);

CREATE INDEX idx_submission_authors_submission ON submission_authors(submission_id);


-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================
-- ROLE HELPERS  (used by RLS policies)
-- ============================================
CREATE OR REPLACE FUNCTION current_user_has_role(_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = _role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN AS $$
  SELECT current_user_has_role('admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE departments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty             ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_authors  ENABLE ROW LEVEL SECURITY;

-- Departments & faculty & events: public read (schedule/about pages need this pre-login),
-- admin write.
CREATE POLICY "departments_public_read"  ON departments FOR SELECT USING (TRUE);
CREATE POLICY "departments_admin_write"  ON departments FOR ALL    USING (current_user_is_admin()) WITH CHECK (current_user_is_admin());

CREATE POLICY "faculty_public_read"      ON faculty     FOR SELECT USING (TRUE);
CREATE POLICY "faculty_admin_write"      ON faculty     FOR ALL    USING (current_user_is_admin()) WITH CHECK (current_user_is_admin());

CREATE POLICY "events_public_read"       ON events      FOR SELECT USING (TRUE);
CREATE POLICY "events_admin_write"       ON events      FOR ALL    USING (current_user_is_admin()) WITH CHECK (current_user_is_admin());

-- Profiles: authenticated users can read all (for author picker); users edit own; admins edit all.
CREATE POLICY "profiles_auth_read"       ON profiles    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_self_update"     ON profiles    FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_update"    ON profiles    FOR UPDATE USING (current_user_is_admin());

-- User roles: read own + admins read all; admins write.
CREATE POLICY "user_roles_self_read"     ON user_roles  FOR SELECT USING (user_id = auth.uid() OR current_user_is_admin());
CREATE POLICY "user_roles_admin_write"   ON user_roles  FOR ALL    USING (current_user_is_admin()) WITH CHECK (current_user_is_admin());

-- Submissions: owner CRUD (with lock at finalized), admins full access.
CREATE POLICY "submissions_owner_read"   ON submissions FOR SELECT USING (submitter_id = auth.uid());
CREATE POLICY "submissions_admin_read"   ON submissions FOR SELECT USING (current_user_is_admin());
CREATE POLICY "submissions_owner_insert" ON submissions FOR INSERT WITH CHECK (submitter_id = auth.uid());
CREATE POLICY "submissions_owner_update" ON submissions FOR UPDATE USING (
  submitter_id = auth.uid() AND status IN ('draft','submitted')
);
CREATE POLICY "submissions_admin_update" ON submissions FOR UPDATE USING (current_user_is_admin());

-- Submission authors: readable+writable by owner of the parent submission (while unlocked),
-- and by admins always.
CREATE POLICY "submission_authors_owner_all" ON submission_authors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = submission_id
        AND s.submitter_id = auth.uid()
        AND s.status IN ('draft','submitted')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = submission_id
        AND s.submitter_id = auth.uid()
        AND s.status IN ('draft','submitted')
    )
  );

CREATE POLICY "submission_authors_admin_all" ON submission_authors
  FOR ALL USING (current_user_is_admin()) WITH CHECK (current_user_is_admin());


-- ============================================
-- BOOTSTRAP THE ADMIN
-- ============================================
-- After the schema is created and you log in for the first time, run this
-- in the Supabase SQL editor (swap in your real email):
--
--   INSERT INTO user_roles (user_id, role)
--   SELECT id, 'admin' FROM profiles WHERE email = 'aimeeoke@colostate.edu'
--   ON CONFLICT DO NOTHING;
--
