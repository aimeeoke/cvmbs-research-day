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

### Tomorrow's session (Sep 25) — resume here
- [ ] **Test everything from Sep 24 in the browser.** Migration is applied
      but nothing UI-tested yet. See test plan in the chat transcript (signup,
      abstract portal proxy access, presenter-uniqueness enforcement, judge
      eligibility gating). Existing profile rows may need
      `UPDATE profiles SET email = LOWER(email);` if any test users have
      mixed-case emails — the RLS helper does a lowercase compare.
- [ ] **Task 6 — Settings.** Password set/change + role-request form that
      writes to the new `role_requests` table (DB-backed queue, not email).
- [ ] **Task 7 — Public content.** Populate `/about` (awards info coming
      via email from user), `/winners-2026` (from vetmedbiosci page), and
      `/committee` (already stubbed with 9 names — may just need styling).
- [ ] **Task 8 — Faculty CSV loader.** `CVMBS-Faculty.csv` is at the repo
      root. Need a one-off script that normalizes: title-case first names
      that arrived lowercase, lowercase all emails, then upserts into the
      `faculty` table with `department_id` matched from the CSV.
- [ ] **Task 9 — 2027 schedule.** Same as 2026 with keynote replaced by
      **Dr. Adam Harris**. Update `src/lib/schedule.ts` and then swap the
      placeholder time-slot labels in `src/app/(app)/judge/page.tsx`.
- [ ] Author enhancements (deferred from earlier list):
  - [ ] Capture Green Labs Ambassador status *per author* on the submission form.
  - [ ] Admin name-canonicalization for student misspellings.
- [ ] Convert `affiliations` from free text to multi-select from an
      admin-managed list.
- [ ] "Abstract Instructions" doc / on-page guidance for submitters.

### Migrations applied (in order)
1. `supabase/schema.sql` — Sep 23, 2026 (initial V2 schema)
2. `supabase/migrations/2026-09-24_first_last_name.sql` — first_name/last_name + trigger update
3. `supabase/migrations/2026-09-24_schema_tweaks.sql` — multi-draft, author email, RLS helper, judge_registrations, role_requests

### Deploy (when ready)
- [ ] Bootstrap the admin role once signed in: `INSERT INTO user_roles (user_id,
      role) SELECT id, 'admin' FROM profiles WHERE email = 'aimeeoke@colostate.edu'
      ON CONFLICT DO NOTHING;`
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
