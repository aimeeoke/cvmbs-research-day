// Fuzzy name-matching key for Green Labs ambassador credit.
//
// Email was the original identity but people use three or more addresses
// across the CSU landscape (first.last alias, legacy ename, personal). On
// top of that, authors often type preferred names ("Tom" for "Thomas",
// "Sam" for "Samuel") on their abstract that don't match the full name
// on the certifying body's roster.
//
// Key shape: `${lastName}|${first3LettersOfFirstName}` — both normalized
// (lowercased, diacritics stripped, hyphens/apostrophes stripped,
// whitespace collapsed). "Thomas Johnson" → "johnson|tho" matches
// "Tom Johnson" → "johnson|tom" ✗ ... wait, those don't match.
//
// Preferred-name trade-off: taking first-3 doesn't help "Tom" ↔ "Thomas"
// because the preferred name is shorter than three characters of the
// legal name. The user accepted this: they're correcting "Tom" → "Thomas"
// on the abstract (that's the name he publishes under). The three-letter
// rule DOES catch "Sam" ↔ "Samuel" (both normalize to "sam"), "Jen" ↔
// "Jennifer" (both → "jen"), "Mike" ↔ "Michael" (both → "mik"). So the
// rule is: match preferred-name diminutives that start with the same
// three letters as the full name.
//
// Collision risk: "Smith|jen" could match both Jennifer and Jenna.
// That's a tolerable tradeoff for 151 preloaded ambassadors; worst case
// is false-positive credit, which /admin/certifications can clean up.

/** Strips diacritics, hyphens, apostrophes; lowercases; collapses whitespace. */
export function normalizeNamePart(s: string | null | undefined): string {
  return (s ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // combining diacritical marks
    .replace(/[-'`]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Returns `${lastName}|${first3}` or null if either part is empty after
 * normalization. If the first name is shorter than 3 characters, uses the
 * whole first name — "Al Jones" → "jones|al" (no padding).
 */
export function nameMatchKey(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string | null {
  const first = normalizeNamePart(firstName)
  const last = normalizeNamePart(lastName)
  if (!first || !last) return null
  const firstKey = first.length >= 3 ? first.slice(0, 3) : first
  return `${last}|${firstKey}`
}

/** Convenience: parses a single "Full Name" string into first + last parts.
 *  Last token is the last name; everything else joined is the first name.
 *  Won't handle "Dr. Jane Smith PhD" cleanly — strip titles upstream. */
export function nameMatchKeyFromFullName(fullName: string | null | undefined): string | null {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return null
  const last = parts[parts.length - 1]
  const first = parts.slice(0, -1).join(' ')
  return nameMatchKey(first, last)
}
