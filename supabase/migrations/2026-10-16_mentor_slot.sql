-- Dedicated column to distinguish Faculty Mentor 1 / Faculty Mentor 2 / Other Mentor
-- (external) rows in submission_authors. Previously inferred from position +
-- faculty_id + affiliation shape, which broke the moment we allowed Non-CSU
-- affiliation on CVMBS Mentor 1 / 2 — a non-faculty Mentor 2 then had the same
-- data signature as an Other Mentor row and the deserializer couldn't tell them
-- apart. The explicit column makes the slot assignment a stored fact.
--
-- Values:
--   cvmbs_1   Required Faculty Mentor 1 slot (ends up in the LAST byline position)
--   cvmbs_2   Optional Faculty Mentor 2 slot
--   external  Optional "Other Mentor" slot (non-faculty — grad student, postdoc, etc.)
--
-- Column is nullable because legacy rows exist. The app reads mentor_slot first
-- and falls back to the heuristic for null-slot rows so legacy drafts keep
-- working while they get re-saved.

ALTER TABLE submission_authors
  ADD COLUMN mentor_slot TEXT CHECK (mentor_slot IN ('cvmbs_1', 'cvmbs_2', 'external'));

-- Backfill existing mentor rows using the inference rules the deserializer
-- was previously running at render time:
--   * Within a submission's mentor rows (position asc):
--       - If only ONE mentor row: if it has non-faculty + affiliation data it
--         is `external` (someone saved an orphan Other Mentor without a
--         required Faculty Mentor 1 — rare but possible on drafts), otherwise
--         `cvmbs_1`.
--       - Otherwise, the LAST-position mentor is always `cvmbs_1`.
--       - The FIRST-position mentor is `external` if it has non-faculty +
--         affiliation data; otherwise `cvmbs_2`.
--       - Any middle row is `cvmbs_2`.

WITH ranked AS (
  SELECT
    id,
    submission_id,
    position,
    faculty_id,
    affiliation,
    department_id,
    display_name,
    ROW_NUMBER() OVER (
      PARTITION BY submission_id ORDER BY position ASC
    ) AS asc_rank,
    ROW_NUMBER() OVER (
      PARTITION BY submission_id ORDER BY position DESC
    ) AS desc_rank,
    COUNT(*) OVER (PARTITION BY submission_id) AS mentor_count
  FROM submission_authors
  WHERE is_mentor = TRUE
)
UPDATE submission_authors sa
SET mentor_slot = CASE
    -- Lone mentor: external if it looks external, otherwise the required cvmbs_1 slot
    WHEN r.mentor_count = 1
         AND r.faculty_id IS NULL
         AND (r.affiliation IS NOT NULL
              OR r.department_id IS NOT NULL
              OR r.display_name LIKE '% · %')
      THEN 'external'
    WHEN r.mentor_count = 1 THEN 'cvmbs_1'
    -- Last-position mentor is always cvmbs_1 when 2+ mentors
    WHEN r.desc_rank = 1 THEN 'cvmbs_1'
    -- First-position mentor is external if non-faculty with affiliation shape
    WHEN r.asc_rank = 1
         AND r.faculty_id IS NULL
         AND (r.affiliation IS NOT NULL
              OR r.department_id IS NOT NULL
              OR r.display_name LIKE '% · %')
      THEN 'external'
    -- Anything else (middle slot, or first-faculty-mentor-not-last) is cvmbs_2
    ELSE 'cvmbs_2'
  END
FROM ranked r
WHERE sa.id = r.id;

-- Fast lookups when deserializing a submission
CREATE INDEX IF NOT EXISTS submission_authors_mentor_slot_idx
  ON submission_authors (submission_id, mentor_slot)
  WHERE mentor_slot IS NOT NULL;
