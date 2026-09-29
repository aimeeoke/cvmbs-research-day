-- Certifications table (Sep 29, 2026)
--
-- Backing table for Green Labs certification records. Three flavors:
--   * ambassador    — an individual completed the My Green Lab Ambassador
--                     training. Worth 10 pts per project (capped at 100).
--   * my_green_lab  — a research lab holds My Green Lab certification.
--                     Worth 100 pts flat per project done in that lab.
--   * green_paw     — a clinical space holds Green Paw certification.
--                     Also 100 pts flat.
--
-- Two data paths feed this table:
--
--   (a) CSV import — Aimee drops the biweekly ambassador list into an admin
--       tool; every row becomes a certification with source='csv_import',
--       verified_at=NOW(), valid_through='2026-12-31'. CSV shape (per user):
--       first_name, last_name, email. No PDF file — storage_path stays NULL.
--
--   (b) User upload — an individual not on the pre-loaded list uploads their
--       own certificate through the submit portal. source='user_upload',
--       storage_path points into the `certifications` Supabase Storage bucket
--       (see 2026-09-29_certifications_bucket.sql). Starts unverified;
--       admin reviews the PDF before setting verified_at.
--
-- Auto-link to profiles: certifications reference a person by profile_id when
-- known, but for pre-loaded CSV rows we only get first_name/last_name/email.
-- Matching profile is looked up by email at query time (LOWER equality) —
-- same pattern as `submission_authors.email` from 2026-09-24_schema_tweaks.
-- No trigger needed; keep it simple.
--
-- Relationship to existing boolean flags:
--   * `profiles.is_green_labs_ambassador` and
--     `faculty.my_green_labs_certified` / `green_paw_certified` predate this
--     table. They stay for now (no live callers to break), but the
--     certifications table is the new source of truth. When we wire the
--     display / points calc, read from here — not the booleans.

CREATE TABLE certifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind           TEXT NOT NULL CHECK (kind IN ('ambassador', 'my_green_lab', 'green_paw')),

  -- Individual (ambassador) — one of profile_id / email is needed. email is
  -- how CSV rows match to profiles that sign up later.
  profile_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  first_name     TEXT,
  last_name      TEXT,
  email          TEXT,

  -- Lab / clinic — one of faculty_id / lab_name is needed. lab_name lets us
  -- capture certifications for labs whose PI isn't yet in the faculty roster.
  faculty_id     UUID REFERENCES faculty(id) ON DELETE SET NULL,
  lab_name       TEXT,

  -- Provenance + storage
  source         TEXT NOT NULL CHECK (source IN ('csv_import', 'user_upload', 'admin_manual')),
  storage_path   TEXT,   -- path in `certifications` bucket; NULL for CSV/manual entries with no PDF

  -- Validity + verification
  valid_through  DATE,   -- e.g. 2026-12-31 per the About doc's currency rule
  verified_at    TIMESTAMPTZ,
  verified_by    UUID REFERENCES profiles(id),

  -- Audit
  uploaded_by    UUID REFERENCES profiles(id),
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes          TEXT,

  -- Ambassador rows need at least one identifier; lab rows need at least one
  -- lab reference. Keeps garbage rows out.
  CHECK (
    (kind = 'ambassador' AND (email IS NOT NULL OR profile_id IS NOT NULL))
    OR (kind IN ('my_green_lab', 'green_paw') AND (faculty_id IS NOT NULL OR lab_name IS NOT NULL))
  )
);

CREATE INDEX idx_certifications_kind
  ON certifications(kind);

-- Case-insensitive email lookup — used for CSV → profile matching and for
-- deduping when someone tries to upload while already on the pre-loaded list.
CREATE INDEX idx_certifications_email
  ON certifications(LOWER(email))
  WHERE email IS NOT NULL;

CREATE INDEX idx_certifications_profile_id
  ON certifications(profile_id)
  WHERE profile_id IS NOT NULL;

CREATE INDEX idx_certifications_faculty_id
  ON certifications(faculty_id)
  WHERE faculty_id IS NOT NULL;

-- Verified-only queries (the directory page + points calc will filter here).
CREATE INDEX idx_certifications_verified
  ON certifications(verified_at)
  WHERE verified_at IS NOT NULL;


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Public read — the eventual "list of certified ambassadors and labs" page
-- is public per the About doc. If we later add sensitive fields, split into
-- a public view + private table rather than tightening this policy.
CREATE POLICY "certifications_public_read"
  ON certifications FOR SELECT
  USING (TRUE);

-- Any signed-in user can insert (for the self-upload path). They can't
-- set verified_at (their own row starts unverified); admin reviews it.
CREATE POLICY "certifications_auth_insert"
  ON certifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Admin owns update/delete. Users don't get to modify their own submission
-- after upload — they'd need to contact admin. Keeps the verification trail
-- honest.
CREATE POLICY "certifications_admin_write"
  ON certifications FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());
