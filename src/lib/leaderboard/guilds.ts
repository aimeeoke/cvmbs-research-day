// Maps the submit form's classification options to the five committee-approved
// "guilds". Faculty submitters aren't in any guild — they're excluded from the
// race rather than silently mis-bucketed. Dual-degree mappings follow the
// user's call: "D wins for DVM-duals, Resident-duals go into Postdoc/Resident/
// Intern".

export type GuildKey =
  | 'undergrad'
  | 'grad'
  | 'dvm'
  | 'postdoc_resident_intern'
  | 'staff'

export const GUILDS: {
  key: GuildKey
  emoji: string
  label: string
}[] = [
  { key: 'undergrad',               emoji: '🎓', label: 'Undergraduate Guild' },
  { key: 'grad',                    emoji: '🔬', label: 'Graduate Guild' },
  { key: 'dvm',                     emoji: '🐾', label: 'DVM Guild' },
  { key: 'postdoc_resident_intern', emoji: '🎖️', label: 'Postdoc, Resident & Intern Guild' },
  { key: 'staff',                   emoji: '🥼', label: 'Research Staff Guild' },
]

/** Returns the guild for a classification string, or null if it's not raced. */
export function classificationToGuild(classification: string | null): GuildKey | null {
  if (!classification) return null
  const c = classification.trim()

  // Order matters: "Resident/PhD Student" should match Resident/PhD before PhD.
  if (c === 'Resident/PhD Student' || c === 'Resident/MS Student') return 'postdoc_resident_intern'
  if (c === 'Resident' || c === 'Veterinary Intern' || c === 'Postdoc') return 'postdoc_resident_intern'

  if (c.startsWith('DVM')) return 'dvm'  // DVM Student + DVM/* duals

  if (c === 'Undergraduate Student' || c === 'Post-Baccalaureate') return 'undergrad'

  if (c === 'MS Student' || c === 'PhD Student' || c === 'MD Student' || c === 'MPH Student')
    return 'grad'

  if (c === 'Research Staff') return 'staff'

  // Faculty and anything else: not raced.
  return null
}
