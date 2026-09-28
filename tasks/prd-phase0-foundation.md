# PRD: Phase 0 — Application Foundation

_Reconciled Sep 28, 2026. **This phase is complete.** All Phase 0 scope shipped in the Sep 23–28 rebuild and is live at `researchday.vercel.app`._

The scope originally covered in this document — auth (OTP), sidebar layout, profile management with role-based access, and scaffolded routes for future features — is now the working codebase. The historical scope sketch is preserved as `prd-phase0-foundation.docx` in this folder.

## Active work

Continues in [`prd-cvmbs-research-day.md`](./prd-cvmbs-research-day.md), which reflects the current state and priority backlog.

## What Phase 0 actually shipped

- ✅ Supabase project + schema (`supabase/schema.sql` V2, multi-role, multi-year, RLS end-to-end)
- ✅ 4 CVMBS departments seeded; 2027 event seeded and marked active
- ✅ 252 CVMBS faculty loaded via `scripts/load-faculty.mjs` from `docs/CVMBS-Faculty.csv`
- ✅ Email OTP auth via Supabase (both Magic Link and Confirm Signup templates customized for the code-based UX)
- ✅ Signup flow with faculty email validation (`first.last@colostate.edu`) vs. general presenter/trainee/non-faculty
- ✅ Sidebar layout (public / auth / admin / utility nav sections)
- ✅ Public routes (no account required): `/` · `/about` · `/schedule` · `/winners-2026` + Guidelines PDF link
- ✅ Authenticated routes: `/abstracts` · `/submit` · `/judge` · `/settings`
- ✅ Multi-role user model (`user_roles` M2M): submitter · mentor · judge · admin · volunteer
- ✅ Role-request queue (`role_requests` table + `/settings` form)
- ✅ `.env.local` + Vercel prod env vars wired
- ✅ Vercel deploy: `researchday.vercel.app`

**Divergences from the docx sketch that are worth remembering:**
- Auth landed as **OTP code** rather than deep-link magic link. Multi-browser signup works more reliably that way.
- Sidebar was chosen over top nav for CRC-style density.
- Signup captures first + last name (not full name); trigger sets `full_name` from those.
