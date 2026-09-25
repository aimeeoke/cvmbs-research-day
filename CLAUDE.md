# CVMBS Research Day Platform

A unified conference management platform for Colorado State University's College of Veterinary Medicine and Biomedical Sciences Research Day.

**Target Event:** Research Day 2027 (V1 was used for 2026, which concluded successfully)

---

## Progress & Next Steps

### Completed (Sep 23, 2026 rebuild for Monday go-live)
- [x] Project initialized with Next.js 16 + TypeScript + Tailwind
- [x] shadcn/ui components installed
- [x] Supabase project created (CVMBS-Research-Day)
- [x] **Schema rewritten** for multi-role + Green Labs (v2 in `supabase/schema.sql`)
      — departments, faculty, profiles, user_roles (M2M), events, submissions,
        submission_authors. 4 CVMBS departments and 2027 event pre-seeded.
- [x] Auth ported from CRC (login page, OTP + password, auth callback, signout)
- [x] Root layout with CSU-branded top nav (Schedule, About, Submit)
- [x] Public /schedule page (draft 2027 timeline)
- [x] Public /about page (placeholder for 2027 copy)
- [x] /submit page with draft → submitted → finalized workflow
      and faculty autocomplete in the author list
- [x] Landing page with deadlines + my-submission card

### Setup done (Sep 23, 2026)
- [x] Ran `supabase/schema.sql` in Supabase SQL editor.
- [x] Set event dates (Nov 16, 2026 close · Jan 4, 2027 finalize; both 11:59pm MST).
- [x] Configured Resend SMTP + email-code template (login working end-to-end).

### Completed (Sep 24, 2026 — sidebar + multi-audience site)
- [x] **Sidebar refactor.** Top nav replaced with a CRC-style persistent sidebar.
      All pages moved into `src/app/(app)/` route group; `/login` and `/signup`
      stay full-screen. Nav config lives in `src/lib/nav.ts`
      (public + auth + admin + utility sections). Dead `site-header.tsx` deleted.
- [x] **Signup flow.** New `/signup` page: captures first + last name, radio for
      "Presenter/trainee/non-faculty judge" (any email) vs "CVMBS Faculty"
      (must be `first.last@colostate.edu` — validated with `src/lib/email.ts`).
      OTP metadata written to `profiles.first_name` / `last_name` / `full_name`
      via `handle_new_user` trigger. Login page normalizes emails to lowercase
      and links to `/signup`. Migration `2026-09-24_first_last_name.sql` applied.
- [x] **Schema tweaks (migration `2026-09-24_schema_tweaks.sql` applied).**
      Dropped `UNIQUE (event_id, submitter_id)` on submissions so proxies can
      hold multiple drafts. Added `submission_authors.email` (identity for the
      one-per-presenter rule + auto-linking after signup). New RLS helper
      `current_user_can_access_submission()` gives read/write to submitter,
      presenter (profile_id or email match), mentor (profile_id or via
      `faculty.profile_id`), and admin. Added `judge_registrations` and
      `role_requests` tables with RLS.
- [x] **Abstract Portal.** `/abstracts` is now the list view: presenter first
      + last, title, status, "my role" (Submitter / Mentor / Presenter),
      Edit/View link. "New submission" button calls a server action that
      creates a draft and redirects to `/submit?id=…`. Prominent
      one-presenter-per-abstract instructions.
- [x] **Submit form.** `/submit` now takes `?id=…` (no id → redirect to portal).
      Ownership check replaced with RLS. Presenter row exposes a required
      email field. Server enforces "presenter already submitted for this event"
      at `submitDraft`/`finalize` time with a clear error message. Mentor
      editors get a blue "you're editing as mentor/presenter" banner.
