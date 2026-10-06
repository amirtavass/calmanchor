# M3 — Full Feature Set

**Deliverable:** Mood tracking, educational content, remaining workbook sections, offline-first behaviour
**Due:** Sun 13 Sep · **Payment:** 30% · **Status:** IN_PROGRESS

## Task register

| Date | ID | Task | Status | Evidence | Notes |
|---|---|---|---|---|---|
| — | M3-01 | Dashboard (Pattern Dashboard) — 4 descriptive charts: trigger frequency, response distribution, exercise effectiveness, time-of-day patterns | TODO | — | Source `checkins`, `exercise_sessions`, raw distress/helpfulness — **no user-facing mood trend** (S26/D03). **Parked:** needs Aamir to define which raw descriptive counts are allowed; the §11 weekly window chart is the only approved chart (see 2026-10-03 changelog). |
| 2026-10-03 | M3-02 | Daily check-in — home card: ns_state, survival_response, triggers → `saveCheckin` | DONE | `components/CheckInCard.tsx`, `app/(tabs)/index.tsx` (Today's plan stepper), `types/checkin.ts` | S25; optional note + trigger behind "Add more detail"; sign-in at save (S01); append-only so the card offers "Check in again" (D05). |
| 2026-10-03 | M3-03 | Streaks/stats — session count, streak, window-of-tolerance % from `exercise_sessions` | DONE | `lib/db.ts` `getDashboardStats()`, `app/(tabs)/index.tsx` | Mocks removed (`"12"`, `"5d"`, dummy `thisWeek`, `67%`); dashes + skeleton instead of fabricated numbers. **Streak = exercise sessions only — confirmed by Aamir 2026-10-03.** Weekly bars carry `checkins.ns_state`, not a wellbeing metric. |
| 2026-10-03 | M3-04 | Portfolio tab — favourited exercises, safe-space notes, custom strategies (new tables: `favourites`, `safe_space_notes`, `custom_strategies`) | DONE | `app/(tabs)/portfolio.tsx`, `app/exercise/[id].tsx` (★ toggle), `lib/db.ts`, `supabase/2026-10-03-portfolio.sql`, `schema.sql`/`rls.sql` | Tables follow existing conventions (owner-only RLS per-op, timestamps, ON DELETE CASCADE). **Migration applied to live 2026-10-03 — `npm run verify` 50/50.** Aamir to confirm the three shapes (not in S01–S29; ADR-011). `introspection.sql`'s hardcoded table list also updated. Reorder/drag not built (design-system calls for it) — deferred. |
| — | M3-05 | Remaining workbook sections — educational content for Learn, Reframe, Relationships groups | BLOCKED | — | **Deferred by decision (2026-10-03) — to be decided and built later.** Not started and nothing invented for these chapters. Content must come from the workbook (S23: prompts grounded in the workbook's own reflection questions, "not agent-generated artifacts"), and the toolkit PDF is not machine-readable in the build environment. Open question registered in `../07-questions-for-aamir.md`; no approach chosen yet — **do not build this until Aamir decides.** |
| — | M3-06 | Checklists — activate `checklist_items`/`checklist_progress`, self-assessment UI | TODO | — | — |
| 2026-10-03 | M3-07 | Offline-first — `expo-sqlite` + `drizzle-orm`, local cache primary; swap `lib/db.ts` internals; Supabase opt-in backup | DONE | `lib/offline/*`, `lib/id.ts`, `lib/db.ts`, `docs/decisions/ADR-012-offline-cache-and-outbox.md` | **Scope decided with Aamir (ADR-012): local cache + write-behind outbox**, not "Supabase opt-in backup" — the latter would break S02/S04. `lib/db.ts` API unchanged; client-generated keys make replay idempotent; SQLite optional (degrades to online). Needs a dev-client rebuild (`expo-sqlite` is native). Device offline test still to run. |
| 2026-10-03 | M3-08 | Onboarding — 7 gentle, skippable steps (supporting feature) | DONE | `app/onboarding.tsx`, `lib/onboarding.ts`, `lib/crisisContacts.ts`, `app/_layout.tsx` (first-launch gate) | Tech-spec §3.8 steps verbatim. No progress bar, no login, no data collected (flag in AsyncStorage). **Deviation:** step 3 is a tappable zone band, not a slider — keeps it informational, not evaluative. Revisitable from Profile. |
| 2026-10-03 | M3-09 | Export (supporting) — user CSV export of diary, triggers, portfolio | DONE | `app/profile/export.tsx`, `lib/export.ts`, `app/profile/index.tsx` | **Delivers M4-07 too.** Spec columns mapped to the real schema (recorded); CSV only, not CSV/Excel (recorded). Local file to Downloads/Documents + share sheet. Distinct from the research export (S27). |

## Status values

`TODO / IN_PROGRESS / DONE / BLOCKED` — see `../README.md`.
