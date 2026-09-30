-- Relax certifications identity check to accept name-only (Sep 30, 2026)
--
-- The initial 2026-09-29 certifications table required email OR profile_id
-- for ambassador rows. That doesn't fit reality: the My Green Lab
-- ambassador CSV only ships first + last name — the certifying body
-- doesn't share emails. So we need to accept "name-only" rows as a valid
-- identity for ambassador certs.
--
-- Downstream implication documented in CLAUDE.md: matching a name-only
-- cert to a coauthor on an abstract requires human review (the /admin/names
-- tool already handles the "same person, different spellings" problem).
-- Points calc will need a name-matching strategy for these rows.
--
-- Drops the old auto-named CHECK constraint (name is Postgres-autogen from
-- the inline CHECK in the CREATE TABLE) and adds a new named one so future
-- migrations can reference it explicitly.

DO $$
DECLARE
  con_name TEXT;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'certifications'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%email IS NOT NULL%'
    AND pg_get_constraintdef(oid) LIKE '%profile_id IS NOT NULL%'
    AND pg_get_constraintdef(oid) NOT LIKE '%first_name IS NOT NULL%'  -- old shape
  LIMIT 1;
  IF con_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE certifications DROP CONSTRAINT ' || quote_ident(con_name);
  END IF;
END $$;

ALTER TABLE certifications DROP CONSTRAINT IF EXISTS certifications_identity_check;

ALTER TABLE certifications ADD CONSTRAINT certifications_identity_check CHECK (
  (kind = 'ambassador' AND (
    email IS NOT NULL
    OR profile_id IS NOT NULL
    OR (first_name IS NOT NULL AND last_name IS NOT NULL)
  ))
  OR (kind IN ('my_green_lab', 'green_paw') AND (
    faculty_id IS NOT NULL
    OR lab_name IS NOT NULL
  ))
);