- [x] **Judge sign-up.** `/judge` form with eligibility radio (faculty /
      advanced trainee / early trainee / undergrad). Format checkboxes are
      gated by eligibility: faculty=all, advanced=posters, early=undergrad
      poster only, undergrad=blocked. Time slots + conflicts + view / edit /
      cancel / reactivate flow. Time slot labels are placeholders — replace
      once `src/lib/schedule.ts` has the 2027 schedule.

### Completed (Sep 25, 2026 — content polish + form iteration + email fix)
- [x] **Home page.** Added Translational Medicine Institute venue line and
      static "Saturday, January 23, 2027" fallback if `events.event_date`
      isn't set.
- [x] **About page.** Merged the 9 committee names inline (Popichak,
      Bobadilla, Lee, Tang, Janke, Lombard, Oke, Selwyn, Stevenson),
      removed the "copy being finalized" banner, deleted the standalone
      `/committee` route + sidebar link.
- [x] **Schedule.** Dr. Adam Harris named as keynote; awards ceremony
      extended to 5:00 – 6:00 pm.
- [x] **Submit form iteration.**
  - Research stage now has the definition hint from the PRD 9/15 update:
    Early = undergrad / post-bacc / grad or resident with ≤2 yrs in
    program; Advanced = completed prelims and/or >2 yrs research
    experience.
  - New optional **Program** free-text field for presenters not in a
    CVMBS department (undergrads, cross-college programs). Department is
    now optional; server-side validation requires *at least one* of
    department or program.
  - Session preference options rewritten with schedule times:
    Undergraduate poster (10:15–11:15) · Early (11:30–1:30) ·
    Late (1:45–3:45) · No preference.
  - Author role checkboxes replaced with 3-option radio
    (**Author / Presenter / Mentor**); name field now labelled
    "Full name (as it should appear in the program)" with middle-initial
    hint.
  - Top yellow banner adds oral caution: "only 32 oral slots · people
    who haven't previously presented orally are prioritized."
- [x] **Judge form rewrite.** Replaced eligibility radio with a **Role**
      dropdown (14 options incl. dual-degree DVM trainees). Eligibility is
      auto-derived: Faculty → faculty; Research Staff / Postdoc →
      advanced; DVM / MS / Post-bacc / DVM-MS / DVM-MPH / DVM-MBA → early;
      Resident / Resident-PhD / PhD student / DVM-PhD show a manual
      Early-vs-Advanced picker; Undergraduate is blocked. Time slots now
      use the real schedule slots (10:15–11:15, 11:30–1:30, 1:45–3:45).
      Role id round-trips through the existing `detailed_role` column.
- [x] **Email troubleshooting (documented).** New signups fell back to
      Supabase's default "Confirm signup" template (which uses the link).
      Fix: edit that template body in Supabase Dashboard → Auth → Templates
      to mirror the Magic Link one using `{{ .Token }}`. Both must be
      customized for OTP-code UX end-to-end.

### Next session — resume here
- [ ] **Waiting on user for:** the Abstract Guidelines document and
      the finalized About page copy. Both were flagged Sep 25 as
      still pending from Aimee's side.
- [ ] **Reconcile the PRD.** The markdown PRDs in `tasks/` are stale;
      only the `.docx` version has the 9/15 updates. And the Sep 23–25
      build has diverged from the original vision in several ways (the
      submit form landed cleaner than the PRD sketch). PRD needs a
      pass before it can be trusted again.
- [ ] **Finish browser testing** of the Sep 24 + Sep 25 changes. Only
      Aimee's own profile exists so far, so multi-user scenarios (mentor
      access via faculty.profile_id, presenter opens someone else's
      submission, auto-linking on signup, cross-submitter presenter
      uniqueness) are all deferred until testers are recruited. Test
      plan lives in the Sep 25 chat transcript.
- [ ] Update Supabase **Confirm signup** template (Auth → Templates)
      to mirror the Magic Link one so new signups get the OTP code
      instead of the default link, then re-verify signup on a fresh
      email.
- [ ] **Task 6 — Settings.** Password set/change + role-request form that
      writes to the `role_requests` table.
