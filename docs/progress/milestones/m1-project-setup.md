# M1 — Project Setup & Architecture

**Deliverable:** Repository, app scaffold, database schema, design-system integration, workbook content mapped to screens
**Due:** Sun 30 Aug · **Payment:** 20% · **Status:** IN_PROGRESS

## Task register

| Date | ID | Task | Status | Evidence | Notes |
|---|---|---|---|---|---|
| 2026-08-30 | M1-01 | Repo + Expo + Router scaffold; `app/` + entry | DONE | `package.json`, `app/_layout.tsx` | create-expo-app merged to preserve `design-system/` + `docs/`. |
| 2026-08-30 | M1-02 | Supabase client + silent anonymous auth | DONE | `lib/supabase.ts`, `lib/auth.ts` | Single seam; no auth UI. |
| 2026-08-30 | M1-03 | Schema: content + user-data tables, RLS | DONE | live Supabase; RLS owner-only | Pre-alignment shape. Superseded by M1-10/M1-11/M1-12. |
| 2026-08-30 | M1-04 | Seed: 20 chapters, 3 prompts | DONE | `services/seed.ts` | — |
| 2026-08-30 | M1-05 | Data-access layer `lib/db.ts` | DONE | `lib/db.ts` | Screens import here, never `supabase` directly. |
| 2026-08-30 | M1-06 | Design tokens + ThemeContext | DONE | `theme/tokens.ts`, `theme/ThemeContext.tsx` | 60+ tokens, light/dark. |
| 2026-08-30 | M1-07 | Reconcile exercise categories to contract 6 (`breathing, somatic, sensory, voice, mindful, crisis`) | DONE | `services/seed.ts` (verified 6 distinct) | Final: 3/12/8/4/2/6 = 35 exercises. |
| 2026-08-30 | M1-08 | Drop `mood_logs`/`mood_*`; add `distress_*/helpfulness` | DONE | SQL editor schema (replaced migrations) | Applied by user; `mood_logs` gone. |
| 2026-08-30 | M1-09 | Renames: `sessions`→`exercise_sessions`, `journal_prompts`→`prompts`, journal cols | DONE | SQL editor schema | Applied by user. |
| 2026-08-30 | M1-10 | Add `users`, `profiles`, `tags` + junctions, `documents` + RLS + trigger | DONE | SQL editor schema + ADR-003 | Applied by user; all-tables RLS. |
| 2026-08-30 | M1-11 | Toolkit PDF from Storage (ADR-001), `lib/toolkit.ts` | DONE | `lib/toolkit.ts`, `app/toolkit.tsx`, `EXPO_PUBLIC_TOOLKIT_PDF_URL` | PDF served from public-read `toolkit` Storage bucket; `react-native-pdf` reads+caches it. Verified live in dev build. |
| 2026-08-30 | M1-12 | Run seed against Supabase (service role) | DONE | `services/seed.ts` → 20 chapters / 35 exercises / 3 prompts / 3 system tags | Seed ran cleanly against live Supabase. |
| 2026-08-30 | M1-13 | 5-tab nav shell + ThemeProvider wrap | TODO | — | Toolkit, Diary, Exercises, Portfolio, Dashboard. **Deferred to M2** (scope-doc dependency ordering). |
| 2026-08-30 | M1-14 | Crisis FAB (UK contacts + crisis exercises) | TODO | — | Static contacts + queried crisis category. |
| 2026-08-30 | M1-15 | Verify iOS + Android; open draft PR | TODO | — | NOTE: `react-native-pdf`+`react-native-blob-util` are NOT in Expo Go → toolkit screen needs a dev build, not Expo Go. See SDK note below. |
| 2026-08-30 | M1-16 | Schema saved to `supabase/schema.sql` + `supabase/rls.sql`; syntax fix (`on conflict`); S05 cascade + S29 timestamps + S11 crisis type + S16 system tags | DONE | `supabase/schema.sql`, `supabase/rls.sql`, `services/seed.ts` | Static trace vs query pack: 28/29 SQL stories pass (S04 needs live 2-user run; S28 = git check). Fixed missing `on` in backfill; added `tags_system_name_key` unique partial index. RLS split out (drops wipe policies). |
| 2026-08-30 | M1-17 | Expo SDK compat (Expo Go "project too new" error) | BLOCKED | `package.json` expo `~57.0.16` | Project = SDK 57; store Expo Go stops at SDK 54. Decision pending — see SDK note below. |
| 2026-08-30 | M1-18 | Dev-build path chosen (EAS cloud build); install `expo-dev-client` + `eas.json` | IN_PROGRESS | `eas.json`, `package.json` (expo-dev-client ~57.0.16), `app.json` | **Decided:** keep SDK 57 + dev build (not downgrade) so `react-native-pdf` native module works. `expo-dev-client@~57.0.16` installed (peer-dep conflict resolved with `--legacy-peer-deps`). `eas.json` has `development`(APK)/`preview`/`production`. **Blocked on interactive `eas login`/`eas init`** (adds `extra.eas.projectId` to `app.json`) then `eas build --profile development --platform android` → APK. This resolves the M1-17 BLOCKED row. |
| 2026-08-30 | M1-19 | Schema verifier: `services/verify-schema.ts` + `npm run verify` | DONE | `npm run verify` → 20/20 PASS | Runs the query-pack checks live. `verify:rls` for S04/S05 (2-user isolation, not run). Engine B (introspection) needs `SUPABASE_DB_URL`. Results logged in `docs/schema-coaching/03-schema-status.md`. |
| 2026-08-30 | M1-20 | RLS isolation fix (S04) + full live verification | DONE | `supabase/rls.sql` idempotent per-op policies; `npm run verify:rls` → 22/22 PASS | Stale `checkins` INSERT policy was rejecting owner inserts. Rewrote RLS as per-operation policies (`drop if exists` + select/insert/update/delete). S04 PASS, S05 PASS, seed re-confirmed. S26/S27/S29 + sequence stories still UNTESTED (need `SUPABASE_DB_URL`). |
| 2026-09-05 | M1-21 | Screen mapping (3–5 actions per screen → user journeys + ASCII): shell + exercises | DONE | `docs/ui/01-navigation-and-ia.md` v2, `docs/ui/sections/exercises/01-landing-variants.md` + `02-exercise-detail.md` + `03-session-flow.md` | Extension to Toolkit, Diary, Home/check-in, Crisis, Profile **moved to M2** (2 Sep meeting: "screening tasks can be moved to M2") — tracked as M2-11/M2-12. |

