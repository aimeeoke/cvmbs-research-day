// Copies the 60 achievement sticker PNGs from docs/Achievements/ to
// public/achievements/<key>.png so Next.js can serve them from
// /achievements/<key>.png. Re-run whenever the source files change.
//
// Usage: node scripts/copy-achievement-stickers.mjs

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const srcRoot = join(repoRoot, 'docs', 'Achievements')
const dstRoot = join(repoRoot, 'public', 'achievements')

// Source-filename-stem → achievement key. The source filenames contain
// position prefixes and rarity suffixes that don't match our keys; a tiny
// explicit mapping is clearer than parsing.
const MAP = {
  // Timing
  'A1_early_bird_rare': 'early_bird',
  'A2_night_owl_common': 'night_owl',
  'A3_photo_finish_rare': 'photo_finish',
  'A4_first_blood_legendary': 'first_blood',
  'A5_weekend_warrior_common': 'weekend_warrior',
  // Content (secret)
  'B01_outbreak_responder_common': 'outbreak_responder',
  'B02_tiny_collaborators_common': 'tiny_collaborators',
  'B03_puppy_love_common': 'puppy_love',
  'B04_glow_up_uncommon': 'glow_up',
  'B05_xray_vision_uncommon': 'x_ray_vision',
  'B06_biscuit_earned_uncommon': 'biscuit_earned',
  'B07_horsepower_uncommon': 'horsepower',
  'B08_royal_approval_uncommon': 'royal_approval',
  'B09_free_range_uncommon': 'free_range',
  'B10_two_heads_uncommon': 'two_heads_are_better',
  'B11_cattle_call_uncommon': 'cattle_call',
  'B12_hot_take_uncommon': 'hot_take',
  'B13_technically_dinosaur_uncommon': 'technically_a_dinosaur',
  'B14_reigning_cats_dogs_rare': 'reigning_cats_and_dogs',
  'B15_counting_sheep_rare': 'counting_sheep',
  'B16_bloodsucker_rare': 'bloodsucker',
  'B17_menagerie_rare': 'menagerie',
  'B18_hog_wild_rare': 'hog_wild',
  'B19_small_fry_rare': 'small_fry',
  'B20_kaboom_rare': 'kaboom',
  'B21_night_shift_rare': 'night_shift',
  'B22_pet_dinosaur_legendary': 'pet_dinosaur',
  'B23_goat_legendary': 'goat',
  // Boss battles (secret)
  'C01_the_forgetting_boss': 'the_forgetting',
  'C02_the_hydra_boss': 'the_hydra',
  'C03_boss_rush_boss': 'boss_rush',
  'C04_the_misfolded_boss': 'the_misfolded',
  'C05_the_swarm_boss': 'the_swarm',
  'C06_the_bone_thief_boss': 'the_bone_thief',
  'C07_the_ancient_cough_boss': 'the_ancient_cough',
  'C08_the_crown_boss': 'the_crown',
  'C09_the_shapeshifter_boss': 'the_shapeshifter',
  'C10_the_unkillable_boss': 'the_unkillable',
  'C11_the_blood_rebel_boss': 'the_blood_rebel',
  'C12_the_classified_boss': 'the_classified',
  // Author list
  'D1_coop_mode_uncommon': 'co_op_mode',
  'D2_raid_party_rare': 'raid_party',
  'D3_full_party_legendary': 'full_party',
  'D4_world_raid_legendary': 'world_raid',
  // Green Labs
  'E1_green_ambassador_uncommon': 'green_ambassador',
  'E2_green_team_rare': 'green_team',
  'E3_old_growth_legendary': 'old_growth',
  // Affiliations
  'F1_center_of_attention_common': 'center_of_attention',
  'F2_with_the_program_common': 'with_the_program',
  'F3_lab_partner_common': 'lab_partner',
  'F4_t_minus_uncommon': 't_minus',
  'F5_institutionalized_rare': 'institutionalized',
  'F6_multiclass_common': 'multiclass',
  'F7_diplomat_rare': 'diplomat',
  'F8_grand_alliance_legendary': 'grand_alliance',
  // Funding
  'G1_benefactor_uncommon': 'benefactor',
  'G2_seed_funded_uncommon': 'seed_funded',
  // Attendance
  'H1_first_timer_common': 'first_timer',
  'H2_three_year_veteran_rare': 'veteran_3',
  'H3_five_year_veteran_legendary': 'veteran_5',
  // Day-of (surviving two — final_floor + present_and_accounted_for dropped)
  'I1_certified_judgy_rare': 'certified_judgy',
  'I2_peer_reviewed_pic_uncommon': 'peer_reviewed_pic',
}

if (!existsSync(dstRoot)) {
  mkdirSync(dstRoot, { recursive: true })
}

// Walk the source tree once and index by filename stem.
const index = new Map()
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) walk(p)
    else if (s.isFile() && name.toLowerCase().endsWith('.png')) {
      index.set(name.slice(0, -4), p)
    }
  }
}
walk(srcRoot)

let copied = 0
const missing = []
for (const [stem, key] of Object.entries(MAP)) {
  const src = index.get(stem)
  if (!src) {
    missing.push(stem)
    continue
  }
  copyFileSync(src, join(dstRoot, `${key}.png`))
  copied++
}

console.log(`Copied ${copied}/${Object.keys(MAP).length} achievement stickers to ${dstRoot}`)
if (missing.length > 0) {
  console.warn('Missing source files for:', missing.join(', '))
  process.exit(1)
}
