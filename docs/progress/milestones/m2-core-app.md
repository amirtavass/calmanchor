# M2 — Core App End to End

**Deliverable:** Patient journal and toolkit browser functional on both platforms
**Due:** Sun 6 Sep · **Payment:** 30% · **Status:** IN_PROGRESS

## Plan (2 Sep meeting + milestone + screen-mapping note)

- **A. Data & schema hardening** (before UI) — M2-07..M2-10, DONE this session (Engine B still blocked).
- **B. Screen mapping** — shell + exercises done in M1 (M1-21); Toolkit, Diary, Home/check-in, Crisis,
  Profile mapping + ASCII moved to M2 (M2-11/M2-12).
- **C. UI build** (Material 3, D14) — design-aware tokens reconciled (M2-13); bottom-tab shell + crisis
  FAB + avatar (M2-14); Toolkit/Diary/Exercises tabs (M2-01..M2-04).
- **D. Verification** (build gate, build-practices §4) — acceptance + UI-contract cross-check (M2-15);
  cross-platform QA (M2-06); tsc/seed/verify + sign-off (M2-16).

## Task register

| Date | ID | Task | Status | Evidence | Notes |
|---|---|---|---|---|---|
| — | M2-01 | Toolkit tab — PDF viewer (`react-native-pdf`), chapter nav list from `chapters`, tap chapter → jump to page | TODO | — | Uses `lib/toolkit.ts` (ADR-001). |
| — | M2-02 | Diary tab — show 3 seeded prompts, create/view entries via `saveJournalEntry`/`getJournalEntries` | TODO | — | Prompt table is now `prompts`, not `journal_prompts`. |
| — | M2-03 | Exercises tab — list grouped by 6 categories (`breathing, somatic, sensory, voice, mindful, crisis`), detail screen with steps + duration | TODO | — | Category taxonomy finalised in M1-07 (contract S08 names). |
| — | M2-04 | Exercise session flow — start → timer/steps → pre/post distress → helpfulness → `saveSession` | TODO | — | Session table is `exercise_sessions`; fields `distress_before/after`, `helpfulness`. |
| — | M2-05 | Trigger tracker — within Diary, log triggers (timestamp, trigger name, ns_state, survival_response, note) | TODO | — | — |
| — | M2-06 | Cross-platform QA — iOS + Android, safe areas, keyboard, back behavior | TODO | — | M2 acceptance is "both platforms". |
| 2026-09-05 | M2-07 | Personas dummy data — active / power / infrequent (A) | DONE | `services/personas.ts`, `npm run personas` → 3 users + profiles/checkins/sessions/journal | 2 Sep meeting: populate DB before UI. Idempotent (cleans by email prefix first). |
| 2026-09-05 | M2-08 | Schema stress-test vs 29 stories; Engine A2 lifecycle checks (A) | IN_PROGRESS | `npm run verify:rls` → 29/29 PASS | S26/S27/S29 still UNTESTED — Engine B blocked on `SUPABASE_DB_URL` (add to `.env`). |
| 2026-09-05 | M2-09 | Google-only auth reconcile — silent anonymous removed (A) | DONE | `lib/auth.ts` (`signInWithGoogle`, `ensureSignedIn`, no `signInAnonymously`), `lib/db.ts` guards | Browse-first (S01): prompt at first exercise attempt. Supabase Google provider + deep link `calmanchor://auth/callback` to verify on device. |
| 2026-09-05 | M2-10 | Anonymisation S05/D13 (UUID rotation) + single-entry delete S22 (A) | DONE | `supabase/anonymise.sql` (`anonymise_user()`), `anonymiseMyData()`, `deleteJournalEntry()` | Run `anonymise.sql` in SQL editor — only new SQL this session; `schema.sql`/`rls.sql` unchanged. |
| — | M2-11 | Screen mapping → Toolkit, Diary, Home/check-in, Crisis, Profile (B) | TODO | — | From M1-21; 3–5 actions per screen + journey verticals (first-touch/learn/find/do/reflect/check-in/review/privacy). |
| — | M2-12 | ASCII proposals: remaining screens + null/no-data/error/edge states (B) | TODO | — | Build-practices §3; extend `docs/ui/sections/`. |
| 2026-09-05 | M2-13 | Design-system dark tokens reconciled to designsystemtext.txt v2.0 (C) | DONE | `design-system/calm-anchor-design-system.css`; `theme/tokens.ts` verified | Only divergence was the CSS dark palette (ns/sr/mood/ex/text-muted). |
| — | M2-14 | Bottom-tab shell (Material 3) + persistent Crisis FAB + header avatar (C) | TODO | — | Absorbs M1-13/M1-14; D14 (no hamburger). |
| — | M2-15 | Acceptance-criteria + UI-contract cross-check per screen (D) | TODO | — | One H1, two button shapes, one colour vocabulary per metric, text-never-colour-only. |
| — | M2-16 | tsc/seed/verify after each phase + sign-off checkpoint (D) | TODO | — | `npx tsc --noEmit` · `npm run personas` · `npm run verify:rls`. Gate before M3. |

## Status values

`TODO / IN_PROGRESS / DONE / BLOCKED` — see `../README.md`.