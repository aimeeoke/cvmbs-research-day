# PRD: CVMBS Research Day Platform

## Introduction

A comprehensive web application managing the full lifecycle of Colorado State University's College of Veterinary Medicine and Biomedical Sciences (CVMBS) annual Research Day event. The platform replaces a patchwork of forms, spreadsheets, and a limited scoring-only app with a single unified system spanning abstract submission through final awards.

The app serves five user roles across three phases: **Pre-Event** (abstract submission, judge volunteering, assignment planning), **Event Day** (check-in, scoring, live leaderboard, photo gallery, gamification), and **Post-Event** (results, awards, feedback review).

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (database + auth + storage)

**New Repo:** `C:\Users\abuelow\Documents\Github\cvmbs-research-day`

---

## Goals

- Replace hardcoded PIN auth with magic-link authentication (Supabase Auth) for all user roles
- Provide a single platform for the entire event lifecycle (submission → scoring → awards)
- Enable presenters to self-register, submit abstracts, indicate preferences, and check in on event day
- Enable judges to volunteer, set preferences/conflicts, and score assigned presenters
- Give the admin (committee tech lead) full control over assignments, scheduling, and event configuration
- Give event directors (faculty) read-only monitoring dashboards during the live event
- Add new features: Green Pipette certification tracking, photo gallery with voting, gamification/interaction points, presenter/judge check-in, and live leaderboard
- Support one active event at a time (annual, reset each year)

---

## Roles & Permissions

| Role | Description | Access |
|------|-------------|--------|
| **Admin** | Tech lead (Aimee). Full control. | Everything: event setup, manage users, assignments, scoring config, results, export |
| **Event Director** | Faculty committee leads. Non-technical. | Read-only dashboards: monitoring, check-in status, live leaderboard, results |
| **Judge** | Volunteers who score presentations. | Volunteer signup, profile/preferences/conflicts, scoring portal, check-in, photo upload, feedback |
| **Presenter** | Researchers submitting and presenting. | Abstract submission, preference selection, check-in, photo upload, feedback, view own scores (post-event) |
| **Viewer** | Anyone with a magic link. | Public schedule, live leaderboard, photo gallery, feedback submission, gamification |

All roles authenticate via **magic link** (email-based, no passwords). Admin assigns roles after signup or pre-seeds accounts.

---

## Phase 1: Pre-Event (Months Before)

### 1.1 Event Setup (Admin)

The admin creates and configures the annual event.

**What gets configured:**
- Event name, date, location
- Submission open/close dates
- Presentation sessions and time slots (e.g., "Foundational Science AM," "Clinical PM")
- Oral slot allocations per session (e.g., 16 foundational, 8 translational, 8 clinical)
- Award categories (carried over from v1, admin can edit)
- Scoring criteria and weights (carried over from v1: 7 criteria, same weights)
- Judge volunteering open/close dates

---

### 1.2 Abstract Submission (Presenters)

Presenters create an account (magic link) and submit their research.

**Submission fields:**
- Full name
- Email
- Role (one of): DVM Student, DVM/MBA Student, DVM/MPH Student, DVM/PhD Student, MD Student, MS Student, MPH Student, PhD Student, Post-Baccalaureate, Undergraduate Student, Postdoc, Resident, Resident/PhD Student, Resident/MS Student, Veterinary Intern, Research Staff
- Mentor name(s) (one or more)
- Research type (e.g., Basic, Clinical, Translational — admin-configurable list)
- Research stage (e.g., Early, Mid, Complete — admin-configurable list)
- Title
- Full author list (ordered list of names + affiliations)
- Abstract text (character-limited text field)
- Funding source(s) (multi-select from list + "Other" free text)
- Affiliations (multi-select + "Other" free text)

**Presentation preferences:**
- Format preference: "Oral only" | "Prefer oral, will accept poster" | "Poster only" | "No preference"
- Session preference: "Early" | "Late" | "No preference"
- Previously presented at Research Day? Yes/No
  - If yes: what format? (Oral / Poster)

**Green Pipette (new):**
- Have you completed Green Labs certification? Yes/No
- Which other authors on your author list have completed it? (checkboxes from author list entered above)

