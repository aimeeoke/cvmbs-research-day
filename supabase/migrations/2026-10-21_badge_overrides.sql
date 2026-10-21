-- Badge overrides (Oct 21, 2026)
--
-- One row per (submission, badge). Admins + committee flip the `action`
-- field to grant a badge the compute pipeline missed, or revoke one that
-- fired falsely. The compute step applies these as a diff after running
-- the pure keyword/count logic:
--
--     final = (computed ∪ grants) − revokes
--
-- Why a thin override table instead of materializing all badges:
--   * Keyword logic + author counts recompute cleanly from submission data,
--     so a materialized table would need to invalidate on every edit.
--   * Overrides are rare (only when a reviewer sees a bad fit); a small
--     diff table is lighter than a full materialization.
--   * Preserves audit trail — we know who overrode what and why.
--
-- Scope: active-event only in practice, but the FK to submissions scopes
-- it naturally — no event_id column needed.

CREATE TABLE badge_overrides (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,

  -- AchievementKey string (TEXT; not CHECK-constrained so we can add
  -- catalog entries without migrating).
  badge_key      TEXT NOT NULL,

  action         TEXT NOT NULL CHECK (action IN ('grant','revoke')),
  reason         TEXT,

  -- Who flipped the override. profiles(id) nullable so a deleted admin
  -- doesn't nuke the row.
  admin_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,

  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),

  -- Latest action per (submission, badge) wins. Flipping grant→revoke is
  -- an UPDATE on the same row, not an insert of a second row.
  UNIQUE (submission_id, badge_key)
);

CREATE INDEX idx_badge_overrides_submission ON badge_overrides(submission_id);

-- updated_at trigger using the shared helper
CREATE TRIGGER trg_badge_overrides_updated_at
  BEFORE UPDATE ON badge_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE badge_overrides ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users. Needed so the /achievements compute
-- step can apply overrides for the signed-in presenter. Non-sensitive —
-- an override just says "this abstract has badge X granted/revoked",
-- which the presenter sees on their own card anyway.
CREATE POLICY "badge_overrides select auth"
  ON badge_overrides FOR SELECT
  TO authenticated
  USING (TRUE);

-- INSERT / UPDATE / DELETE: admin + committee only.
CREATE POLICY "badge_overrides insert admin+committee"
  ON badge_overrides FOR INSERT
  TO authenticated
  WITH CHECK (current_user_has_admin_access());

CREATE POLICY "badge_overrides update admin+committee"
  ON badge_overrides FOR UPDATE
  TO authenticated
  USING (current_user_has_admin_access())
  WITH CHECK (current_user_has_admin_access());

CREATE POLICY "badge_overrides delete admin+committee"
  ON badge_overrides FOR DELETE
  TO authenticated
  USING (current_user_has_admin_access());
