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
- [x] **Abstract Guidelines received + live (Sep 28, 2026).** PDF
      uploaded to Supabase Storage `public-docs` bucket; the landing
      page callout is live in production.
- [ ] **Waiting on user for:** the finalized About page copy (still
      pending from Aimee's side as of Sep 25).
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
- [x] Updated Supabase **Confirm signup** template (Sep 28, 2026) so
      new signups get the OTP code instead of the default link.
- [x] **Task 6 — Settings.** Sep 28, 2026 — `/settings` now has a
      client-side password set/change form (uses `auth.updateUser`), a
      role-request form gated on `role_requests` RLS (mentor/judge/
      admin/volunteer, dedupes against current + pending), and a list
      of your prior requests with status pills. No self-cancel yet
      because RLS restricts delete to admins — punt to a schema tweak
      later if we need it.
- [x] **Task 7 — Public content.** Populated `/winners-2026` from
      vetmedbiosci.colostate.edu/research/research-day (Sep 28, 2026).
      `/about` and `/committee` (merged) are done.
- [x] **Task 8 — Faculty CSV loader.** Sep 28, 2026 — built
      `scripts/load-faculty.mjs` (reads `CVMBS-Faculty.csv`, applies
      case-preserving name normalization, lowercases emails) and emitted
      `supabase/migrations/2026-09-28_load_faculty.sql` (252 rows,
      upsert on email). Migration applied via Supabase SQL editor.
      Re-run the script anytime the CSV changes; the SQL is idempotent
      (only refreshes name/dept/is_active, preserves Green Labs flags
      and profile_id links).
- [x] **Submit form reorg (Sep 28, 2026 continued).** Sections reordered
      into a more editorial flow: Presenter (name + email + classification +
      dept-or-program + affiliations) → Mentors (**Faculty Mentor 1**
      required with faculty picker / "not listed" toggle, **Faculty Mentor 2**
      optional same pattern, one **Other Mentor** slot with name + optional
      affiliation) → Research type/stage → Title → Authors (comma-separated
      byline preview + coauthors list) → Abstract → Funding → Preferences.
      Byline order is: presenter → coauthors → Other Mentor → Faculty
      Mentor 2 → Faculty Mentor 1 (last position). Other Mentor affiliation
      is encoded into `submission_authors.display_name` with a ` · ` (middle
      dot) separator — no schema change; byline preview only shows the name
      portion. Instructions warn "Do not include degrees or affiliations in
      the name field." State split into `presenter` / `mentor_*` slots /
      `coauthors[]` and serialized back to the existing `submission_authors`
      shape on save. Submit is blocked until Faculty Mentor 1 is filled and
      every mentor named appears in the byline. Files: `submit-form.tsx`
      (rewritten), new `submit-authors.tsx` (`FacultyPicker` +
      `CvmbsMentorSlot` + `ExternalMentorSlot` + `CoauthorList` +
      `AffiliationsPicker`), old `author-list.tsx` deleted.
- [x] **Affiliations picker (Sep 28, 2026).** Presenter "Affiliations"
      field is now a grouped checkbox picker (Center · Institute ·
      Laboratory · Program · Training Grant) built from `docs/Affiliations.csv`
      (32 items). CSV is gitignored; run `node scripts/load-affiliations.mjs`
      to regenerate `src/lib/affiliations.generated.ts` when the CSV
      changes. Legacy free-text values from earlier drafts still round-trip
      as amber chips so nothing gets silently dropped.
- [x] **Local docs folder + guidelines link (Sep 28, 2026).** Moved the
      three source-of-truth files (Abstract Submission Guidelines PDF,
      Affiliations.csv, CVMBS-Faculty.csv) into `/docs/` — folder is
      gitignored. Both loader scripts (`load-faculty.mjs`,
      `load-affiliations.mjs`) now read from `docs/`. Landing page shows
      a "Submission guidelines (PDF)" link + callout section when
      `NEXT_PUBLIC_SUBMISSION_GUIDELINES_URL` env var is set — publicly
      visible, no sign-in required. To wire it up: upload the PDF to a
      public Supabase Storage bucket, copy the public URL, and set
      the env var in Vercel → Project → Settings → Environment Variables
      (and locally in `.env.local`). Section stays hidden until the env
      var is present.
- [ ] Author enhancements (deferred):
  - [ ] Capture Green Labs Ambassador status *per author* on the submit form.
  - [x] ~~Admin name-canonicalization for student misspellings.~~
        Sep 29, 2026 — `/admin/names` lists every unlinked hand-typed
        author name with count, role breakdown, and any dept/affiliation
        tags. Inline rename applies to every row with the exact-match
        current spelling. Server action is admin-gated and only touches
        rows where profile_id + faculty_id are both NULL.
- [x] ~~Convert affiliations from free text to multi-select~~ — done
      via the grouped checkbox picker above (source is a CSV rather than
      an admin-managed list, but functionally equivalent for now).
- [x] ~~"Abstract Instructions" doc / on-page guidance for submitters~~
      — replaced by the Guidelines PDF link on the landing page.
- [x] **PRD reconciled (Sep 28, 2026).** `tasks/prd-cvmbs-research-day.md`
      rewritten with a status legend (✅/🟡/⬜/🔵/⚫), 9/15/26 decisions
      folded in, and an Admin Backlog section that lists shipping-order
      priorities. `tasks/prd-phase0-foundation.md` collapsed to a
      "Phase 0 complete" marker pointing at the main PRD. `.docx` files
      preserved as historical originals.
- [x] **Admin console shell + first two pages (Sep 28, 2026).** New
      `/admin/*` routes: gated in `admin/layout.tsx` (isAdmin check,
      non-admins redirected to `/`). Index (`/admin`) shows two cards
      with live pending-count badges. **Requests page**
      (`/admin/requests`) — grant/deny pending role requests + approve/
      reject withdrawal requests, plus a "recently resolved" tail for
      audit. Grant is idempotent on the user_roles PK. **Abstracts
      overview** (`/admin/abstracts`) — aggregate count cards by status,
      amber banner if any withdrawals pending, filterable table
      (status/dept/session/free-text search), click-in detail at
      `/admin/abstracts/[id]`. Click-in view reuses `SubmitForm` with a
      new `adminView` prop; admins can edit any field regardless of
      status (finalized/withdrawn lock bypassed for admin role in
      `persistSubmission`). **Mentor picker default** flipped: new
      drafts start Faculty Mentor 1/2 in CVMBS picker mode so people
      don't rush past the autocomplete and type a name that's actually
      in the roster; existing "not listed" saves still round-trip
      correctly.
- [x] **Admin role bootstrapped on prod (Sep 28, 2026).** Verified via
      Supabase SQL — the `user_roles` row for aimeeoke is in place.
- [x] **Login/signup wording + name capture at login (Sep 29, 2026).**
      Login yellow banner rewritten to warn "This is not a university
      site" and stop users from trying their CSU SSO password. Green
      Labs mentions removed from login + signup wording. Login form now
      also captures First/Last name (optional; only used when the OTP
      flow creates a new profile — the `handle_new_user` trigger picks
      them up via the same user-metadata path as the /signup form).
- [x] **Rich text for abstract title + body (Sep 29, 2026).** Both
      fields now use TipTap so scientific notation from Word survives
      the paste. See "Rich text pattern" below for the reusable design.
- [x] **Per-author affiliation (Sep 29, 2026).** Coauthors, "Other
      Mentor", and CVMBS Mentor "Not listed" slots each get a chip
      picker: 4 CVMBS dept chips + "Other CSU Department or Program"
      + "Non-CSU". Stored as `submission_authors.department_id` (linked
      to `departments`) and `submission_authors.affiliation` (free
      text). Removed the FacultyPicker "unlink" affordance so submitters
      can't accidentally break a pre-loaded faculty link.
- [x] **Admin name-canonicalization (Sep 29, 2026).** `/admin/names`
      lists every unlinked hand-typed author name across submissions
      with counts, role breakdown, and dept/affiliation tags. Inline
      rename applies the change to every row with the exact-match
      current spelling. Server action is admin-gated; only touches
      unlinked rows.
- [x] **Certifications storage bucket (Sep 29, 2026).** Public-read
      Supabase bucket named `certifications` with 10 MB / PDF+PNG+JPEG
      limits. RLS: public read, auth insert, uploader/admin
      update+delete. Path convention (enforced in app, not RLS):
      `ambassadors/{profile_id}/{ts}-{name}` for personal Ambassador
      certs, `labs/{faculty_id}/{ts}-{name}` for lab / clinic certs.
      Helper library at `src/lib/storage.ts` — `uploadCertification`,
      `getCertificationPublicUrl`, `deleteCertification`,
      `buildCertificationPath`. See "Storage pattern" below.
- [x] **Certifications DB table (Sep 29, 2026).** New `certifications`
      table backs the Storage bucket with typed metadata. Three kinds
      (ambassador / my_green_lab / green_paw), two feed paths (CSV
      import for the pre-loaded ambassador list, user upload for the
      self-service path). Fields: profile_id/first_name/last_name/email
      for individuals, faculty_id/lab_name for labs, source (csv_import
      / user_upload / admin_manual), storage_path (nullable — CSV rows
      have no PDF), valid_through, verified_at/by, uploaded_by/at.
      RLS: public read (for the future directory page), auth insert
      (self-upload), admin update/delete (owns verification).
      Supersedes the pre-existing boolean flags on `profiles` and
      `faculty` — those stay for now but new code should read from
      this table.
- [x] ~~**Ambassador cert upload on submit form** (Sep 29, 2026 AM).~~
      Superseded — the presenter-only widget is replaced by the
      per-author section below.
- [x] **Per-author Ambassador certs (Sep 29, 2026 PM).** New "Green
      Labs Ambassador certifications" section on the submit form
      (between Authors and Abstract). Iterates over every named
      author on the abstract (presenter, coauthors, mentors — CVMBS
      linked mentors use the roster email, non-listed / external
      mentors + coauthors need an email typed on their author row).
      Each row: status badge (Certified from pre-loaded list / Verified /
      Pending review / Not registered), Upload / Replace / Remove
      actions, and a running total at the bottom (10 pts per certified
      author, capped at 100 for the Green Pipette race). Server action
      `recordAmbassadorCertForEmail` handles both self-upload and
      submitter-uploading-on-behalf-of-coauthor. Old `ambassador-upload.tsx`
      deleted. Also added optional email fields to CoauthorState,
      MentorCvmbsState (not_listed mode), MentorExternalState so
      submitters can capture emails inline.
- [x] **Self-delete widened to submitted (Sep 29, 2026 PM).**
      Migration `2026-09-29_owner_delete_submitted.sql` relaxes the
      RLS from status='draft' to status IN ('draft','submitted').
      Submitters can now delete their own abstract while it's still
      pre-finalize; the withdrawal-request flow (admin-approved) only
      fires for finalized rows, since post-finalize the abstract is
      in the printed program + judge assignments. `deleteDraftSubmission`
      renamed → `deleteOwnSubmission`; modal copy updated
      ("Delete submission?" instead of "Delete draft?").
- [x] **Admin cert verification tool (Sep 29, 2026 PM).** New
      `/admin/certifications` page: Pending tab lists every cert with
      verified_at IS NULL (subject name + email, source, uploader,
      date, "View file" link to the storage public URL). Approve
      stamps verified_at + verified_by; Deny wipes both the DB row and
      the storage file. Recently verified tab (last 50) lets admin
      un-verify approvals made by mistake. Also added a card on
      /admin with the pending count so it's discoverable. Closes the
      loop from stage 5b — no more SQL to verify a cert.
- [x] **MGL ambassador CSV loaded (Sep 30, 2026).** 151 rows from
      `docs/MGL_Ambassadors.csv` loaded into `certifications` as
      pre-verified ambassador entries. Schema quirk: the CSV only ships
      first + last name (no emails from the certifying body), so
      migration `2026-09-30_certifications_name_only.sql` relaxes the
      identity CHECK to accept name-only ambassador rows. Loader lives
      in `scripts/load-mgl-ambassadors.mjs` (same shape as the faculty
      loader); generated SQL at `2026-09-30_load_mgl_ambassadors.sql`
      is idempotent per row so re-running only inserts new names when
      the CSV grows. **Downstream implication:** matching a name-only
      cert to a coauthor on an abstract will need human review; that's
      why the `/admin/names` tool exists — a committee member can help
      canonicalize "Jane Smith" ↔ "J. Smith" ↔ "Jane A. Smith". Points
      calc (deferred) will need a name-matching strategy for these
      rows.
- [x] **/green-labs public directory (Sep 30, 2026).** New public
      route showing every verified ambassador (from CSV import + user
      uploads once verified). Alphabetical by last name, grouped by
      last-name initial, with a search box. Explainer block at top
      pulls award structure straight from the About doc — 10 pts per
      ambassador (cap 100) + 100 pts per certified lab, with links to
      the training + certification programs. Added to publicNav so it
      appears in the sidebar for all visitors.

### Rich text pattern (Sep 29, 2026)
Reusable across projects — the pattern is: (a) TipTap-backed editor with a
tiny whitelist of marks, (b) `sanitize-html` sanitizer running on both save
AND render, (c) plain TEXT column in Postgres for storage, (d) helpers for
"is empty" and "extract plain text" so search / char counts still work.

**Do NOT use `isomorphic-dompurify` on Vercel.** Its Node build pulls in
`jsdom` v25+ which has an ESM subdep (`@exodus/bytes/encoding-lite.js`)
that breaks `require()` in the Vercel serverless runtime with a
`ERR_REQUIRE_ESM` error. Local `next build` misses this because it uses a
different code path. We shipped that landmine on Sep 29 morning and had
to swap to `sanitize-html` (pure Node, no jsdom, no ESM/CJS problem)
that afternoon. Learned the hard way — keep the pattern on sanitize-html.

- **Source of truth:** `src/lib/rich-text.ts` — allowed tags list,
  `sanitizeRichTextHtml()`, `richTextIsEmpty()`, `richTextToPlainText()`.
  If you paste this into another project, this file plus
  `rich-text-editor.tsx` + `rich-text-view.tsx` is the entire pattern.
- **What's allowed:** `<p> <br> <strong> <em> <sup> <sub>`. Nothing else.
  Deliberately no links, headings, lists, colors, or fonts — abstracts
  should be uniform, and it keeps the injection surface tiny.
- **Editor:** `src/components/rich-text-editor.tsx` — configurable
  single-line (title) or multiline (body). Toolbar: B / I / X² / X₂.
  `immediatelyRender: false` is required to avoid Next.js hydration
  mismatches.
- **Read-only view:** `src/components/rich-text-view.tsx` — sanitizes
  before `dangerouslySetInnerHTML`. Pass `inline` when embedding in
  table cells or headings so the outer `<p>` is stripped.
- **Storage:** unchanged. `submissions.title` and `submissions.abstract`
  are still TEXT — they now hold sanitized HTML instead of plain text.
  Legacy plain-text values render fine (no tags = no marks).
- **Search / filter:** always compare against `richTextToPlainText(html)`.
  The abstracts-browser filter and the withdrawal toast messages both use
  this so the user never sees raw `<em>` in a UI string.
- **Packages:** `@tiptap/react @tiptap/starter-kit
  @tiptap/extension-superscript @tiptap/extension-subscript
  sanitize-html @types/sanitize-html` (v3.31.x TipTap, works with React 19).
- **CSS:** the `.prose-abstract` block in `src/app/globals.css` restores
  italic/sup/sub styling that Tailwind Preflight would otherwise flatten.
  Any read-only view needs this class (RichTextView applies it
  automatically).

### Storage pattern — cert PDFs (Sep 29, 2026)
Reusable across projects that need file uploads with public download URLs.
Applied here for Green Labs certification PDFs.

- **Source of truth:** `supabase/migrations/2026-09-29_certifications_bucket.sql`
  creates the bucket + RLS policies. `src/lib/storage.ts` is the API.
- **Bucket config:** `public=true` (so `getPublicUrl` returns a plain CDN
  URL, no signed-URL round-trip), 10 MB size limit, PDF/PNG/JPEG only.
- **RLS shape:** public read, auth insert, owner-or-admin update+delete.
  Ownership captured by `storage.objects.owner` = `auth.uid()`, set
  automatically on upload.
- **Path convention** is enforced by app code, NOT by RLS — that would
  block legitimate admin-on-behalf-of uploads. See `buildCertificationPath`:
  `ambassadors/{profile_id}/{ts}-{name}` or `labs/{faculty_id}/{ts}-{name}`.
  Timestamp prefix prevents overwrites when re-uploading.
- **App API:** `uploadCertification` (client, takes a browser `File`),
  `getCertificationPublicUrl`, `deleteCertification`,
  `buildCertificationPath` (exposed for constructing paths server-side
  when needed).
- **Not built yet:** a `certifications` table to track "which cert belongs
  to whom, is it verified, valid through when." That's stage 4-5 in the
  Green Labs epic — this bucket + helper are the substrate.

### Migrations applied (in order)
1. `supabase/schema.sql` — Sep 23, 2026 (initial V2 schema)
2. `supabase/migrations/2026-09-24_first_last_name.sql` — first_name/last_name + trigger update
3. `supabase/migrations/2026-09-24_schema_tweaks.sql` — multi-draft, author email, RLS helper, judge_registrations, role_requests
4. `supabase/migrations/2026-09-25_form_updates.sql` — Sep 25, 2026 — presenter program column + widened session_preference CHECK
5. `supabase/migrations/2026-09-28_load_faculty.sql` — Sep 28, 2026 — bulk load of 252 CVMBS faculty (generated by `scripts/load-faculty.mjs`)
6. `supabase/migrations/2026-09-28_withdrawal_and_delete.sql` — Sep 28, 2026 — withdrawal + delete-draft support
7. `supabase/migrations/2026-09-29_author_affiliation.sql` — Sep 29, 2026 — per-author department_id + affiliation
8. `supabase/migrations/2026-09-29_certifications_bucket.sql` — Sep 29, 2026 — certifications Storage bucket + RLS
9. `supabase/migrations/2026-09-29_certifications_table.sql` — Sep 29, 2026 — certifications DB table (backs the bucket with typed metadata)
10. `supabase/migrations/2026-09-29_certifications_self_manage.sql` — Sep 29, 2026 — RLS addendum: uploader can manage own unverified cert
11. `supabase/migrations/2026-09-29_owner_delete_submitted.sql` — Sep 29, 2026 — self-delete widened to include submitted (only finalized still needs withdrawal request)
12. `supabase/migrations/2026-09-30_certifications_name_only.sql` — Sep 30, 2026 — relax ambassador identity CHECK to accept (first + last) name-only rows
13. `supabase/migrations/2026-09-30_load_mgl_ambassadors.sql` — Sep 30, 2026 — 151-row bulk load of the MGL ambassador list (generated by `scripts/load-mgl-ambassadors.mjs`)

### Deploy
- [x] **Sep 28, 2026 — Vercel cutover done.** `researchday.vercel.app`
      now serves this repo via a **new Vercel project named
      `cvmbs-research-day`** (Next.js). The old Vercel project named
      `researchday` (V1 Vite site, `aimeeoke/ResearchDay`) is dormant —
      leave it alone, it no longer owns the domain. Supabase Auth Site
      URL + Redirect URLs updated to trust the production domain.
      Sep 29, 2026: the dormant `researchday` project fired failed-build
      emails after a stray push — fixed by switching its Framework
      Preset from Vite to Next.js so it stops looking for `dist/`.
- [x] Admin role bootstrapped on prod (Sep 28, 2026) — the `user_roles`
      row exists; sidebar shows Admin link and `/admin/*` is reachable.

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
