# 03 - Schema Status Register

The living record of the coaching loop. The agent updates this file at the end of every session. Append-only: when a story changes status, ADD a new row - never edit or delete an old one.

Status values: UNTESTED / PASS / FAIL / FIXED / BLOCKED

## How to update

For each story checked this session, add a row:
| Date | Story | Status | Evidence | Notes |

Evidence must be concrete: the query result, "traced statically, not executed", or the error message. Notes may include the student's articulation of the gap (their own words) and what was agreed.

## Register

| Date | Story | Status | Evidence | Notes |
|---|---|---|---|---|
| (first run) | S01 | UNTESTED | | |
| | S02 | UNTESTED | | |
| | S03 | UNTESTED | | |
| | S04 | UNTESTED | | |
| | S05 | UNTESTED | | |
| | S06 | UNTESTED | | |
| | S07 | UNTESTED | | |
| | S08 | UNTESTED | | |
| | S09 | UNTESTED | | |
| | S10 | UNTESTED | | |
| | S11 | UNTESTED | | |
| | S12 | UNTESTED | | |
| | S13 | UNTESTED | | |
| | S14 | UNTESTED | | |
| | S15 | UNTESTED | | |
| | S16 | UNTESTED | | |
| | S17 | UNTESTED | | |
| | S18 | UNTESTED | | |
| | S19 | UNTESTED | | |
| | S20 | UNTESTED | | |
| | S21 | UNTESTED | | |
| | S22 | UNTESTED | | |
| | S23 | UNTESTED | | |
| | S24 | UNTESTED | | |
| | S25 | UNTESTED | | |
| | S26 | UNTESTED | | |
| | S27 | UNTESTED | | |
| | S28 | UNTESTED | | |
| | S29 | UNTESTED | | |

## Session 2026-08-30 — live verification via `services/verify-schema.ts`

Ran `services/verify-schema.ts` (Engine A) against live Supabase. 20 checks, 20 PASS. Reproducible with `npm run verify`.

| Date | Story | Status | Evidence | Notes |
|---|---|---|---|---|
| 2026-08-30 | S01 | PASS | `profiles` table present with `user_id` | onboarding derived from profile existence |
| 2026-08-30 | S02 | PASS | `users` has `google_identity/email/display_name`, no `password` column | Engine A probe; Engine B introspection optional (needs `SUPABASE_DB_URL`) |
| 2026-08-30 | S03 | PASS | `profiles` has 5 research fields | nullable |
| 2026-08-30 | S06 | PASS | chapters count=20; has order_index/title/page_range/content_group/colour_token | |
| 2026-08-30 | S08 | PASS | exercises count=35; categories breathing=3,somatic=11,sensory=8,voice=4,mindful=2,crisis=7 | 6 contract categories, none missing/extra |
| 2026-08-30 | S09 | PASS | `steps` column present | |
| 2026-08-30 | S11 | PASS | exercise_type='crisis'=7; category='crisis'=7 | both filters satisfied |
| 2026-08-30 | S14 | PASS | `distress_before`/`distress_after` present | |
| 2026-08-30 | S15 | PASS | `helpfulness` present | |
| 2026-08-30 | S16 | PASS | `exercise_session_tags` present; system tags=grounding,anxious,mood | S16/S20 |
| 2026-08-30 | S19 | PASS | journal_entries has body/prompt_id; no session_id | journal independent of session |
| 2026-08-30 | S20 | PASS | `journal_entry_tags` present | |
| 2026-08-30 | S23 | PASS | prompts count=3; has prompt_text/chapter_id | |
| 2026-08-30 | S25 | PASS | checkins has ns_state/survival_response/triggers/note | |
| 2026-08-30 | S07 | PASS | no PDF in git index (tracked) | engine A; history still holds it → S28 open |

### Not yet verified / needs a second step

