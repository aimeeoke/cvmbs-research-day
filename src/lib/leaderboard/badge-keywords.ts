// Keyword lists for content + boss + funding badges. Edit here, not in
// achievements-catalog.ts — the committee may want to tweak words without
// touching logic (Oct 21 catalog build note).
//
// Three traps baked into wholeWordMatch (see bottom of file):
//   1. Whole-word only — "cat" must not match "catalyst" / "indicate".
//   2. Case-insensitive — "DVM" matches "dvm".
//   3. Plurals — "mouse" matches "mice" via a separate explicit entry,
//      "cat" matches "cats" via the regex suffix.
//
// Scoping is enforced by the CALLER, not here: run matches only against
// the plain-text title + abstract, never author names/affiliations.

// -----------------------------------------------------------------------------
// Content badges — 22 new + 1 existing (Royal Approval, already in badges.ts
// but mirrored here so the catalog view has one source of truth).
// -----------------------------------------------------------------------------
export const CONTENT_KEYWORDS = {
  outbreak_responder: [
    'virus', 'viruses', 'viral',
    'bacteria', 'bacterium', 'bacterial',
    'pathogen', 'pathogens', 'pathogenic',
    'parasite', 'parasites', 'parasitic',
    'infection', 'infections', 'infectious',
    'zoonotic', 'zoonosis', 'zoonoses',
  ],
  tiny_collaborators: [
    'mouse', 'mice', 'murine',
    'rat', 'rats', 'rodent', 'rodents',
    'hamster', 'hamsters',
    'mole-rat', 'mole rats', 'naked mole-rat', 'naked mole rat',
  ],
  puppy_love: [
    'dog', 'dogs',
    'canine', 'canines',
    'puppy', 'puppies',
    'brachycephalic',
    // Breed names — common ones that show up in CVMBS clinical research.
    'labrador', 'golden retriever', 'bulldog', 'pug', 'poodle',
    'shepherd', 'spaniel', 'terrier', 'beagle',
  ],
  // Radiation — kept DELIBERATELY disjoint from X-Ray Vision below.
  // "Radiograph" starts with the same letters as "radiation," so the
  // whole-word match + no shared tokens is doing all the work here.
  glow_up: [
    'radiation',
    'irradiation', 'irradiated',
    'dosimetry', 'dosimeter',
    'radionuclide', 'radionuclides',
    'radioactive', 'radioactivity',
    'nuclear',
    // Common isotopes seen in CVMBS abstracts
    'cesium-137', 'cesium 137', 'iodine-131', 'iodine 131',
    'cobalt-60', 'cobalt 60', 'technetium-99', 'technetium 99',
    'strontium-90', 'strontium 90',
  ],
  x_ray_vision: [
    'radiograph', 'radiographs', 'radiographic', 'radiography',
    'ultrasound', 'ultrasonographic',
    'CT', 'computed tomography',
    'MRI', 'magnetic resonance',
    'imaging',
  ],
  biscuit_earned: [
    'client-owned', 'client owned',
    'owner', 'owners',
    'shelter', 'shelters',
    'companion animal', 'companion animals',
    'teaching hospital',
    'human-animal bond', 'human animal bond',
  ],
  horsepower: [
    'equine', 'equines',
    'horse', 'horses',
    'mare', 'mares',
    'stallion', 'stallions',
    'foal', 'foals',
    'pony', 'ponies',
    'donkey', 'donkeys',
  ],
  royal_approval: [
    'cat', 'cats',
    'feline', 'felines',
    'kitten', 'kittens',
    'felis',
  ],
  free_range: [
    'wildlife',
    'deer',
    'elk',
    'free-ranging', 'free ranging',
    'bison',
    'gazelle', 'gazelles',
    'pangolin', 'pangolins',
  ],
  cattle_call: [
    'bovine', 'bovines',
    'cattle',
    'cow', 'cows',
    'calf', 'calves',
    'dairy',
    'beef',
  ],
  hot_take: [
    'climate',
    'wildfire', 'wildfires',
    'drought',
    'heat stress',
    'sustainability',
  ],
  technically_a_dinosaur: [
    'avian',
    'bird', 'birds',
    'chicken', 'chickens',
    'poultry',
    'hawk', 'hawks',
    'raptor', 'raptors',
    'killdeer',
  ],
  counting_sheep: [
    'sheep',
    'ovine', 'ovines',
    'lamb', 'lambs',
    'ewe', 'ewes',
  ],
  bloodsucker: [
    'mosquito', 'mosquitoes',
    'tick', 'ticks',
    'Aedes',
    'Culex',
    'Ixodes',
    'arthropod', 'arthropods',
    'midge', 'midges',
  ],
  hog_wild: [
    'swine',
    'porcine',
    'pig', 'pigs',
    'piglet', 'piglets',
  ],
  small_fry: [
    'C. elegans', 'C elegans', 'caenorhabditis',
    'zebrafish',
    'fish',
  ],
  kaboom: [
    'detonation', 'detonations',
    'explosion', 'explosions',
    'nuclear forensics',
  ],
  night_shift: [
    'bat', 'bats',
  ],
  pet_dinosaur: [
    'reptile', 'reptiles',
    'lizard', 'lizards',
    'snake', 'snakes',
    'turtle', 'turtles',
    'tortoise', 'tortoises',
    'gecko', 'geckos',
    'bearded dragon', 'bearded dragons',
    'dinosaur', 'dinosaurs',
  ],
  goat: [
    'goat', 'goats',
    'caprine', 'caprines',
  ],
} as const

