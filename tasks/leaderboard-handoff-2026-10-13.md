# Leaderboard handoff — Oct 13, 2026 (end of session)

**Read this first when resuming.** Picks up where the Oct 12 handoff
(`leaderboard-handoff-2026-10-12.md`) left off. Everything from Oct 13 is
pushed to `origin/main` and live on `researchday.vercel.app`.

---

## State of the world when you resume

- **Branch:** `main`, up to date with `origin/main`. Working tree clean.
- **Vercel prod site:** deployed through `8a6783b`.
- **Supabase prod DB:** all Oct-13 migrations applied by Aimee during the session.
- **No open PRs, no feature branches, nothing half-finished.**

### What landed on Oct 13 (newest → oldest)

```
8a6783b  Leaderboard: Department Turnout
69dc098  Platinum: phase-driven counting (drafts mode pre-finalize)
5f6b3fc  Leaderboard: Platinum Mentoring Top 10
fdb2075  Docs: strip legacy anon JWT from CLAUDE.md after key rotation
22c83b4  Deps: bump Next to 16.4.0 + pin fast-glob transitive to 3.3.3
028f3fd  Supabase: swap to publishable + named secret keys
7209a21  Docs: mark secret achievements as shipped in Oct 12 handoff
42b1830  Leaderboard: four secret achievements (Night Owl, Photo Finish, Full Party, Royal Approval)
```

### Big-picture changes this session

1. **Secret achievements** — Night Owl / Photo Finish / Full Party /
   Royal Approval. Pure compute in `src/lib/leaderboard/badges.ts`,
   wired through `getPlayerCardData`, revealed as purple-tinted tiles on
   the player card. 26 passing tests at `npm run test:secret-badges`.

2. **Supabase key rotation** — switched to the new `sb_publishable_*`
   and `sb_secret_*` key system. Legacy anon JWT + service_role JWT fully
   decommissioned (code, Vercel env, local env, Supabase side). All four
   client helpers in `src/lib/supabase/` now read the new env var names.

3. **Next 16.3.6 → 16.4.0** — closed 6 of 8 Dependabot CVEs including
   Draft Mode leak, SSG/ISR cache poisoning (two separate), SSRF in Image
   Optimization, and more. Remaining 2 (`sharp` librsvg, `source-map-js`)
   have no upstream fix yet; dev-time braces/micromatch chain also has
   no fix available. Added `overrides.fast-glob = ^3.3.3` to force the
   dev-time chain onto latest versions.

4. **Platinum Mentoring Top 10** — new card at `/leaderboard`. Ranks
   CVMBS-roster faculty by distinct mentee abstracts, with loot-box
   tier badges per the committee doc:
   - 🥉 Bronze Box    (3 mentees)
   - 🥈 Silver Box    (5)
   - 💎 Platinum Box  (8+)
   - 🎁 Celestial Box (10+, hidden easter egg — not in legend until
     someone unlocks it)

   Tier function has its own test harness at `npm run test:platinum-tiers`.

5. **Department Turnout** — new card at `/leaderboard`, ranks the 4
   CVMBS depts by weighted presenter count using the F2 credit function
   (same split as Green Pipette).

6. **Three-stage counting lifecycle** — standardized across all
   leaderboard cards:
   - **Stage 1 (drafts mode):** pre-`finalize_deadline_at` (Jan 4) —
     count draft + submitted + finalized. Already how the thermometer
     and Guild Showdown worked; now Platinum Mentoring and Dept Turnout
     match the pattern too.
   - **Stage 2 (finals mode):** post-`finalize_deadline_at` — finalized
     only. Transition is automatic from the Event row's date.
   - **Stage 3 (no-shows removed):** post-event — needs a
     `submissions.no_show_at` column + admin "mark as no-show" button
     on `/admin/abstracts/[id]`. **Not built yet** — lands closer to
     Jan 23. All four phase-driven cards (thermometer, guild, platinum,
     dept turnout) will need to filter on `no_show_at IS NULL` when it
     exists; Green Pipette and future cards should too.

### Admin controls shipped this session

New feature flags on `leaderboard_config`, editable at `/admin/leaderboard`:
- `show_platinum_mentoring` (default TRUE)
- `show_dept_turnout` (default TRUE)

### Migrations applied this session (in order)

1. `2026-10-13_platinum_mentoring_flag.sql`
2. `2026-10-13_dept_turnout_flag.sql`

### Committee doc update — Aimee to apply

Aimee planned to paste the following into the committee leaderboard doc
(`docs/Research_Day_2027_Leaderboard_Options_20261008.docx`) under any of
the item sections (or as a shared appendix):

