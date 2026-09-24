/**
 * Email helpers.
 *
 * Faculty rule: CVMBS faculty must sign up with their standard
 * `first.last@colostate.edu` alias so their profile links cleanly to the
 * faculty table (which drives Green Labs point attribution). Presenters,
 * trainees, and non-faculty judges can use whatever email they check.
 */

const FACULTY_EMAIL_RE =
  /^[a-z][a-z0-9\-]*(?:\.[a-z0-9\-]+)+@colostate\.edu$/

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** True if the email is a well-formed CSU faculty alias. */
export function isFacultyEmail(email: string): boolean {
  return FACULTY_EMAIL_RE.test(normalizeEmail(email))
}

const BASIC_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function isEmail(email: string): boolean {
  return BASIC_EMAIL_RE.test(email.trim())
}