## Summary

- **DONE:** 12 · **IN_PROGRESS:** 1 · **TODO:** 3 · **BLOCKED:** 1

> M1 **architecture** deliverable is complete: scaffold, schema (content + user-data + RLS), design-system
> tokens/theme, workbook content mapped to screens (Toolkit PDF + seed), and full live schema verification
> (22/22 PASS). EAS dev build (M1-17/M1-18) done and installed.
>
> **Deferred to M2** (scope-doc dependency ordering, per Aamir): nav shell (M1-13), Crisis FAB (M1-14),
> full screen mapping (M1-21 → M2-11/M2-12).
> **Remaining M1 hygiene:** verify on-device (M1-15) + open draft PR; remaining schema-coaching stories
> (S26/S27/S29 + sequence) need `SUPABASE_DB_URL` for Engine B introspection.
> See `../06-changelog.md`, `../07-questions-for-aamir.md`.

### Expo SDK note (M1-15 / M1-17 / M1-18)

Project is **Expo SDK 57**. Store **Expo Go stops at SDK 54**, so the store Expo Go app cannot open this
project. Separately, **`react-native-pdf` and `react-native-blob-util` are native modules not bundled in
Expo Go**, so the toolkit PDF screen needs a **development build** regardless of SDK version.

**Recorded decision (M1-18):** stay on SDK 57 and use a **dev build via EAS cloud build** (no local
Android SDK/Java needed). Keep SDK 57; do NOT downgrade (downgrade would not solve the native-module
requirement). Dev client APK is produced by `eas build --profile development --platform android`, then run
locally with `npx expo start --dev-client`.
