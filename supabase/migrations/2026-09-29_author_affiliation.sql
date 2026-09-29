-- Author affiliation (Sep 29, 2026)
--
-- Adds per-author department + free-text affiliation to submission_authors.
--
-- Motivation:
--   1. Disambiguate people with the same name (e.g. "Alex Chen" from BMS vs
--      "Alex Chen" from another lab).
--   2. Attribute Green Labs Ambassador points to the correct department for
--      the Green Pipette race — points earned by a coauthor should credit
--      the department they list on the abstract.
--
-- Shape:
--   - department_id UUID  → linked when the person claims a CVMBS department.
--   - affiliation   TEXT  → free text for a CVMBS-adjacent program
--                            ("CMB", "Undergraduate program") or an external
--                            institution ("University of Colorado Boulder").
--   Both are nullable. Existing rows stay NULL; the UI accepts blank.
--
-- Presenter unchanged: the submission itself carries department_id + program
-- on the parent `submissions` row (see 2026-09-25_form_updates.sql).

ALTER TABLE submission_authors
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id),
  ADD COLUMN IF NOT EXISTS affiliation   TEXT;

-- Index on department_id so the future Green Pipette points calc can group
-- author rows by department quickly.
CREATE INDEX IF NOT EXISTS idx_submission_authors_department
  ON submission_authors(department_id);