| Date | Story | Status | Notes |
|---|---|---|---|
| 2026-08-30 | S04 | BLOCKED | RLS isolation — run `npm run verify:rls` (creates/deletes 2 test users). Not run this session. |
| 2026-08-30 | S05 | BLOCKED | cascade delete — same `--rls` path. Not run this session. |
| 2026-08-30 | S26 | UNTESTED | no mood/trend view — Engine B introspection only (needs `SUPABASE_DB_URL`). Static-trace pass, not executed. |
| 2026-08-30 | S27 | UNTESTED | PII separation — Engine B only (needs `SUPABASE_DB_URL`). |
| 2026-08-30 | S29 | UNTESTED | timestamps on all user-data tables — Engine B only. |
| 2026-08-30 | S10/S12/S13/S17/S18/S21/S22/S24 | UNTESTED | remaining; cover sequence constraints, session lifecycle, edit window, per-day limits — mostly static/Engine B.

## Session 2026-08-30 (2) — RLS fixed; S04/S05 now PASS

Root cause of the earlier S04 failure: a stale `checkins` INSERT policy in the live DB rejected owner
inserts (`new row violates row-level security policy`), even though schema, `users` row and `auth.uid()`
were all correct. Fixed by rewriting `supabase/rls.sql` with **idempotent per-operation policies**
(`drop policy if exists` + explicit `select`/`insert`/`update`/`delete` per user-data table), applied in the
SQL editor. Verified on the live instance.

| Date | Story | Status | Evidence | Notes |
|---|---|---|---|---|
| 2026-08-30 | S04 | PASS | `npm run verify:rls` → user A count=1, rows with note='b' seen by A=0 | two-user isolation now holds |
| 2026-08-30 | S05 | PASS | cascade delete → orphaned checkins for A=0 | delete-user cascades cleanly |
| 2026-08-30 | — | PASS | seed re-ran: 20 chapters / 35 exercises / 3 prompts / 3 system tags | unaffected by RLS change |
| 2026-08-30 | — | PASS | full run: 22 checks, 22 PASS | `npm run verify:rls` |

**Remaining schema-coaching stories still UNTESTED** (need `SUPABASE_DB_URL` for Engine B introspection):
S26, S27, S29, and the sequence/static stories (S10/S12/S13/S17/S18/S21/S22/S24).

## Session 2026-09-05 — personas + lifecycle checks; 29/29 PASS

Ran `services/personas.ts` (3 persona users) then extended `services/verify-schema.ts` with Engine A2
data-driven lifecycle checks. Verification now **29 checks, 29 PASS** (`npm run verify:rls`).

| Date | Story | Status | Evidence | Notes |
|---|---|---|---|---|
| 2026-09-05 | S17 | PASS | own sessions=10, newest-first, exercise join present | persona data (active) |
| 2026-09-05 | S18 | PASS | two same-day session inserts both succeed | no (user,day,exercise) uniqueness |
| 2026-09-05 | S19 | PASS | journal entry inserted independent of any session | no required session FK |
| 2026-09-05 | S20 | PASS | journal tag attach succeeded (system tag 'anxious') | |
| 2026-09-05 | S21 | PASS | journal_entries has created_at + updated_at | edit-window computable |
| 2026-09-05 | S22 | PASS | delete one entry: before=11 after=10, others intact | |
| 2026-09-05 | S24 | PASS | two same-day journal entries both succeed | no (user,day) uniqueness |

**Still UNTESTED (need `SUPABASE_DB_URL` for Engine B):** S26 (no mood view), S27 (PII separation),
S29 (timestamps all user-data tables), and schema-only S10/S12/S13.

**Auth/export changes recorded (not schema-test failures):** Google-only auth (S02) reconciled in code
(`lib/auth.ts`); anonymisation function (S05/D13) added as `supabase/anonymise.sql` (run in SQL editor).

## Open questions for Aamir

(Anything the agent cannot resolve from the stories, the workbook, or the schema. The student brings these to supervision.)

## Fixed this session

(Chronological log of fixes made during this session, with the story ID.)
