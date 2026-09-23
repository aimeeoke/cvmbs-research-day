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

### Tomorrow's session (Sep 24)
- [ ] Author enhancements:
  - [ ] Capture Green Labs Ambassador status *per author* on the submission form
        (not just faculty — includes students).
  - [ ] Admin name-canonicalization: fix student misspellings / nicknames on the
        backend so points attribute correctly.
- [ ] Convert `affiliations` from free text to a multi-select dropdown backed by
      an admin-managed list.
- [ ] "Abstract Instructions" doc / on-page guidance for submitters.
- [ ] Real 2027 schedule → `src/lib/schedule.ts`.
- [ ] Load faculty CSV (and possibly postdocs) → `faculty` table with departments.
- [ ] Real 2027 About-page copy → `src/app/about/page.tsx`.

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
