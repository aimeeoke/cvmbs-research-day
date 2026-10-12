// Shared department-credit function (Part 3.1 of the committee leaderboard
// doc). Every competition that credits points to departments — Green Pipette,
// Golden Pipette (as weights on the per-presenter averages), and Department
// Turnout — reads from this.
//
// The rules in plain English:
//   1. For each mentor, work out their "credit department":
//      - CVMBS mentor (faculty_id present, dept in the 4) → their department.
//      - External (non-CSU) OR CSU-but-not-CVMBS mentor → the student's
//        degree department IF it's one of the 4; otherwise ignored.
//   2. Collect the DISTINCT credit departments.
//   3. Split credit:
//      - split_mode='equal_by_department' (default): equal shares per distinct dept.
//      - split_mode='by_mentor': shares proportional to how many mentors landed
//        in each credit dept (committee's "67/33" example).
//   4. If no department qualifies, needsReview=true and the abstract contributes
//      to no one. Admin "needs review" list should flag these.
//
// Encoding notes:
//   - A CVMBS-linked mentor is `faculty_id !== null` AND their
//     faculty.department_id is one of the 4. In the current data model all
//     linked faculty are CVMBS, so faculty_id !== null is a sufficient proxy
//     — but we still require a non-null department_id to be safe.
//   - A "non-CVMBS" mentor is anyone else: faculty_id null (free-text /
//     external) or faculty_id present but no department. User confirmed we
//     treat these the same for crediting (external for the purposes of this
//     function).

export type MentorForCredit = {
  /** CVMBS faculty department, or null if this mentor is external / outside CVMBS. */
  cvmbsDepartmentId: string | null
}

export type CreditInput = {
  mentors: MentorForCredit[]
  /** Presenter's degree department (submissions.department_id). Null if the
   *  presenter is in a cross-college program (DVM, undergrad) with no CVMBS dept. */
  studentDepartmentId: string | null
}

export type CreditConfig = {
  splitMode: 'equal_by_department' | 'by_mentor'
}

export type CreditOutput = {
  /** Department id → share in [0, 1]. Sums to 1 unless needsReview. */
  shares: Record<string, number>
  /** True when no mentor contributed a creditable department. Admin should see this. */
  needsReview: boolean
}

export function computeDepartmentCredit(
  input: CreditInput,
  config: CreditConfig
): CreditOutput {
  const credits: (string | null)[] = input.mentors.map((m) => {
    if (m.cvmbsDepartmentId) return m.cvmbsDepartmentId
    // External or non-CVMBS → fall back to the student's degree dept.
    return input.studentDepartmentId
  })

  const effective = credits.filter((d): d is string => !!d)
  if (effective.length === 0) return { shares: {}, needsReview: true }

  if (config.splitMode === 'by_mentor') {
    const shares: Record<string, number> = {}
    for (const d of effective) shares[d] = (shares[d] ?? 0) + 1 / effective.length
    return { shares, needsReview: false }
  }

  // equal_by_department (default)
  const distinct = Array.from(new Set(effective))
  const share = 1 / distinct.length
  const shares: Record<string, number> = {}
  for (const d of distinct) shares[d] = share
  return { shares, needsReview: false }
}

// ============================================
// Worked examples from the committee doc (Part 3.1).
// These are documentation — run them in a REPL to verify behaviour.
//
// MIP = 'mip-id', BMS = 'bms-id', CS = 'cs-id', ERHS = 'erhs-id'.
//
// 1. "2 MIP mentors + 1 BMS mentor", equal_by_department:
//    { mentors: [{MIP},{MIP},{BMS}], studentDepartmentId: 'any' },
//    config: { splitMode: 'equal_by_department' }
//    → { shares: { MIP: 0.5, BMS: 0.5 }, needsReview: false }
//
// 2. Same input, by_mentor:
//    → { shares: { MIP: 0.667, BMS: 0.333 }, needsReview: false }
//
// 3. External mentor + DVM student (no CVMBS dept):
//    { mentors: [{null}], studentDepartmentId: null }
//    → { shares: {}, needsReview: true }  ← flag to admin
//
// 4. CSU-but-not-CVMBS mentor + MS student in BMS:
//    { mentors: [{null}], studentDepartmentId: 'bms-id' },
//    config: equal_by_department
//    → { shares: { BMS: 1 }, needsReview: false }
// ============================================
