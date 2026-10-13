# Leaderboard handoff — Oct 12, 2026 (post-session, pre-comms)

**Read this first when resuming.** Picks up where the Oct 12 session
left off: 9 commits built, nothing pushed, Aimee going into the 3 pm
comms meeting with a local demo running.

---

## State of the world when you resume

- **Branch:** `main`, **9 commits ahead of `origin/main`**. Nothing pushed.
- **Working tree:** clean.
- **Dev server:** was running at `localhost:3000` during the session; may
  have been stopped. Re-run `npm run dev` if needed.
- **Supabase prod DB:** all four Oct-12 migrations were applied by Aimee
  during the session, so prod schema matches `main`.
- **Vercel prod site (`researchday.vercel.app`):** still on `63ae7fd`.
  The leaderboard page out there is the old "Coming soon" stub.

### The 9 unpushed commits (bottom → top)

```
b086ad6  F4 — presenter_previous_rd_count on submit form
6c1b48a  F1 — leaderboard_config table + /admin/leaderboard page
b4e9691  F3+F5+F6 — phase shell + thermometer + Guild Showdown
fa575c8  F2+F7 — shared credit function + badge helpers + tsx tests
4811ced  Green Pipette card
39fdbb3  Guild Showdown: % of cohort + tied ranks + zero handling
d67ba7b  Thermometer: 5-level progress
379174f  System-voice typography + "Congratulations, RAMS!" easter egg
66816a7  Logged-in player card
```

Full build plan + rationale lives in each commit message. The committee
leaderboard doc is at `docs/Research_Day_2027_Leaderboard_Options_20261008.docx`
and the design brainstorm is `docs/Claude Chat brainstorm 12Oct2026.docx`
with mockup `docs/ClaudeChat_leaderboard_design.png`.

### Migrations run (prod + the SQL files in this branch)

1. `2026-10-12_presenter_previous_rd_count.sql`
2. `2026-10-12_leaderboard_config.sql`
3. `2026-10-12_leaderboard_green_pipette_flag.sql`
4. `2026-10-12_guild_cohorts.sql`

### What's visible on `/leaderboard` right now

- **Hero** — phase subheading in system-voice mono. Auto-refresh ticker.
- **Player card** (logged-in only) — avatar, name, guild pill, "Level N
  presenter · X of 5 achievements · N secret achievements remain", "Your
  next quest" box, achievement tiles (earned amber / locked `?`).
- **🌡️ Thermometer** — 5 levels, "N more to reach Level X · Next unlock"
  system-voice subline.
- **⚔️ Guild Showdown** — ranked by % of 2026 cohort. Ties show "T-N".
  Zero-count guilds appear in a muted "Waiting for a first entry" footer.
- **🌱 Green Pipette** — 4 CVMBS depts ranked by points (10 × certified
  authors, cap 100, × dept share from the F2 credit function).
- **How to earn points** — unchanged 3-column card.
- **Champions phase easter egg** — "Congratulations, RAMS!" with
  `title="Congratulations, crawlers!"` for a desktop-only hover reveal.

### Confirmed design calls (do not re-litigate)

1. **Mentor type.** `faculty_id IS NULL` = external for crediting.
2. **Presenter dept.** `submissions.department_id` only; no parsing of `program`.
3. **Guild mapping.** DVM-duals → DVM Guild, Resident-duals → Postdoc Guild,
   MD Student → Grad Guild. Faculty-labeled presenters are excluded.
