// Full Research Day 2027 Achievement Catalog — source of truth for
// /achievements. 65 badges in 9 families, with Dungeon Crawler Carl
// announcer voice. See docs/Research Day 2027 Achievement Catalog.docx
// for the original design doc.
//
// This file lives alongside badges.ts (the shipped /leaderboard player
// card types) rather than replacing it. Overlap in the 9 pre-catalog
// badges is intentional: badges.ts stays stable, this catalog is the
// expanded view used by /achievements.
//
// Compute lives in `achievements.ts` and `badge-keywords.ts`.
// Admin override lives in the `badge_overrides` table.

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export type AchievementFamily =
  | 'timing'
  | 'content'
  | 'boss'
  | 'authors'
  | 'green_labs'
  | 'affiliations'
  | 'funding'
  | 'attendance'
  | 'day_of'

/** How the compute pipeline treats a badge today. */
export type Availability =
  | 'live'      // compute runs now
  | 'phase2'   // catalog entry exists; compute depends on Green Labs cert matching or judge join
  | 'deferred' // feature doesn't exist yet (Final Floor QR, feedback moderation, no-show tracking, photo mod)

export type AchievementKey =
  // Timing (5)
  | 'early_bird'
  | 'night_owl'
  | 'photo_finish'
  | 'first_blood'
  | 'weekend_warrior'
  // Content (23)
  | 'outbreak_responder'
  | 'tiny_collaborators'
  | 'puppy_love'
  | 'glow_up'
  | 'x_ray_vision'
  | 'biscuit_earned'
  | 'horsepower'
  | 'royal_approval'
  | 'free_range'
  | 'two_heads_are_better'
  | 'cattle_call'
  | 'hot_take'
  | 'technically_a_dinosaur'
  | 'reigning_cats_and_dogs'
  | 'counting_sheep'
  | 'bloodsucker'
  | 'menagerie'
  | 'hog_wild'
  | 'small_fry'
  | 'kaboom'
  | 'night_shift'
  | 'pet_dinosaur'
  | 'goat'
  // Boss battles (12)
  | 'the_forgetting'
  | 'the_hydra'
  | 'boss_rush'
  | 'the_misfolded'
  | 'the_swarm'
  | 'the_bone_thief'
  | 'the_ancient_cough'
  | 'the_crown'
  | 'the_shapeshifter'
  | 'the_unkillable'
  | 'the_blood_rebel'
  | 'the_classified'
  // Author list (4)
  | 'co_op_mode'
  | 'raid_party'
  | 'full_party'
  | 'world_raid'
  // Green Labs (3)
  | 'green_ambassador'
  | 'green_team'
  | 'old_growth'
  // Affiliations (8)
  | 'center_of_attention'
  | 'with_the_program'
  | 'lab_partner'
  | 't_minus'
  | 'institutionalized'
  | 'multiclass'
  | 'diplomat'
  | 'grand_alliance'
  // Funding (2)
  | 'benefactor'
  | 'seed_funded'
  // Attendance (3)
  | 'first_timer'
  | 'veteran_3'
  | 'veteran_5'
  // Day-of (5)
  | 'certified_judgy'
  | 'conversation_starter'
  | 'peer_reviewed_pic'
  | 'final_floor'
  | 'present_and_accounted_for'

export type Achievement = {
  key: AchievementKey
  emoji: string
  label: string
  /** Short plain-English — used in tooltips, player card lists, admin UI. */
  blurb: string
  /** Dungeon Crawler Carl voice from the catalog. Shown on /achievements. */
  announcer: string
  rarity: Rarity
  family: AchievementFamily
  /** True = shown as a filled tile from day one. False = "?" until unlocked. */
  visible: boolean
  availability: Availability
}

