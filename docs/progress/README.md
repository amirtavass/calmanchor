# Progress — Index

Milestone plan, status, open questions, and the changelog. Structured the same way as `docs/schema-coaching/`:
one concern per file, stable IDs, append-only registers. Never rewrite history — add a new row.

## Reading order

1. `01-overview.md` — the four milestone phases (from `docs/Milestones.docx`): deliverable, due date, payment share, current status.
2. `milestones/m1-project-setup.md` → `m4-store-readiness.md` — per-phase task registers.
3. `06-changelog.md` — what changed and why (append-only).
4. `07-questions-for-aamir.md` — open questions / decisions to raise at supervision (append-only).

## Files

| File | Concern |
|---|---|
| [`01-overview.md`](01-overview.md) | Phase-level status summary across all four milestones. |
| [`milestones/m1-project-setup.md`](milestones/m1-project-setup.md) | M1 task register (Project Setup & Architecture). |
| [`milestones/m2-core-app.md`](milestones/m2-core-app.md) | M2 task register (Core App End to End). |
| [`milestones/m3-full-feature-set.md`](milestones/m3-full-feature-set.md) | M3 task register (Full Feature Set). |
| [`milestones/m4-store-readiness.md`](milestones/m4-store-readiness.md) | M4 task register (Store Readiness). |
| [`06-changelog.md`](06-changelog.md) | Append-only record of changes (decisions + progress). |
| [`07-questions-for-aamir.md`](07-questions-for-aamir.md) | Open questions / supervision items. |
| [`08-live-data-and-auth-wiring.md`](08-live-data-and-auth-wiring.md) | Design & step plan: make the app read real Supabase data (dashboard) + visible live Google sign-in. Design-only for now. |
| [`09-bugfix-report.md`](09-bugfix-report.md) | Three persistent bugs (auto Google sign-in on the Exercises tab, Toolkit free-preview + lock page, invisible session completion button) — symptom, root cause, fix. |

(`02–05` are reserved to mirror the schema-coaching numbering; the schema-coaching pack owns stories, so they are not recreated here.)

## Status values

- `TODO` — not started
- `IN_PROGRESS` — actively being worked
- `DONE` — finished and verified
- `BLOCKED` — cannot proceed; reason must appear in Notes and be escalated to Aamir (see `07-questions-for-aamir.md`)

## How to update

For each task worked this session, append a row to the relevant milestone register:

| Date | ID | Task | Status | Evidence | Notes |
|---|---|---|---|---|---|

- **ID** is stable and never reused across milestones (e.g. `M1-05`).
- **Evidence** must be concrete: a passing test/`tsc`, a file name, "traced statically, not executed", or an error.
- **Notes** may record the student's reasoning and what was agreed (like the coaching register).
- Status changes: ADD a new row with the new status — never edit the old one.