export type ContentBadgeKey = keyof typeof CONTENT_KEYWORDS

// Which content badges count as "animal groups" for Menagerie (3+ groups).
// Deliberately excludes outbreak_responder, glow_up, x_ray_vision,
// biscuit_earned, hot_take, kaboom — those aren't animal taxa.
export const MENAGERIE_GROUPS: readonly ContentBadgeKey[] = [
  'tiny_collaborators',
  'puppy_love',
  'horsepower',
  'royal_approval',
  'free_range',
  'cattle_call',
  'technically_a_dinosaur',
  'counting_sheep',
  'bloodsucker',
  'hog_wild',
  'small_fry',
  'night_shift',
  'pet_dinosaur',
  'goat',
]

// -----------------------------------------------------------------------------
// Boss battles — nasty diseases as named bosses.
// -----------------------------------------------------------------------------
export const BOSS_KEYWORDS = {
  the_forgetting: [
    "Alzheimer's", 'Alzheimers', 'Alzheimer',
    "Parkinson's", 'Parkinsons', 'Parkinson',
    'dementia',
    'cognitive dysfunction',
    'neurodegeneration', 'neurodegenerative',
    'amyloid',
    'synuclein',
  ],
  // The Hydra = cancer, EXCLUDING osteosarcoma / lymphoma / leukemia
  // (those are their own bosses). Caller strips those keywords before
  // matching so an osteosarcoma-only abstract doesn't trigger The Hydra.
  the_hydra: [
    'cancer', 'cancers',
    'tumor', 'tumors', 'tumour', 'tumours',
    'carcinoma', 'carcinomas',
    'melanoma', 'melanomas',
    'glioma', 'gliomas',
    'metastasis', 'metastases', 'metastatic',
    'malignant', 'malignancy',
  ],
  the_misfolded: [
    'prion', 'prions',
    'chronic wasting disease',
    'CWD',
    'RT-QuIC',
  ],
  the_swarm: [
    'West Nile',
    'dengue',
    'Zika',
    'encephalitis virus',
    'arbovirus', 'arboviruses',
    'vector-borne', 'vector borne',
    'Lyme',
    'plague',
  ],
  the_bone_thief: [
    'osteosarcoma', 'osteosarcomas',
  ],
  the_ancient_cough: [
    'tuberculosis',
    'Mycobacterium',
    'M. bovis', 'M bovis',
  ],
  the_crown: [
    'coronavirus', 'coronaviruses',
    'SARS-CoV-2', 'SARS CoV 2',
    'COVID',
    'feline infectious peritonitis',
    'FIP',
  ],
  the_shapeshifter: [
    'influenza',
    'H5N1',
    'HPAI',
  ],
  the_unkillable: [
    'antimicrobial resistance',
    'multidrug resistance',
    'MRSA',
  ],
  the_blood_rebel: [
    'lymphoma', 'lymphomas',
    'leukemia', 'leukemias',
    'leukaemia', 'leukaemias',
  ],
  the_classified: [
    'Burkholderia',
    'anthrax',
    'Yersinia pestis',
    'tularemia',
    'select agent',
  ],
} as const

export type BossBadgeKey = keyof typeof BOSS_KEYWORDS

// Boss Rush = 2+ different bosses matched (meta badge; not keyed to text).
// Full list is just all BOSS_KEYWORDS keys; expose a type for consumers.

// -----------------------------------------------------------------------------
// Funding — Seed Funded fires when CRC / College Research Council is cited.
// -----------------------------------------------------------------------------
export const FUNDING_KEYWORDS = {
  seed_funded: [
    'College Research Council',
    'CRC pilot',
    'CRC grant',
    'CRC seed',
    'CRC-funded', 'CRC funded',
  ],
} as const

// -----------------------------------------------------------------------------
// Whole-word matcher
// -----------------------------------------------------------------------------
// Builds one regex per keyword, with word boundaries. Case-insensitive.
// Handles:
//   - plain words → \b word \b
//   - hyphenated phrases ("free-ranging") → treats hyphen as word boundary
//   - acronyms ("DVM", "CRC") → \b anchors still work on all-caps when
//     the haystack is matched case-insensitive
//
// Caller strips HTML to plain text first (via richTextToPlainText).
export function wholeWordMatch(haystack: string, keywords: readonly string[]): string[] {
  if (!haystack) return []
  const hits: string[] = []
  for (const kw of keywords) {
    const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // \b in JS regex doesn't play nice with non-ASCII edges; the keywords
    // we match are all ASCII (species common names, acronyms, drug names)
    // so standard \b works. Multi-word phrases ("West Nile", "Mycobacterium
    // bovis") match if the whole phrase appears, bounded by non-word chars.
    const pattern = new RegExp(`(^|[^A-Za-z0-9])${esc}($|[^A-Za-z0-9])`, 'i')
    if (pattern.test(haystack)) hits.push(kw)
  }
  return hits
}

/** Returns true if any of the keywords appears as a whole word in haystack. */
export function anyWholeWord(haystack: string, keywords: readonly string[]): boolean {
  return wholeWordMatch(haystack, keywords).length > 0
}