4. **Guild race scoring.** % of each guild's 2026 cohort (not raw counts).
5. **"Research Staff Guild"** is the canonical name (not "Research
   Scientists and Staff Guild").
6. **Champions message.** Public reads "Congratulations, RAMS!" with
   the DCC original hidden in `title=` for hover-reveal fans.

---

## What to do first, after Aimee's comms meeting

Ask Aimee what the comms team said. Likely outcomes shape the next sprint:

- **If they liked the system-voice distinction** → start layering the
  easter eggs below. Low risk, no comms sign-off required for the hidden ones.
- **If they flagged specific wording** → make the edits to
  `src/lib/leaderboard/config.ts` (`phaseSubheading`) or the card copy
  before anything else.
- **If they want the leaderboard delayed/hidden until Nov 18** → flip the
  three `show_*` flags OFF in `/admin/leaderboard` (not a code change).
- **If they approved the demo as-is** → `git push` the 9 commits and
  Vercel auto-deploys to `researchday.vercel.app` within a minute. Confirm
  with Aimee before pushing (she asked to hold earlier).

---

## Backlog, prioritized

### Easter eggs — no comms dependency, cheap wins
From the Oct 12 brainstorm doc. Can land in any order; most are hours each.

- **Secret achievements** (lives in `src/lib/leaderboard/badges.ts` + player card):
  Night Owl (submitted 00:00–04:00), Photo Finish (submitted in the last
  hour), Full Party (listed max 3 mentors), Royal Approval (abstract text
  mentions cats/feline research). Each needs a `computeSecretBadges` helper
  and a `secretsFound` count on the player card (today hardcoded to 0).
  The counter already shows "N secret achievements remain" when secrets > 0.
- **Celestial Box** tier at 10+ mentees for the Platinum award — hidden
  from the UI until someone hits it. Lands when the Platinum card is built.
- **Konami code announcer mode** — client component wraps the whole
  /leaderboard; `↑↑↓↓←→←→BA` keystroke toggles a flag in `localStorage`
  that rewrites all CSU-voice copy with announcer alternates (lives in a
  parallel map in `config.ts`).
- **Custom 404 page** — `src/app/not-found.tsx` with "You've wandered off
  the map. Find the stairwell."
- **Deadline countdown hover** — "Drafts due in N days" (plain) with
  `title="This floor collapses in N days"` (fan).

### Nov 18 features — need the shared F2 credit function (already shipped)

- **Platinum Mentoring Top 10** — count distinct submissions per
  faculty mentor; sort; Bronze/Silver/Platinum tier badges per the doc.
  Celestial Box as the hidden 10+ tier.
- **Dept Turnout** — presenter count per dept, using F2 credit for crediting.
- **Clipboard Cup** — judge sign-up count per dept, reads
  `judge_registrations`. Flip to drop a judge if they withdraw.
- **Affiliation Showdown** — ranked bars by affiliation checkbox selected
  on submit; filter chips per affiliation category.
- **Training Grant Throwdown** — % of grant's trainees presenting; "Full
  Squad" bonus at 100%. Needs a trainee-roster CSV import first.
- **Badge pop-ups** — client-side `localStorage` tracker that pops a
  banner for each newly-earned badge on login. Needs comms-approved copy
  (the "NEW ACHIEVEMENT! Early Bird 🐣: ..." lines in the doc).

### Jan 23 event-day — comms-blocked

- **Big-screen mode** at `/leaderboard?screen=big`.
- **Conversation Starter (feedback)** — needs the committee's moderator
  workflow decision.
- **Peer Reviewed Pic (photos)** — committee flagged feasibility testing;
  comms needs to call storage limits + display sizes.
- **Moments feed** — comms decides whether to auto-generate or author
  manually. If auto: a cron job or Supabase trigger produces lines when
  the leaderboard state crosses specified thresholds.
- **Golden Pipette** batch publish admin UI — Jan 23 only, so no rush.

---

## Known gaps worth remembering

- **Name-only cert matching.** The 151 MGL CSV ambassadors have no email.
  Green Pipette can't match them to coauthors by profile_id/email alone.
  Workflow: committee reviewer uses `/admin/names` to canonicalize spellings,
  then the match fires. Nothing automatic yet.
- **The three legacy booleans** (`profiles.is_green_labs_ambassador`,
  `faculty.my_green_labs_certified`, `faculty.green_paw_certified`) are
  still in the schema but unused. Can be dropped in a cleanup pass.
- **Secret achievements** shipped Oct 13, 2026 (commit `42b1830`):
  Night Owl, Photo Finish, Full Party, Royal Approval. `SECRETS_TOTAL`
  now derives from `Object.keys(SECRET_BADGES).length` in
  `src/lib/leaderboard/badges.ts` so adding a fifth secret updates
  the counter automatically. Tests at `npm run test:secret-badges`.

---

## Operational notes

- `npm run test:credit` — runs the 8-case test harness for the shared
  F2 department-credit function.
- Admin can edit every leaderboard knob at `/admin/leaderboard` without
  a code deploy. Three feature flags, five phase dates, three thermometer
  values, five guild cohorts, ambassador cap, split mode.
- `/admin/leaderboard` is admin-only (not committee_member) — platform
  knobs vs. content review.

Everything else about resuming on this project is in `CLAUDE.md`'s
"Progress & Next Steps" section.
