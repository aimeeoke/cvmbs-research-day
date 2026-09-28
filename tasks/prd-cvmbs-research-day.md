# PRD: CVMBS Research Day Platform

_Reconciled Sep 28, 2026 · target event: **CVMBS Research Day 2027** (Sat Jan 23, 2027)._

---

## Purpose

A single web platform managing the full lifecycle of Colorado State University's College of Veterinary Medicine and Biomedical Sciences (CVMBS) annual Research Day: abstract submission → judge signup → oral/poster assignment → event-day scoring & check-in → results & awards.

Replaces a patchwork of MS Forms, spreadsheets, and V1's scoring-only app with one unified system. V1 shipped for the 2026 event (successful); V2 is a full rewrite for 2027 and forward.

**Live site:** `researchday.vercel.app`
**Repo:** `C:\Users\abuelow\Documents\Github\cvmbs-research-day`
**Supabase project:** `CVMBS-Research-Day` (`nsdiwpykofypspebywki`)

## Status Legend

| Marker | Meaning |
| --- | --- |
| ✅ | Shipped and live |
| 🟡 | Partially shipped or in progress |
| ⬜ | Planned, not started (in active backlog) |
| 🔵 | Deferred until after 2027 event |
| ⚫ | Cut from scope (with note explaining why) |

**Historical source:** the .docx sibling of this file (`prd-cvmbs-research-day.docx`) contains the original scope + 9/15/26 updates and stays checked in for reference. This .md is the working PRD and diverges intentionally where design decisions have overtaken the original sketch.

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + Storage) — RLS enforced end-to-end
- Vercel (production hosting)

---

## Roles & Access

| Role | Description | Access |
| --- | --- | --- |
| **Admin** | Committee tech lead (Aimee). | Everything — event config, assignments, scoring config, results, exports |
| **Event Director** | Faculty committee leads. Non-technical. | 🔵 Read-only dashboards during the live event (post-launch) |
| **Judge** | Volunteers who score presentations. | ✅ Volunteer signup, conflicts, ⬜ scoring, ⬜ event-day check-in |
| **Presenter/Submitter/Mentor** | Anyone with an abstract role. | ✅ Draft/submit/finalize an abstract, view own portal, ⬜ event-day check-in, ⬜ scoring feedback (post-event) |
| **Volunteer** | Event helpers (set-up, sign-in tables, etc.) | ⬜ Sign-up form (9/15/26 addition — post-launch) |
| **Viewer** | Anyone, no account required. | ✅ Public landing page + schedule + about + 2026 winners + guidelines PDF |

Multi-role model: one profile can hold **submitter + mentor + judge + admin + volunteer** simultaneously via the `user_roles` M2M table.

**Auth:** email OTP (6-digit code) via Supabase Auth. Users pick "Presenter/trainee/non-faculty judge" (any email) vs "CVMBS Faculty" (must be `first.last@colostate.edu`) at signup. Password can be set later via `/settings`. Landed as OTP rather than magic-link per the docx's original ask — code-based UX handles multi-browser signup better than deep-linked emails.

---

## Phase 1: Pre-Event

### 1.1 Event Setup (Admin)

🟡 **Partially shipped.** DB schema supports multiple events; only the 2027 event is seeded and marked active. Admin UI to edit event config is not yet built — currently done directly in the Supabase SQL editor.

Configured via the `events` row:
- Name, event date, submission open/close, finalize deadline, timezone
- Departments (4 CVMBS departments seeded)
- Faculty roster (252 faculty loaded from `docs/CVMBS-Faculty.csv`)

**Sessions (finalized 9/15/26):**
- Undergraduate Poster Session: 10:15–11:15 am
- Poster Session 1 (odd numbers): 11:30 am – 1:30 pm
- Poster Session 2 (even numbers): 1:45 – 3:45 pm
- Oral Session 1A: 11:30 am – 1:30 pm
- Oral Session 1B: 11:30 am – 1:30 pm
- Oral Session 2A: 1:45 – 3:45 pm
- Oral Session 2B: 1:45 – 3:45 pm

Foundational/translational/clinical assignments are decided after submissions close, not at signup.