// prettier-ignore
export const ACHIEVEMENTS: Record<AchievementKey, Achievement> = {
  // --- Timing ----------------------------------------------------------------
  early_bird: {
    key: 'early_bird',
    emoji: '🐣', label: 'Early Bird',
    blurb: 'Among the first 50 draft submissions.',
    announcer: 'You submitted before the deadline panic. Your reward: a badge and a deeply smug feeling. Use both responsibly.',
    rarity: 'rare', family: 'timing', visible: true, availability: 'live',
  },
  night_owl: {
    key: 'night_owl',
    emoji: '🦉', label: 'Night Owl',
    blurb: 'Submitted between midnight and 4 AM Mountain Time.',
    announcer: 'Abstract received at an hour when only raccoons and lab incubators are awake. Your circadian rhythm has filed a formal complaint. Reward: this badge. Sleep not included.',
    rarity: 'common', family: 'timing', visible: true, availability: 'live',
  },
  photo_finish: {
    key: 'photo_finish',
    emoji: '🏁', label: 'Photo Finish',
    blurb: 'Submitted in the final hour before the deadline.',
    announcer: 'Submission received with minutes to spare. The system admires your nerve and fears your process. Reward: survival.',
    rarity: 'rare', family: 'timing', visible: true, availability: 'live',
  },
  first_blood: {
    key: 'first_blood',
    emoji: '⚔️', label: 'First Blood',
    blurb: 'The single earliest submission of the season, by timestamp.',
    announcer: 'The first abstract of the year. You charged in before anyone checked for traps. Bold. Possibly reckless. Reward: you will be first forever, and the system will never let anyone forget it.',
    rarity: 'legendary', family: 'timing', visible: true, availability: 'live',
  },
  weekend_warrior: {
    key: 'weekend_warrior',
    emoji: '🏖️', label: 'Weekend Warrior',
    blurb: 'Submitted on a Saturday or Sunday.',
    announcer: 'Submitted on a weekend. Your abstract is proud of you. Your friends are wondering where you went. Reward: one (1) weekend, retroactively consumed.',
    rarity: 'common', family: 'timing', visible: true, availability: 'live',
  },

  // --- Content (secret) ------------------------------------------------------
  outbreak_responder: {
    key: 'outbreak_responder',
    emoji: '🦠', label: 'Outbreak Responder',
    blurb: 'Infectious disease research detected.',
    announcer: 'Infectious disease research detected. You have voluntarily spent your career near things that want to kill everyone. The system respects this deeply and is standing over here. Reward: a badge, pre-sanitized.',
    rarity: 'common', family: 'content', visible: false, availability: 'live',
  },
  tiny_collaborators: {
    key: 'tiny_collaborators',
    emoji: '🐭', label: 'Tiny Collaborators',
    blurb: 'Rodent research detected.',
    announcer: 'Rodent research detected. Thousands of tiny collaborators made this possible. They will not be listed as co-authors. They have formed a union. Reward: their eternal, whiskery silence.',
    rarity: 'common', family: 'content', visible: false, availability: 'live',
  },
  puppy_love: {
    key: 'puppy_love',
    emoji: '🐕', label: 'Puppy Love',
    blurb: 'Canine research detected.',
    announcer: 'Canine research detected. Somewhere, a very good dog is sitting perfectly still, waiting to hear how it went. Reward: unconditional approval, which you did not earn and will receive anyway.',
    rarity: 'common', family: 'content', visible: false, availability: 'live',
  },
  glow_up: {
    key: 'glow_up',
    emoji: '☢️', label: 'Glow Up',
    blurb: 'Radiation research detected.',
    announcer: 'Radiation research detected. Your abstract has been scanned, measured and found to be emitting excellence at safe levels. Reward: please return your dosimeter to the front desk on your way out.',
    rarity: 'uncommon', family: 'content', visible: false, availability: 'live',
  },
  x_ray_vision: {
    key: 'x_ray_vision',
    emoji: '🩻', label: 'X-Ray Vision',
    blurb: 'Imaging research detected.',
    announcer: 'Imaging research detected. You look through solid objects for a living. The system finds this impressive and slightly invasive. Reward: you may now squint knowingly at any wall.',
    rarity: 'uncommon', family: 'content', visible: false, availability: 'live',
  },
  biscuit_earned: {
    key: 'biscuit_earned',
    emoji: '🦴', label: 'Biscuit Earned',
    blurb: 'Research with real pets and real families.',
    announcer: 'Research involving real pets with real families. Someone trusted you with their best friend. Reward: one (1) biscuit. Non-transferable. Non-edible. Deeply meaningful.',
    rarity: 'uncommon', family: 'content', visible: false, availability: 'live',
  },
  horsepower: {
    key: 'horsepower',
    emoji: '🐎', label: 'Horsepower',
    blurb: 'Equine research detected.',
    announcer: 'Equine research detected. Your study subjects weigh half a ton and still spook at plastic bags. Reward: you may neigh once at the awards ceremony. Once.',
    rarity: 'uncommon', family: 'content', visible: false, availability: 'live',
  },
  royal_approval: {
    key: 'royal_approval',
    emoji: '👑', label: 'Royal Approval',
    blurb: 'Feline research detected.',
    announcer: 'Feline research detected. Her Majesty has reviewed your abstract and found it… acceptable. Do not let this go to your head. That is her job. Reward: a tiara you are not allowed to touch.',
    rarity: 'uncommon', family: 'content', visible: false, availability: 'live',
  },
  free_range: {
    key: 'free_range',
    emoji: '🦌', label: 'Free Range',
    blurb: 'Wildlife research detected.',
    announcer: 'Wildlife research detected. Your study subjects did not sign consent forms and actively ran away from you. Excellent field work. Reward: burrs in your socks for life.',
    rarity: 'uncommon', family: 'content', visible: false, availability: 'live',
  },
  two_heads_are_better: {
    key: 'two_heads_are_better',
    emoji: '🐕‍🦺', label: 'Two Heads Are Better',
    blurb: 'Puppy Love abstract with 2+ mentors.',
    announcer: 'A dog project with two mentors. Like the two-headed guard dog of legend, but with better boundaries and fewer fire hazards. Reward: twice the feedback. Brace yourself.',
    rarity: 'uncommon', family: 'content', visible: false, availability: 'live',
  },
  cattle_call: {
    key: 'cattle_call',
    emoji: '🐄', label: 'Cattle Call',
    blurb: 'Bovine research detected.',
    announcer: 'Bovine research detected. Your data came from animals that outweigh your car and have opinions about it. Reward: one moo of approval, delivered with conviction.',
    rarity: 'uncommon', family: 'content', visible: false, availability: 'live',
  },
  hot_take: {
    key: 'hot_take',
    emoji: '🌡️', label: 'Hot Take',
    blurb: 'Climate research detected.',
    announcer: "Climate research detected. Things are heating up: the planet, your department's leaderboard bar, this badge. Only two of those are good news. Reward: shade.",
    rarity: 'uncommon', family: 'content', visible: false, availability: 'live',
  },
  technically_a_dinosaur: {
    key: 'technically_a_dinosaur',
    emoji: '🦖', label: 'Technically a Dinosaur',
    blurb: 'Avian research detected.',
    announcer: 'Avian research detected. Birds are living dinosaurs. You have been studying dinosaurs this entire time and nobody told you. Now we have. Reward: you may call yourself a paleontologist (unofficially).',
    rarity: 'uncommon', family: 'content', visible: false, availability: 'live',
  },
  reigning_cats_and_dogs: {
    key: 'reigning_cats_and_dogs',
    emoji: '🐱‍🐶', label: 'Reigning Cats and Dogs',
    blurb: 'Both cat and dog research in one abstract.',
    announcer: "Cats AND dogs in one abstract. The system has placed them in separate safe rooms for everyone's protection. Reward: diplomatic immunity.",
    rarity: 'rare', family: 'content', visible: false, availability: 'live',
  },
  counting_sheep: {
    key: 'counting_sheep',
    emoji: '🐑', label: 'Counting Sheep',
    blurb: 'Ovine research detected.',
    announcer: "Ovine research detected. You count sheep professionally. Insomniacs everywhere are jealous. Reward: a full night's sleep, sold separately.",
    rarity: 'rare', family: 'content', visible: false, availability: 'live',
  },
  bloodsucker: {
    key: 'bloodsucker',
    emoji: '🦟', label: 'Bloodsucker',
    blurb: 'Vector research detected.',
    announcer: 'Vector research detected. You study tiny creatures that drink blood and spread chaos. You are the reason the rest of us can go hiking. Reward: bug spray, spiritually.',
    rarity: 'rare', family: 'content', visible: false, availability: 'live',
  },
  menagerie: {
    key: 'menagerie',
    emoji: '🎪', label: 'Menagerie',
    blurb: '3+ different animal groups in one abstract.',
    announcer: "Three or more kinds of animals in one abstract. This is less a study and more a traveling circus with statistics. Reward: a ringmaster's hat and a cleanup crew.",
    rarity: 'rare', family: 'content', visible: false, availability: 'live',
  },
  hog_wild: {
    key: 'hog_wild',
    emoji: '🐖', label: 'Hog Wild',
    blurb: 'Swine research detected.',
    announcer: 'Swine research detected. Pigs are smarter than dogs, and they know it. Do not tell the Puppy Love crowd. Reward: a badge, slightly muddy.',
    rarity: 'rare', family: 'content', visible: false, availability: 'live',
  },
  small_fry: {
    key: 'small_fry',
    emoji: '🐟', label: 'Small Fry',
    blurb: 'Worm or fish research detected.',
    announcer: 'Worm or fish research detected. Your model organism is small, see-through or both. Big science, tiny subjects. Reward: a magnifying glass for admiring this badge.',
    rarity: 'rare', family: 'content', visible: false, availability: 'live',
  },
  kaboom: {
    key: 'kaboom',
    emoji: '💥', label: 'Kaboom',
    blurb: 'Abstract contains the word "detonation."',
    announcer: 'Your abstract contains the word "detonation." The system has notified absolutely no one, because this is clearly science. Probably. Reward: safety glasses. Wear them.',
    rarity: 'rare', family: 'content', visible: false, availability: 'live',
  },
  night_shift: {
    key: 'night_shift',
    emoji: '🦇', label: 'Night Shift',
    blurb: 'Bat research detected.',
    announcer: 'Bat research detected. You study the only mammals that can fly, and you still filled out the same protocol forms as everyone else. Reward: upside-down respect.',
    rarity: 'rare', family: 'content', visible: false, availability: 'live',
  },
  pet_dinosaur: {
    key: 'pet_dinosaur',
    emoji: '🦎', label: 'Pet Dinosaur',
    blurb: 'Reptile research detected.',
    announcer: 'Reptile research detected. Scales, cold blood and a stare that remembers the Cretaceous. Every great adventurer deserves a pet dinosaur. You found yours. Reward: a very sturdy leash.',
    rarity: 'legendary', family: 'content', visible: false, availability: 'live',
  },
  goat: {
    key: 'goat',
    emoji: '🐐', label: 'G.O.A.T.',
    blurb: 'Goat research detected.',
    announcer: 'Goat research detected. By system decree you are now the Greatest Of All Time. The goat disputes this ruling and will be screaming about it shortly. Reward: the title. Keep it away from the goat.',
    rarity: 'legendary', family: 'content', visible: false, availability: 'live',
  },

  // --- Boss battles (secret) -------------------------------------------------
  the_forgetting: {
    key: 'the_forgetting',
    emoji: '🧠', label: 'The Forgetting',
    blurb: 'Alzheimer/Parkinson/neurodegeneration boss.',
    announcer: 'BOSS ENGAGED: The Forgetting. It steals memories one at a time. You are building the case against it, one data point at a time. Reward: the system will remember that you did this.',
    rarity: 'uncommon', family: 'boss', visible: false, availability: 'live',
  },
  the_hydra: {
    key: 'the_hydra',
    emoji: '🐍', label: 'The Hydra',
    blurb: 'Cancer boss (except osteosarcoma, lymphoma, leukemia).',
    announcer: 'BOSS ENGAGED: The Hydra. Cut off one head and it tries to grow two more somewhere else. Your weapon of choice: data. Reward: +10 persistence, which you will need.',
    rarity: 'uncommon', family: 'boss', visible: false, availability: 'live',
  },
  boss_rush: {
    key: 'boss_rush',
    emoji: '⚡', label: 'Boss Rush',
    blurb: '2+ bosses in one abstract.',
    announcer: 'Multiple bosses detected in one abstract. Most researchers fight one at a time. You looked at the map and said "all of them." Reward: a second health bar.',
    rarity: 'uncommon', family: 'boss', visible: false, availability: 'live',
  },
  the_misfolded: {
    key: 'the_misfolded',
    emoji: '🧬', label: 'The Misfolded',
    blurb: 'Prion / CWD boss.',
    announcer: "BOSS ENGAGED: The Misfolded. A protein that folded wrong and decided to make it everyone's problem. Heat, bleach and the autoclave barely slow it down. You brought a microscope. Bold. Reward: hazard pay, morally.",
    rarity: 'rare', family: 'boss', visible: false, availability: 'live',
  },
  the_swarm: {
    key: 'the_swarm',
    emoji: '🐝', label: 'The Swarm',
    blurb: 'Arbovirus / vector-borne boss.',
    announcer: 'BOSS ENGAGED: The Swarm. It arrives by wing, by bite and by the thousands, usually during your vacation. Reward: one ceremonial citronella candle.',
    rarity: 'rare', family: 'boss', visible: false, availability: 'live',
  },
  the_bone_thief: {
    key: 'the_bone_thief',
    emoji: '🦴', label: 'The Bone Thief',
    blurb: 'Osteosarcoma boss.',
    announcer: "BOSS ENGAGED: The Bone Thief. It goes after the biggest dogs and the strongest bones. You are on the team hunting it down. Reward: the system's undying respect and a very large bone.",
    rarity: 'rare', family: 'boss', visible: false, availability: 'live',
  },
  the_ancient_cough: {
    key: 'the_ancient_cough',
    emoji: '🫁', label: 'The Ancient Cough',
    blurb: 'Tuberculosis / M. bovis boss.',
    announcer: 'BOSS ENGAGED: The Ancient Cough. It has been fighting people and cattle for thousands of years and is in no hurry to leave. Neither are you. Reward: patience, the only stat that matters here.',
    rarity: 'rare', family: 'boss', visible: false, availability: 'live',
  },
  the_crown: {
    key: 'the_crown',
    emoji: '👑', label: 'The Crown',
    blurb: 'Coronavirus / FIP boss.',
    announcer: "BOSS ENGAGED: The Crown. A royal family of viruses that thinks very highly of itself. Your abstract would like a word with the monarchy. Reward: a commoner's satisfaction.",
    rarity: 'rare', family: 'boss', visible: false, availability: 'live',
  },
  the_shapeshifter: {
    key: 'the_shapeshifter',
    emoji: '🌀', label: 'The Shapeshifter',
    blurb: 'Influenza / H5N1 boss.',
    announcer: 'BOSS ENGAGED: The Shapeshifter. It changes its coat every season and recently developed a taste for dairy cows. You keep it on a watch list. Reward: a flu shot of honor.',
    rarity: 'rare', family: 'boss', visible: false, availability: 'live',
  },
  the_unkillable: {
    key: 'the_unkillable',
    emoji: '🛡️', label: 'The Unkillable',
    blurb: 'Antimicrobial resistance boss.',
    announcer: "BOSS ENGAGED: The Unkillable. It has met every antibiotic in the pharmacy and laughed at most of them. You are looking for the one it hasn't met yet. Reward: the last laugh, pending.",
    rarity: 'rare', family: 'boss', visible: false, availability: 'live',
  },
  the_blood_rebel: {
    key: 'the_blood_rebel',
    emoji: '🩸', label: 'The Blood Rebel',
    blurb: 'Lymphoma / leukemia boss.',
    announcer: "BOSS ENGAGED: The Blood Rebel. Cells that were supposed to defend the body went rogue. You are reading their battle plans. Reward: the traitor's dossier, fully annotated.",
    rarity: 'rare', family: 'boss', visible: false, availability: 'live',
  },
  the_classified: {
    key: 'the_classified',
    emoji: '🕵️', label: 'The Classified',
    blurb: 'Select-agent boss.',
    announcer: 'BOSS ENGAGED: [REDACTED]. Details about this boss are restricted to authorized personnel. Your badge is also restricted. Your congratulations have been redacted. Reward: ████████.',
    rarity: 'legendary', family: 'boss', visible: false, availability: 'live',
  },

  // --- Author list -----------------------------------------------------------
  co_op_mode: {
    key: 'co_op_mode',
    emoji: '👥', label: 'Co-op Mode',
    blurb: 'Just you and your mentor — exactly 2 authors.',
    announcer: 'Just you and your mentor. No guild, no backup, no one else to blame. The purest form of co-op. Reward: undivided credit, divided by two.',
    rarity: 'uncommon', family: 'authors', visible: true, availability: 'live',
  },
  raid_party: {
    key: 'raid_party',
    emoji: '⚔️', label: 'Raid Party',
    blurb: '11 or more authors.',
    announcer: "More than ten authors. This isn't an abstract, it's a raid. Please settle loot distribution before the awards ceremony. Reward: one badge, to be shared eleven ways.",
    rarity: 'rare', family: 'authors', visible: true, availability: 'live',
  },
  full_party: {
    key: 'full_party',
    emoji: '🎉', label: 'Full Party',
    blurb: 'All 3 mentor slots filled.',
    announcer: 'Three mentors. Tank, healer and strategist, all on one abstract. Your party is full and no more applications are being accepted. Reward: three times the advice, occasionally contradictory.',
    rarity: 'legendary', family: 'authors', visible: true, availability: 'live',
  },
  world_raid: {
    key: 'world_raid',
    emoji: '🌍', label: 'World Raid',
    blurb: '20 or more authors.',
    announcer: 'Twenty or more authors. The system had to scroll. Reward: a group photo slot at the backdrop wall, if you can all fit.',
    rarity: 'legendary', family: 'authors', visible: true, availability: 'live',
  },

  // --- Green Labs (compute lives in player.ts today; Phase 2 for coauthor cross-ref)
  green_ambassador: {
    key: 'green_ambassador',
    emoji: '🌱', label: 'Green Ambassador',
    blurb: 'The presenter has a verified Ambassador certificate.',
    announcer: "You completed sustainability training voluntarily. The planet thanks you. Your department's leaderboard bar thanks you more.",
    rarity: 'uncommon', family: 'green_labs', visible: true, availability: 'live',
  },
  green_team: {
    key: 'green_team',
    emoji: '🌿', label: 'Green Team',
    blurb: '4+ authors on the abstract are certified Ambassadors.',
    announcer: 'Four or more Green Ambassadors on one abstract. Your lab is now officially greener than the leaderboard. Reward: 40+ points for your department and a faint sense of photosynthesis.',
    rarity: 'rare', family: 'green_labs', visible: true, availability: 'phase2',
  },
  old_growth: {
    key: 'old_growth',
    emoji: '🌳', label: 'Old Growth',
    blurb: 'Every author on the abstract is certified.',
    announcer: 'Every single author is a certified Green Ambassador. Not one holdout. The system checked twice. You have found the rarest thing in the dungeon: a lab that agreed on something. Reward: the forest remembers.',
    rarity: 'legendary', family: 'green_labs', visible: true, availability: 'phase2',
  },

  // --- Affiliations ---------------------------------------------------------
  center_of_attention: {
    key: 'center_of_attention',
    emoji: '🎯', label: 'Center of Attention',
    blurb: 'Affiliated with a Center.',
    announcer: 'Affiliated with a Center. You are, by definition, the center of attention. The system has adjusted the spotlight accordingly. Reward: centered.',
    rarity: 'common', family: 'affiliations', visible: true, availability: 'live',
  },
  with_the_program: {
    key: 'with_the_program',
    emoji: '📋', label: 'With the Program',
    blurb: 'Affiliated with a Program.',
    announcer: 'Affiliated with a Program. You are with the program. Literally. The system approves of your enrollment. Reward: a schedule you will ignore.',
    rarity: 'common', family: 'affiliations', visible: true, availability: 'live',
  },
  lab_partner: {
    key: 'lab_partner',
    emoji: '🧪', label: 'Lab Partner',
    blurb: 'Affiliated with a Laboratory.',
    announcer: 'Affiliated with a Laboratory. You have a home base, a bench and a fridge full of mysterious labeled tubes. Reward: one tube, unlabeled. Good luck.',
    rarity: 'common', family: 'affiliations', visible: true, availability: 'live',
  },
  t_minus: {
    key: 't_minus',
    emoji: '🚀', label: 'T-Minus',
    blurb: 'Affiliated with a Training Grant.',
    announcer: 'Affiliated with a training grant. Launch sequence underway. T-minus one Research Day to liftoff. Reward: a progress report, due annually, forever.',
    rarity: 'uncommon', family: 'affiliations', visible: true, availability: 'live',
  },
  institutionalized: {
    key: 'institutionalized',
    emoji: '🏛️', label: 'Institutionalized',
    blurb: 'Affiliated with an Institute.',
    announcer: 'Affiliated with an Institute. You have been institutionalized. Voluntarily. The paperwork is on file. Reward: a lanyard.',
    rarity: 'rare', family: 'affiliations', visible: true, availability: 'live',
  },
  multiclass: {
    key: 'multiclass',
    emoji: '🎭', label: 'Multiclass',
    blurb: 'Affiliations across 2+ types.',
    announcer: 'Affiliations across two or more types detected. You have multiclassed. Your skill tree now looks like a subway map. Reward: twice the meetings.',
    rarity: 'common', family: 'affiliations', visible: true, availability: 'live',
  },
  diplomat: {
    key: 'diplomat',
    emoji: '🤝', label: 'Diplomat',
    blurb: 'Affiliations across 3+ types.',
    announcer: "Three or more types of affiliation. You are now a diplomat between factions that didn't know they were rivals. Reward: a seat at every table and lunch at none of them.",
    rarity: 'rare', family: 'affiliations', visible: true, availability: 'live',
  },
  grand_alliance: {
    key: 'grand_alliance',
    emoji: '👑', label: 'Grand Alliance',
    blurb: 'All 5 affiliation types.',
    announcer: 'Center, Institute, Laboratory, Program and Training Grant. All five. Nobody managed this last year. The system had to check whether it was allowed. Reward: you are now a faction of your own.',
    rarity: 'legendary', family: 'affiliations', visible: true, availability: 'live',
  },

  // --- Funding --------------------------------------------------------------
  benefactor: {
    key: 'benefactor',
    emoji: '💰', label: 'Benefactor',
    blurb: 'Any funding source is listed.',
    announcer: 'A funding source has been declared. Somewhere, a benefactor is watching your work with great interest. They expect results. No pressure. Reward: continued support, subject to a progress report.',
    rarity: 'uncommon', family: 'funding', visible: true, availability: 'live',
  },
  seed_funded: {
    key: 'seed_funded',
    emoji: '🌱', label: 'Seed Funded',
    blurb: 'Funded by the College Research Council.',
    announcer: "Funded by the College Research Council. The college planted a seed, and look: an abstract. The system has notified the gardeners. Reward: a starring line in next year's CRC impact report.",
    rarity: 'uncommon', family: 'funding', visible: true, availability: 'live',
  },

  // --- Attendance -----------------------------------------------------------
  first_timer: {
    key: 'first_timer',
    emoji: '✨', label: 'First-Timer',
    blurb: 'First time presenting at CVMBS Research Day.',
    announcer: 'Welcome to Research Day. Please keep your poster tubes inside the vehicle at all times.',
    rarity: 'common', family: 'attendance', visible: true, availability: 'live',
  },
  veteran_3: {
    key: 'veteran_3',
    emoji: '🛡️', label: '3-Year Veteran',
    blurb: 'Has presented at 2 or 3 prior Research Days.',
    announcer: "You've presented before and you came back. We respect that. We're also slightly concerned.",
    rarity: 'rare', family: 'attendance', visible: true, availability: 'live',
  },
  veteran_5: {
    key: 'veteran_5',
    emoji: '🏆', label: '5-Year Veteran',
    blurb: 'Has presented at 4+ prior Research Days.',
    announcer: 'Five Research Days. You have outlasted committees, software platforms and at least one poster printer. The system grants you Elder status. Reward: you may now say "back in my day" at the poster session. Once per hour.',
    rarity: 'legendary', family: 'attendance', visible: true, availability: 'live',
  },

  // --- Day-of ---------------------------------------------------------------
  certified_judgy: {
    key: 'certified_judgy',
    emoji: '⚖️', label: 'Certified Judgy',
    blurb: 'Signed up as a judge.',
    announcer: 'You volunteered to judge. Your clipboard has been blessed. Please judge fairly, if mercilessly.',
    rarity: 'rare', family: 'day_of', visible: true, availability: 'phase2',
  },
  conversation_starter: {
    key: 'conversation_starter',
    emoji: '💬', label: 'Conversation Starter',
    blurb: '3+ feedback comments approved as substantive.',
    announcer: 'You left feedback that said more than "great job." Growth!',
    rarity: 'rare', family: 'day_of', visible: true, availability: 'deferred',
  },
  peer_reviewed_pic: {
    key: 'peer_reviewed_pic',
    emoji: '📸', label: 'Peer Reviewed Pic',
    blurb: 'Uploaded a photo that moderators approved.',
    announcer: 'Your photo passed peer review. Two moderators looked at it and neither asked for revisions. A first in academic history. Reward: your face on the big screen, possibly mid-blink.',
    rarity: 'uncommon', family: 'day_of', visible: true, availability: 'deferred',
  },
  final_floor: {
    key: 'final_floor',
    emoji: '🎊', label: 'Final Floor',
    blurb: 'Scanned the QR code at the start of the awards ceremony.',
    announcer: 'You stayed for the awards ceremony. Most attendees vanish when the last poster comes down. You made it to the final floor. Reward: knowing who won half a second before everyone else checks their phone.',
    rarity: 'uncommon', family: 'day_of', visible: true, availability: 'deferred',
  },
  present_and_accounted_for: {
    key: 'present_and_accounted_for',
    emoji: '✅', label: 'Present and Accounted For',
    blurb: 'Presented and was not marked a no-show.',
    announcer: 'You showed up and presented. Statistically, that is most of the battle. Reward: your guild bar now officially counts you.',
    rarity: 'common', family: 'day_of', visible: true, availability: 'deferred',
  },
}

/** Flat ordered list, used for rendering the catalog on /achievements. */
export const ACHIEVEMENT_LIST: Achievement[] = Object.values(ACHIEVEMENTS)

export const RARITY_ORDER: Record<Rarity, number> = {
  legendary: 0,
  rare: 1,
  uncommon: 2,
  common: 3,
}

export const FAMILY_LABELS: Record<AchievementFamily, string> = {
  timing: 'When you submit',
  content: 'What you study',
  boss: 'Boss battles',
  authors: 'Author list',
  green_labs: 'Green Labs',
  affiliations: 'Affiliations',
  funding: 'Funding',
  attendance: 'Times attended',
  day_of: 'Day of',
}

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
}