- [ ] **Task 7 — Public content.** Populate `/winners-2026` (from
      vetmedbiosci page). `/about` and `/committee` (merged) are done.
- [ ] **Task 8 — Faculty CSV loader.** `CVMBS-Faculty.csv` is at repo
      root. Normalize: title-case first names, lowercase emails, upsert
      into `faculty` with `department_id` matched from the CSV. Blocks
      the author autocomplete from being useful.
- [ ] Author enhancements (deferred):
  - [ ] Capture Green Labs Ambassador status *per author* on the submit form.
  - [ ] Admin name-canonicalization for student misspellings.
- [ ] Convert `affiliations` from free text to multi-select from an
      admin-managed list.
- [ ] "Abstract Instructions" doc / on-page guidance for submitters.

### Migrations applied (in order)
1. `supabase/schema.sql` — Sep 23, 2026 (initial V2 schema)
2. `supabase/migrations/2026-09-24_first_last_name.sql` — first_name/last_name + trigger update
3. `supabase/migrations/2026-09-24_schema_tweaks.sql` — multi-draft, author email, RLS helper, judge_registrations, role_requests
4. `supabase/migrations/2026-09-25_form_updates.sql` — Sep 25, 2026 — presenter program column + widened session_preference CHECK

### Deploy (when ready)
- [ ] Bootstrap the admin role once signed in (see SQL above under
      "Also worth running").
- [ ] Deploy to Vercel with custom domain `researchday.vercel.app`.
- [ ] Add production URL to Supabase Auth → URL Configuration redirect list.

### After go-live
- [ ] Sponsors tab (data model + page)
- [ ] Judge signup flow
- [ ] Assignment tools
- [ ] Port scoring portal from research-day-scoring V1
- [ ] Live leaderboard, photo gallery, gamification (Phase 2)

---

## Project Overview

This is V2 of the Research Day system, combining:
- Abstract submission system (replaces MS Forms)
- Judge registration and assignment
- Real-time scoring during the event
- Public conference site (schedule, abstracts, sponsors)

## Repository Info
- Remote: https://github.com/aimeeoke/cvmbs-research-day
- Push using email: aimeeoke@gmail.com

## Supabase Configuration
- **Project Name:** CVMBS-Research-Day
- **Project ID:** nsdiwpykofypspebywki
- **URL:** https://nsdiwpykofypspebywki.supabase.co
- **Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZGl3cHlrb2Z5cHNwZWJ5d2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNzUxMjgsImV4cCI6MjA4NDk1MTEyOH0.DZXpQsFeSMDrPTlatn9ookOGS46oqh40RHHvDq_SboA
- **Dashboard:** https://supabase.com/dashboard/project/nsdiwpykofypspebywki

## Deployment
- **Vercel:** Not yet configured
- **Production URL:** TBD

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (magic links)
- **Deployment:** Vercel

## Key Decisions

### Submission Deadlines
- **New submissions:** Close early December (to plan logistics)
- **Edits to existing:** Allowed until January 10th (~2 weeks before event)

### Data Management
- Fresh data each year (no historical migration)
- Export to static file for proceedings/archive after event

### Architecture
- Database is source of truth (no hardcoded data)
- Admin UI for all data changes (no code deploys for data)
- Soft delete with full history preservation
- Year-over-year reusable configuration

## Database

Schema is in `supabase/schema.sql`. Key tables:
- `events` - Multi-year event support
- `profiles` - User accounts (extends Supabase auth)
- `submissions` - Abstract submissions with status workflow
- `judge_registrations` - Judge signup with availability/conflicts
- `judge_assignments` - Who judges whom
- `scores` - Scoring data with weighted criteria

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── supabase/          # Supabase client setup
│   └── types/             # TypeScript type definitions
└── middleware.ts          # Auth middleware
```

## Related Documentation
- See `ARCHITECTURE-V2.md` in the research-day-scoring repo for full architecture plan

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