**Backlog for this section:** ⬜ `/admin/event` config UI · ⬜ schedule editor (currently a static file at `src/lib/schedule.ts`).

### 1.2 Abstract Submission (Presenters)

✅ **Shipped.** Substantially reorganized from the original sketch in Sep 25–28 iterations. Actual sections in order:

1. **Presenter** — name, email, classification, department **or** program, affiliations (multi-select picker from `docs/Affiliations.csv`)
2. **Mentors** — Faculty Mentor 1 (required, autocomplete against CVMBS faculty roster with "not listed" free-text fallback), Faculty Mentor 2 (optional, same), Other Mentor (optional, name + affiliation for non-faculty like grad students)
3. **Research classification** — type (Foundational · Translational · Veterinary Clinical · Social Sciences/Pedagogy) + stage (Early ≤2 years, Advanced completed prelims / >2 years)
4. **Title**
5. **Authors** — live comma-separated byline preview; presenter first → coauthors → Other Mentor → Faculty Mentor 2 → Faculty Mentor 1 (last position)
6. **Abstract** body (~250–500 words)
7. **Funding** acknowledgement
8. **Preferences** — presentation type · session · previously presented · previous format

**Portal flow:**
- `/abstracts` — list view of submissions the user can access (submitter/presenter/mentor), with role-picker on "New submission"
- Draft → Submitted → Finalized state machine; edits allowed until finalize deadline
- Submitters can delete their own drafts; submitted/finalized abstracts require admin approval on a withdrawal request
- One-abstract-per-presenter enforced by presenter email; conflict is caught at submit/finalize time with a clear error

**Divergences from docx sketch:**
- ⚫ Author list of "6 fields with add up to 20" was cut in favor of dedicated Presenter/Mentors/Coauthors sections. Cleaner UX, same coverage, and per-role slots let us auto-derive the byline.
- ⚫ Green Labs Ambassador flag per-author on the form is deferred (need to pre-load ambassador data first — see Phase 2.8).
- ⚫ Author role-first workflow was cut — turned out the presenter/mentor/coauthor split makes it unnecessary.
- ✅ Affiliations shipped as a grouped checkbox picker (Center · Institute · Laboratory · Program · Training Grant) from a CSV. Admin-managed list is deferred; edit `docs/Affiliations.csv` and re-run `scripts/load-affiliations.mjs` for now.
- ✅ Abstract Submission Guidelines PDF is hosted on Supabase Storage and linked from the landing page (`NEXT_PUBLIC_SUBMISSION_GUIDELINES_URL`).