**After submission:**
- Presenter receives confirmation email
- Presenter can edit submission until the submission deadline
- Admin sees all submissions in a management dashboard

---

### 1.3 Lab Builder (Admin)

A tool for the admin to define "labs" (research groups) based on submitted data.

- View all presenters grouped by mentor name (auto-suggested groupings)
- Manually create/edit lab groups (a lab = a mentor + their students/postdocs/staff)
- Labs are used for judge conflict-of-interest matching (if a judge marks a conflict with a lab, they won't be assigned to any presenter in that lab)
- Bulk actions: merge labs, split labs, reassign presenters between labs

---

### 1.4 Judge Volunteering (Judges)

Judges create an account (magic link) and fill out a volunteer profile.

**Judge profile fields:**
- Full name
- Email
- Department
- Role/title
- Format preference: "Oral" | "Poster" | "Either"
- Time slot preference: select from available sessions
- **Constraint:** Graduate students can only judge the undergraduate session
- Conflicts of interest:
  - Search and select individual presenters
  - Search and select entire labs (from Lab Builder data)

**After volunteering:**
- Judge appears in the admin's assignment pool
- Judge receives confirmation email

---

### 1.5 Assignment & Scheduling (Admin)

The admin reviews submissions, makes oral/poster decisions, assigns judges, and builds the schedule.

**Oral vs. Poster decisions:**
- Dashboard showing all presenters who requested oral, sortable/filterable by:
  - Format preference (oral only, prefer oral, no preference)
  - Role
  - Research type
  - Previous Research Day participation and format
  - Session preference
- Visual indicator of remaining oral slots per session (e.g., "14/16 foundational filled")
- Admin assigns each presenter to: Oral (with session) or Poster (with session)
- Presenters who selected "Oral only" but can't be accommodated are flagged for follow-up

**Poster number assignment:**
- Assign poster numbers respecting session preferences (early/late)
- Avoid random assignment + manual swaps (the old pain point)

**Judge assignment:**
- Admin assigns specific judges to specific presenters (direct assignment)
- System prevents assigning a judge to a presenter they have a conflict with
- System enforces grad-student-judges → undergrad-session-only rule
- Dashboard shows: judges per presenter, presenters per judge, unassigned presenters, judges with open capacity

**Schedule builder:**
- Arrange oral presentations into time slots within sessions
- Generate printable/exportable schedule
- Schedule visible to all roles on event day

---

## Phase 2: Event Day

### 2.1 Check-In (Presenters & Judges)

- Presenters and judges check in via the app (button on their dashboard)
- Admin and directors see real-time check-in status dashboard
- No-show tracking: unchecked presenters flagged as potential no-shows
- Judges who haven't checked in get a reminder (in-app notification or visual flag for admin)

---

### 2.2 Scoring Portal (Judges)

Same core scoring system as v1, with direct assignment instead of time-slot selection.

**Flow:**
1. Judge logs in → sees their assigned presenters for the day
2. Selects a presenter to score
3. Rates 7 weighted criteria (1-5 scale):
   - Content: WHY (weight 4)
   - Content: WHAT/HOW (weight 5)
   - Content: Next Steps (weight 2)
   - Logical Flow (weight 3)
   - Preparedness (weight 2)
   - Verbal Communication (weight 2)
   - Visual Aids (weight 2)
4. Can mark presenter as no-show
5. Submit → auto-advance to next assigned presenter
6. Progress indicator showing scored vs. remaining

**Data:** Scores sync to Supabase in real-time. LocalStorage cache for offline resilience.

---

### 2.3 Live Leaderboard

- Real-time ranked display of top presenters by weighted score
- Filterable by category/session
- Auto-refreshes
- Visible to all roles
- Scores anonymized until results are finalized (shows ranking position, not raw scores) — admin can toggle this

---

### 2.4 Schedule View

- All users can see the full event schedule
- Oral presentation times and rooms
- Poster session times and poster numbers
- Filterable by session, category, format
- Searchable by presenter name

---

### 2.5 Photo Gallery & Best Picture Award

- Any authenticated user can upload photos during the event
- Photos displayed in a gallery view
- Any user can upvote photos (one vote per photo per user)
- At the end of the event, the most-upvoted photo wins "Best Picture" award
- Admin can moderate (remove inappropriate photos)

---

### 2.6 Feedback System

- Any authenticated user can submit written feedback for any presenter
- Feedback is tied to the presenter but the submitter's identity is recorded (not anonymous to admin)
- Presenters can view their feedback after the event
- Admin can review all feedback

---

### 2.7 Gamification / Interaction Points

A points system encouraging participation throughout the event.

**Point-earning actions:**
- Visiting a sponsor booth (verification method TBD — QR code scan, sponsor code, etc.)
- Submitting feedback for a presenter
- Being a judge (automatic points for completing scoring assignments)
- Uploading a photo to the gallery

**Features:**
- Personal points dashboard visible to each user
- Event-wide leaderboard of top participants
- Admin configures point values per action
- Potential award for top participant(s)

---

### 2.8 Green Pipette Scoring (New Award)

- During results calculation, the system identifies presenters who completed Green Labs certification
- Additional recognition for labs where multiple authors are certified
- Scoring formula TBD by committee (could be binary award or tiered)
- Displayed alongside other award categories in results

---

## Phase 3: Post-Event

### 3.1 Results & Awards

- Category winners (1st, 2nd, 3rd) calculated from weighted scores — same algorithm as v1
- Award categories same as v1 (16+ categories including Golden Pipette)
- Green Pipette award (new)
- Best Picture award (from photo gallery votes)
- Top Interaction Points award (from gamification)
- Results page viewable by all roles
- Admin can finalize/lock results before making them visible
- Export results to CSV/PDF

---

### 3.2 Admin Data & Export

- Export all scores, feedback, submissions, and participation data
- Year-over-year data lives in Supabase (one event at a time, but data persists)
- Backup/restore functionality

---

## Functional Requirements

### Authentication & Users
- FR-1: All users authenticate via Supabase magic link (email, no password)
- FR-2: Admin can assign roles (admin, director, judge, presenter, viewer) to any user
- FR-3: Admin can pre-seed user accounts by uploading a CSV of emails + roles
- FR-4: Session persists via Supabase Auth JWT; localStorage flags removed
- FR-5: Protected routes enforce role-based access (middleware)

### Abstract Submission
- FR-6: Presenters fill out the full submission form with all fields listed in Section 1.2
- FR-7: Submissions are editable until the admin-set deadline
- FR-8: Admin sees a submission management dashboard with filtering, search, and export
- FR-9: Presenter role list is admin-configurable
- FR-10: Green Pipette certification fields are part of the submission form

### Lab Builder
- FR-11: Admin can create, edit, merge, and split lab groups
- FR-12: Labs auto-suggest groupings based on shared mentor names
- FR-13: Labs are referenced in judge conflict-of-interest matching

### Judge Volunteering
- FR-14: Judges create a profile with preferences and conflicts
- FR-15: Grad student judges are restricted to the undergraduate session only
- FR-16: Judges can mark conflicts with individual presenters or entire labs

### Assignment & Scheduling
- FR-17: Admin assigns each presenter to oral or poster format with session
- FR-18: Oral slot limits are enforced visually (counter per session)
- FR-19: Admin directly assigns judges to presenters
- FR-20: System prevents judge assignment to conflicted presenters/labs
- FR-21: Poster numbers assigned respecting session preference (early/late)
- FR-22: Schedule is viewable by all authenticated users

### Event Day
- FR-23: Presenter and judge check-in via in-app button
- FR-24: Admin/director dashboard shows real-time check-in status
- FR-25: Judges score assigned presenters using 7 weighted criteria (1-5 scale)
- FR-26: Live leaderboard updates in real-time, filterable by category/session
- FR-27: Photo gallery supports upload, display, and upvoting
- FR-28: Feedback can be submitted by any authenticated user for any presenter
- FR-29: Gamification system tracks points for sponsor visits, feedback, judging, and photo uploads
- FR-30: Points leaderboard visible to all users

### Results
- FR-31: Winners calculated using weighted scoring algorithm (same as v1)
- FR-32: Results include all v1 award categories plus Green Pipette, Best Picture, and Top Interaction
- FR-33: Admin can lock/unlock results visibility
- FR-34: Results exportable to CSV and PDF

---

## Non-Goals (Out of Scope)

- No multi-event support (no managing 2026 and 2027 simultaneously)
- No cross-year analytics or historical comparisons
- No SSO / university identity provider integration
- No mobile-native app (responsive web only)
- No payment processing or registration fees
- No automated abstract review or AI-assisted scoring
- No email notification system beyond magic link auth (no blast emails, reminders, etc. — handle externally)
- No public-facing website or marketing pages (app is for authenticated participants only)
- No video streaming or virtual presentation support

---

## Design Considerations

- **CSU branding:** Use CSU green (#1E4D2B) and gold (#C8C372) as primary colors (carry over from v1)
- **Mobile-first:** Judges and presenters will use phones on event day; scoring and check-in must be thumb-friendly
- **Reuse v1 components:** Scoring rubric UI, results calculation logic, admin dashboard patterns
- **Accessibility:** Form labels, focus states, sufficient color contrast
- **Navigation:** Role-based nav — each role sees only their relevant pages after login

---

## Technical Considerations

- **Supabase Auth:** Magic link flow via `supabase.auth.signInWithOtp({ email })`
- **Row-Level Security (RLS):** Supabase RLS policies enforce role-based data access at the database level
- **Real-time:** Use Supabase Realtime subscriptions for live leaderboard, check-in status, and scoring progress
- **File storage:** Supabase Storage for photo gallery uploads (and potentially poster PDFs if added later)
- **Offline resilience:** LocalStorage cache for scoring (sync when connection restored) — same pattern as v1
- **Database schema:** New tables needed beyond v1's `scores` table:
  - `users` (id, email, role, name, department, created_at)
  - `events` (id, name, date, config JSON, created_at)
  - `submissions` (id, user_id, event_id, all submission fields, preferences, green_pipette fields)
  - `labs` (id, event_id, mentor_name, name)
  - `lab_members` (lab_id, submission_id)
  - `judges` (id, user_id, event_id, preferences, constraints)
  - `judge_conflicts` (judge_id, submission_id | lab_id)
  - `assignments` (id, judge_id, submission_id, event_id)
  - `scores` (expanded from v1, linked to assignments)
  - `checkins` (user_id, event_id, checked_in_at)
  - `photos` (id, user_id, event_id, storage_path, created_at)
  - `photo_votes` (photo_id, user_id)
  - `feedback` (id, from_user_id, submission_id, text, created_at)
  - `interaction_points` (id, user_id, event_id, action_type, points, created_at)
  - `award_categories` (id, event_id, name, config)

---

## Success Metrics

- All abstract submissions collected through the app (zero paper/external forms)
- All judge volunteering and conflict declarations handled in-app
- Admin can complete oral/poster assignments and judge assignments without spreadsheets
- 100% of scoring happens through the app on event day (same as v1)
- Check-in tracked in real-time with zero manual roster-checking
- Photo gallery and gamification drive measurably more engagement than prior years
- Green Pipette participation rate significantly higher than the MS Form approach

---

## Open Questions

1. **Sponsor visit verification:** How do we confirm a user visited a sponsor booth? QR code at each booth? Sponsor enters a code? Honor system?
2. **Green Pipette scoring formula:** Binary award (certified = eligible) or tiered (more certified authors = higher score)?
3. **Gamification point values:** What's each action worth? Should admin configure this per event?
4. **Photo moderation:** Real-time moderation needed or post-hoc review sufficient?
5. **Feedback anonymity:** Should presenters see who left feedback, or only the text?
6. **Oral-only rejection workflow:** When a presenter selects "oral only" but doesn't get a slot, what happens? Are they excluded from the event or automatically moved to poster?
7. **Research type and research stage options:** What are the specific values for these dropdowns?
8. **Award categories:** Can you provide the full list of the 16+ categories from v1?