> **How counts update across the Research Day lifecycle**
>
> Every leaderboard card (Submission Thermometer, Guild Showdown, Green
> Pipette, Platinum Mentoring Top 10, Dept Turnout, and the Nov 18 cards
> still to come) uses the same three-stage rule for what counts:
>
> 1. **Drafts mode — now through the Jan 4 finalize deadline.** Every
>    abstract counts the moment someone starts a draft (and keeps counting
>    through "submitted" and "finalized"). Counts drafts because visibility
>    while abstracts are in-progress nudges mentors to recruit more mentees
>    before submission closes.
>
> 2. **Finals mode — Jan 4 onward.** Only finalized abstracts count.
>    Drafts that never crossed the finish line stop inflating totals.
>    Counts settle for the sealed-results and awards phases.
>
> 3. **No-shows removed — after the event on Jan 23.** Finalized abstracts
>    whose presenter didn't actually present are flagged by committee
>    review and dropped from the totals. Final tier badges are stamped
>    from this post-event number and are what gets presented at awards.
>
> Transitions are automatic — driven by the Event row's dates in Supabase,
> not a manual flip.

---

## Backlog, prioritized

### Nov 18 features still to build

In order of complexity (easiest first):

- **Clipboard Cup** — judge sign-up count per dept, reads
  `judge_registrations`. Check first if `judge_registrations` has a
  dept link (via profile or faculty email → dept). May need a schema
  tweak or just join logic.
- **Affiliation Showdown** — ranked bars by affiliation checkbox
  selected on submit. Reads `submissions.affiliations` (TEXT[]). Group
  by affiliation key; sort/filter chips per affiliation category (the
  5 groups: Center, Institute, Laboratory, Program, Training Grant).
- **Training Grant Throwdown** — % of grant's trainees presenting;
  "Full Squad" bonus at 100%. **Blocked** on a trainee-roster CSV
  import first — Aimee needs to collect per-grant trainee lists.
- **Badge pop-ups** — client-side `localStorage` tracker that pops a
  banner for each newly-earned badge on login. Needs comms-approved
  copy ("NEW ACHIEVEMENT! Early Bird 🐣: ..." style).

### Stage-3 (no-shows) feature

Owns its own mini-epic closer to Jan 23:
- Migration: add `submissions.no_show_at TIMESTAMPTZ NULL`
- Admin UI: "Mark as no-show" button on `/admin/abstracts/[id]` (and
  probably a bulk toggle at `/admin/abstracts`). Admin-only, writes
  `no_show_at = NOW()`.
- Update all phase-driven fetchers to filter `no_show_at IS NULL` when
  current time is past event start (`events.event_date` or
  `leaderboard_config.event_starts_at`).

### Jan 23 event-day features — comms-blocked (unchanged from Oct 12)

Big-screen mode, Conversation Starter (feedback), Peer Reviewed Pic
(photos), Moments feed, Golden Pipette batch publish admin UI. The
photo project is tabled per Oct 13 — comms couldn't confirm display
hardware. Big-screen mode could ship without comms if we want.

### Easter-egg follow-ups (no comms dependency)

Still open from the Oct 12 brainstorm:
- Konami code announcer mode (↑↑↓↓←→←→BA to toggle a `localStorage`
  flag that rewrites CSU-voice copy with announcer alternates)
- Custom 404 page (`src/app/not-found.tsx`)
- Deadline countdown hover ("Drafts due in N days" with a hidden
  `title=` alternate for fans)

---

## Known gaps worth remembering

- **Name-only cert matching** (unchanged from Oct 12 handoff). 151 MGL
  CSV ambassadors have no email. Green Pipette can't auto-match them;
  committee reviewers use `/admin/names` to canonicalize spellings.

- **The three legacy booleans** (`profiles.is_green_labs_ambassador`,
  `faculty.my_green_labs_certified`, `faculty.green_paw_certified`)
  are still in the schema but unused. Can be dropped in a cleanup pass.

- **Platinum Mentoring tier total** — `SECRETS_TOTAL` in
  `src/lib/leaderboard/badges.ts` now derives from
  `Object.keys(SECRET_BADGES).length`. The equivalent `PLATINUM_TIER_META`
  in `src/lib/leaderboard/platinum.ts` is a static object — adding a new
  tier would need admin-UI legend logic to update too.

- **Dependabot** — down to 2 open advisories after this session (`sharp`
  librsvg + `source-map-js` DoS). Both have no upstream patch yet; both
  are low practical risk for our usage pattern. Check back monthly.

---

## Operational notes

- Test harnesses:
  - `npm run test:credit` — F2 department-credit function (8 cases)
  - `npm run test:secret-badges` — four secrets, incl. DST + edge cases (26 cases)
  - `npm run test:platinum-tiers` — tier boundaries (13 cases)
- Admin editing: `/admin/leaderboard` is admin-only (not committee_member).
- Supabase key convention: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for
  the browser, `researchday_secret_key` (lowercase per Supabase's naming
  rule) for the server-only secret. `src/lib/supabase/*.ts` reads these.
- Direct-to-main pushes are the norm for this project. Push protections
  will prompt for approval the first time per session.

Everything else about this project is in `CLAUDE.md`.