**Still pending:**
- ⬜ Admin overview of all abstracts (see [Admin Backlog](#admin-backlog))
- 🔵 Proceedings PDF export (alphabetical by presenter last name)
- 🔵 Admin bulk assign oral vs poster + poster numbers
- 🔵 CSV email export (presenters / mentors / judges / volunteers)
- 🔵 Admin name-canonicalization tool (student misspellings)

### 1.3 Lab Builder (Admin)

🔵 **Deferred.** Groups presenters by shared mentor for judge conflict-of-interest matching. Since assignment tools are also deferred, this only becomes useful once we're building assignment UI.

### 1.4 Judge Volunteering

✅ **Shipped as `/judge`.** Iterated to a role-dropdown model (14 options including dual-degree DVM trainees) that auto-derives eligibility:
- **Faculty** → judges anything
- **Research Staff / Postdoc** → advanced (posters + orals-with-permission)
- **DVM / MS / Post-bacc / DVM-MS / DVM-MPH / DVM-MBA** → early trainee (posters only)
- **Resident / Resident-PhD / PhD student / DVM-PhD** → manual Early vs. Advanced picker
- **Undergraduate** → blocked (per PRD constraint)

Format checkbox gating enforces the "grad students only judge undergrad session unless advanced" rule from the docx.

Time slots use the real Sep 15 schedule (10:15–11:15, 11:30–1:30, 1:45–3:45). Conflict entry, view/edit/cancel/reactivate flow all shipped.

**Pending:**
- ⬜ Admin view of judge signups + confirmation-email tracking (9/15/26 note about confirming judges before assignments finalize)
- 🔵 Judge assignment tools (see Phase 1.5)

### 1.5 Assignment & Scheduling (Admin)

🔵 **Deferred until after submissions close.** The docx describes: oral/poster decisions per session, poster number assignment respecting session preferences, judge-to-presenter assignment with conflict enforcement, and schedule builder.

Nothing built yet — timeline is post-submission-close (mid-December 2026), pre-event (mid-January 2027).

### 1.6 Volunteer Sign-Up (9/15/26 addition)

🔵 **Deferred to post-launch.** Set-up, clean-up, moderators, sign-in tables, poster room assistants. Follows the same pattern as `/judge` but with volunteer roles instead.

### 1.7 Green Labs Leaderboard (Pre-Event)

🔵 **Deferred.** Aggregates pre-event Green Labs points per presenter/lab/department:
- +10 per MGL Ambassador certification (author)
- +100 per My Green Labs certified faculty lab
- +100 per Green Paw certified faculty lab

Data source: faculty flags already in DB (`my_green_labs_certified`, `green_paw_certified`); Ambassador flag per-author needs to be added.

_Naming note: the docx sometimes says "Green Pipette." Actual DB and UI use "My Green Labs" and "Green Paw" (the real program names)._

---

## Phase 2: Event Day

_All items in this phase are ⬜ / 🔵 — none built yet. Timeline: build during December 2026 / early January 2027, once assignment tools are in place._

### 2.1 Check-In

⬜ In-app check-in button for presenters and judges. Real-time roster on admin dashboard. No-show flagging.

### 2.2 Scoring Portal

⬜ Port from V1 (`research-day-scoring` repo). Judge picks presenter → rates 7 weighted criteria (1–5) → moves to next. Criteria + weights unchanged from V1:

| Criterion | Weight |
| --- | --- |
| Content: WHY | 4 |
| Content: WHAT/HOW | 5 |
| Content: Next Steps | 2 |
| Logical Flow | 3 |
| Preparedness | 2 |
| Verbal Communication | 2 |
| Visual Aids | 2 |

**9/15/26 addition:** feedback is submitted _separately_ from scores. Judges see two progress bars on their portal (scored + feedback-given), with admin reminders to close feedback even after the event.

LocalStorage cache for offline resilience (same pattern as V1).

### 2.3 Live Leaderboard

⬜ Real-time weighted-score ranking, filterable by category/session. Anonymized until admin toggles.

### 2.4 Schedule View

🟡 Static schedule page shipped (`/schedule`) as a placeholder for 2027. Needs the real oral/poster time-slot list once assignments are made.

### 2.5 Photo Gallery

⚫ **Likely cut.** 9/15/26 note: wasn't used in 2026; consider outsourcing to `picturesqr.com` ($39 one-time, 12 months) or `memento.com` ($5.99/month) instead of building. Recommend cut; revisit only if committee wants photo-voting integrated with in-app gamification.

### 2.6 Feedback

⬜ Any authenticated user can leave written feedback for any presenter. Not anonymous to admin. Presenter sees their feedback after event.

### 2.7 Gamification / Interaction Points

🔵 **Deferred to post-launch.** Points for sponsor visits, feedback, judging, photo uploads. Personal + event-wide leaderboard.

### 2.8 Green Labs Points (Event Day)

⬜ Aggregation + tie-in with awards. Tied to Phase 1.7's data.

**9/15/26 open questions to bring back to committee:**
- Award by department vs. by lab (Clinical Sciences has fewer physical labs than MIP — need equity)
- Cutoff date for inclusion

### 2.9 Platinum Mentoring Award (9/15/26 addition)

⬜ Award for mentor with the most presenters (breakdown: undergrad / PhD / DVM mentor). Calculated in advance from submitted authors data.

---

## Phase 3: Post-Event

### 3.1 Results & Awards

⬜ Category winners (1st/2nd/3rd) from weighted scores. All V1 award categories + Green Labs award + Platinum Mentoring. Admin can finalize/lock results before publishing.

**9/15/26 addition:** Awards MC view page — script + slides format for reading during the ceremony.

### 3.2 Admin Data & Export

⬜ Export all scores, feedback, submissions, participation. Year-over-year data lives in Supabase; one active event at a time.

---

## Admin Backlog

_This is the **active** section — features being built next, in priority order._

### 1. Role requests + withdrawals review (⬜ next up)

Single `/admin/requests` page with two lists:
- **Pending role requests** — from `role_requests` table. Grant / deny action. Grant creates the user_roles row; deny sets status.
- **Withdrawal requests** — submissions where `withdrawal_requested_at IS NOT NULL` and status is not yet `withdrawn`. Approve → set status to `withdrawn`; reject → clear the request timestamp.

Aggregate counts at the top: pending role requests · pending withdrawals.

### 2. Abstracts overview

`/admin/abstracts` page:
- **Aggregate counts:** total abstracts by status (draft / submitted / finalized / withdrawn), plus splits by department, research type, presentation preference, session preference
- **Filterable list:** search by title, presenter name, presenter email, mentor name; filter by status, department, session preference
- **Click-in read-only view:** shows what the submitter/presenter/mentor sees on `/submit?id=…`, but read-only. No impersonation — just a viewer version so an admin can help a stuck submitter over the phone without needing to log in as them.

### 3. Admin views for post-launch

Detailed scope TBD after items 1–2 ship:
- Event config UI
- Judge signup review + confirmation-email tracking
- Assignment tools (oral/poster + judge-to-presenter)
- Schedule builder
- Volunteer signup review
- Awards MC view
- CSV email exports (presenters / mentors / judges / volunteers)

---

## Non-Goals (Out of Scope)

- No multi-event UI (schema supports it; UI targets one active event at a time)
- No cross-year analytics or historical comparisons
- No SSO / university identity provider integration
- No mobile-native app (responsive web only)
- No payment processing or registration fees
- No automated abstract review or AI-assisted scoring
- No public marketing site (public pages live inside the app as read-only routes)
- No video streaming or virtual presentation support

## Design Considerations

- CSU brand: green `#1E4D2B` and gold `#C8C372` (carried over from V1)
- Mobile-first for judge/presenter event-day flows; scoring and check-in must be thumb-friendly
- Accessibility: form labels, focus states, sufficient color contrast
- Role-based sidebar nav (public / auth / admin / utility sections)

## Technical Considerations

- **Auth:** Supabase email OTP (customized templates for both "Magic Link" and "Confirm signup" flows)
- **RLS:** Enforced end-to-end. `current_user_can_access_submission()` gives submitter / presenter / mentor / admin the right visibility.
- **Realtime:** Deferred until scoring/leaderboard (Supabase Realtime channels for scores + check-ins)
- **File storage:** Supabase Storage `public-docs` bucket (Guidelines PDF); other assets TBD
- **Offline resilience:** LocalStorage cache for scoring — same pattern as V1

## Open Questions

1. **Sponsor visit verification** — QR code, sponsor code, honor system? (Blocks Phase 2.7 gamification.)
2. **Green Labs award formula** — binary award (any certified author = eligible) or tiered (more certified authors = higher rank)?
3. **Gamification point values** — per-action point config; admin-editable?
4. **Feedback anonymity** — do presenters see who left feedback, or just text?
5. **Oral-only rejection workflow** — what happens when a presenter selects "oral only" and doesn't get a slot? Auto-move to poster or exclude from event?
6. **Green Labs vs Green Pipette naming** — align on final external name before UI copy is written.
7. **Photo gallery build vs outsource** — recommend cut; awaiting committee call.
8. **Award categories** — full 16+ list from V1 needs to be recorded here (or the source-of-truth pointer added).

## Success Metrics

- All abstract submissions collected through the app (zero MS Forms fallback)
- All judge volunteering and conflict declarations handled in-app
- Admin completes oral/poster assignments and judge assignments without spreadsheets
- 100% of scoring happens through the app on event day (same as V1)
- Check-in tracked in real-time with zero manual roster-checking
- Green Labs participation rate meaningfully higher than the 2026 MS Form approach
