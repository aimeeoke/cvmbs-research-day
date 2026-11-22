# Oral vs. Poster Assignment — Rules Sketch

Status: **draft, not yet implemented** · Captured 2026-11-22 from Aimee's
scoping conversation.

Purpose: Research Day 2027 has roughly 32 oral slots across 4 sessions. Two
faculty committee members will log in and make the final oral assignments.
This doc captures the shape of the rules they balance, and the data signals
the system needs to surface to them.

**First deliverable shipped:** "Committee review" CSV export at
`/admin/abstracts` — one wide row per abstract with every field (abstract
body, author list, mentor departments, previous-RD history, derived science
category + first-time-oral flag). That's the raw material so Aimee can walk
through a historical balancing pass end-to-end and tune these rules before
we build the live picker UI.

---

## Slot structure (4 oral sessions)

| Slot | Time | Room | Capacity |
|---|---|---|---|
| Early · Auditorium | 11:00 am – 1:00 pm | Auditorium | ~8 |
| Early · Boardroom | 11:00 am – 1:00 pm | Boardroom | ~8 |
| Late · Auditorium | 1:15 – 3:15 pm | Auditorium | ~8 |
| Late · Boardroom | 1:15 – 3:15 pm | Boardroom | ~8 |

Session preference already captured on the form
(`submissions.session_preference` ∈ Early / Late / No preference /
Undergraduate poster). Room assignment is committee-decided, not
submitter-picked.

---

## Hard constraints

1. **Undergrads → poster only.** `classification = 'Undergraduate Student'`
   must not land in an oral slot. Enforce this before the committee ever
   sees the row as an oral candidate.
2. **Preferred format = "Poster only" → never oral.** Submitters opt out of
   oral by choosing this value; respect it.
3. **Withdrawn / draft → excluded.** Only `submitted` + `finalized` are
   candidates.
4. **Session preference is respected unless the committee overrides.** If
   someone picked "Early," default their oral slot to Early; manual
   override allowed with a visible warning.

---

## Soft balancing goals (the hard part)

Think of these as weights the committee eyeballs, not thresholds. The
system's job is to surface live counters so they can see what their draft
assignment looks like as they build it.

### A. Science-category mix per session

Target ratios reflect the grad-program mix (largest pool):

- ~50% **Basic / Foundational** (`research_type = 'Foundational Research'`)
- ~25% **Clinical** (`research_type = 'Veterinary Clinical Research'`)
- ~25% **Translational** (`research_type = 'Translational Research'`)
- `Social Sciences/Pedagogy Research` → "Other" bucket; rare enough that
  the committee decides on a case-by-case basis.

Surface: live tally of basic / clinical / translational per session as the
committee drags abstracts in.

### B. Research-stage mix per session

Each session should have a mix of Early + Advanced, not all one or the
other. Source: `submissions.research_stage` (Early / Advanced).

### C. New oral presenters preferred

Everyone who hasn't orally presented at RD before gets priority for the
limited oral slots. Inputs:

- `submissions.previously_presented` (bool)
- `submissions.previous_format` ('Oral' / 'Poster')
- `submissions.presenter_previous_rd_count` (0 / 1 / 2 / 3 / 4+)

Derived "first-time oral" = never previously orally presented (poster-only
history still counts as first-time oral). Already computed in the
Committee-review CSV.

### D. Mentor / department / center diversity

Avoid clustering. The committee doesn't want 5 oral slots all from the
Cancer Center, or 5 all mentored by the same PI, or 5 all from the same
department.

Signals to surface (per-draft-assignment, flag if any count ≥ a threshold
like 2–3):

- Mentor dept (Faculty Mentor 1 dept, Faculty Mentor 2 dept, External
  mentor affiliation)
- Presenter dept
- Affiliations (centers / institutes / training grants — from
  `submissions.affiliations`, which maps to the `docs/Affiliations.csv`
  roster)

### E. Topic / "interesting-ness"

The committee reads the title + abstract and judges whether it's a
high-impact / broadly interesting talk. No automation here — we just need
to surface the title + abstract body in the picker UI so they can read
it without clicking away.

---

## Workflow sketch (future UI)

Two faculty committee members log in. For each candidate abstract they see:

1. Presenter identity + classification + home dept
2. Research type + science-category badge + research stage
3. Presentation-type preference + session preference
4. First-time-oral badge (big, green) OR "N-time RD presenter, oral history"
5. Mentor(s) + their departments
6. Center / institute / training-grant affiliations
7. Title + abstract body (readable inline, not a modal)
8. A drop-down to assign: Oral · Early/Auditorium / Oral · Early/Boardroom /
   Oral · Late/Auditorium / Oral · Late/Boardroom / Poster

Alongside the list, a live summary panel shows for each session:

- Science-category mix (vs. 50/25/25 target)
- Research-stage mix
- First-time-oral count
- Dept / mentor / center repeats (red flag ≥ 2)

Two reviewers share the same assignment state. Last-write-wins is fine for
the small-scale use case; a lock or soft-conflict indicator ("Jamie is
currently editing this row") is nice-to-have, not required.

---

## Data model we'll likely need

Nothing to migrate yet. When we build the picker UI, add:

- `oral_assignments` table (or columns on `submissions`): `assigned_slot`
  TEXT CHECK IN ('poster', 'oral_early_auditorium', 'oral_early_boardroom',
  'oral_late_auditorium', 'oral_late_boardroom'), `assigned_by`,
  `assigned_at`, `committee_note`.
- RLS: readable + writable by committee_member + admin.

---

## Open questions (for the committee)

- Is there a hard floor on first-time oral presenters (e.g. "at least
  half the oral slate must be first-timers") or just a preference?
- When session preference says "No preference," is the default Early or
  Late, or does the system just leave it open for the committee?
- How do we handle `Social Sciences/Pedagogy Research` — do they count
  toward the clinical bucket, their own bucket, or just case-by-case?
- Do oral slots mirror the ~50/25/25 ratio, or should orals skew toward a
  different distribution for "showcase" purposes?
- Is the ~8-per-session capacity firm, or does it flex per session?

---

## Not in scope here

- Judge assignments. Different problem (judges to posters/orals), different
  data (`judge_registrations` + `judge_assignments`).
- Scoring. That's the live-event tool ported from V1.
- Automated assignment / optimization. The committee makes the calls;
  we're just giving them good dashboards.
