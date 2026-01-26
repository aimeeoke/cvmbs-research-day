# CVMBS Research Day Platform

A unified conference management platform for Colorado State University's College of Veterinary Medicine and Biomedical Sciences Research Day.

**Target Event:** Research Day 2027 (V1 was used for 2026, which concluded successfully)

---

## Progress & Next Steps

### Completed (January 25, 2026)
- [x] Project initialized with Next.js 14 + TypeScript + Tailwind
- [x] shadcn/ui components installed (14 components)
- [x] Supabase project created (CVMBS-Research-Day)
- [x] Database schema deployed (9 tables with RLS policies)
- [x] Supabase connection tested and working
- [x] Pushed to GitHub

### Next Session: Authentication
- [ ] Build magic link login page
- [ ] Create auth callback handler
- [ ] Add profile completion flow (first-time users)
- [ ] Test login/logout flow

### Future Phases
- [ ] Create 2027 event in database
- [ ] Build submission system
- [ ] Build judge registration
- [ ] Port scoring logic from V1

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
