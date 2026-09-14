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
| 2026-09-13 | M2-02 | Diary tab — show 3 seeded prompts, create/view entries via `saveJournalEntry`/`getJournalEntries` | DONE | `app/(tabs)/diary.tsx`, `app/diary/new.tsx`, `app/diary/[id].tsx`; `lib/db.ts` (getPrompts, updateJournalEntry, setJournalEntryTags, entry tags in getJournalEntries) | S19–S24; edit window (S21) + delete (S22) wired. |
| 2026-09-11 | M2-03 | Exercises tab — list grouped by 6 categories (`breathing, somatic, sensory, voice, mindful, crisis`), detail screen with steps + duration | DONE | `app/(tabs)/exercises.tsx`, `app/exercise/*` | — |
| 2026-09-11 | M2-04 | Exercise session flow — start → timer/steps → pre/post distress → helpfulness → `saveSession` | DONE | `app/exercise/session/[id].tsx` | — |
| — | M2-05 | Trigger tracker — within Diary, log triggers (timestamp, trigger name, ns_state, survival_response, note) | TODO | — | — |
| — | M2-06 | Cross-platform QA — iOS + Android, safe areas, keyboard, back behavior | TODO | — | M2 acceptance is "both platforms". |
| 2026-09-05 | M2-07 | Personas dummy data — active / power / infrequent (A) | DONE | `services/personas.ts`, `npm run personas` → 3 users + profiles/checkins/sessions/journal | 2 Sep meeting: populate DB before UI. Idempotent (cleans by email prefix first). |
| 2026-09-11 | M2-08 | Schema stress-test vs 29 stories; Engine A2 lifecycle checks (A) | DONE | `npm run verify:rls` → 46/46 PASS | Engine B (S26/S27/S29 + S02/S04 rows) runs via `get_schema_introspection()` RPC (service-role key) — no `SUPABASE_DB_URL`. ADR-010. Direct DB access deferred (password/IPv6 issue), not abandoned. |
| 2026-09-05 | M2-09 | Google-only auth reconcile — silent anonymous removed (A) | DONE | `lib/auth.ts` (`signInWithGoogle`, `ensureSignedIn`, no `signInAnonymously`), `lib/db.ts` guards | Browse-first (S01): prompt at first exercise attempt. Supabase Google provider + deep link `calmanchor://auth/callback` to verify on device. |
| 2026-09-05 | M2-10 | Anonymisation S05/D13 (UUID rotation) + single-entry delete S22 (A) | DONE | `supabase/anonymise.sql` (`anonymise_user()`), `anonymiseMyData()`, `deleteJournalEntry()` | Run `anonymise.sql` in SQL editor — only new SQL this session; `schema.sql`/`rls.sql` unchanged. |
| — | M2-11 | Screen mapping → Toolkit, Diary, Home/check-in, Crisis, Profile (B) | TODO | — | From M1-21; 3–5 actions per screen + journey verticals (first-touch/learn/find/do/reflect/check-in/review/privacy). |
| — | M2-12 | ASCII proposals: remaining screens + null/no-data/error/edge states (B) | TODO | — | Build-practices §3; extend `docs/ui/sections/`. |
| 2026-09-05 | M2-13 | Design-system dark tokens reconciled to designsystemtext.txt v2.0 (C) | DONE | `design-system/calm-anchor-design-system.css`; `theme/tokens.ts` verified | Only divergence was the CSS dark palette (ns/sr/mood/ex/text-muted). |
| 2026-09-11 | M2-14 | Bottom-tab shell (Material 3) + persistent Crisis FAB + header avatar (C) | DONE | `app/(tabs)/_layout.tsx`, `components/CrisisFab.tsx`, `components/ScreenHeader.tsx` | D14 (no hamburger). |
| 2026-09-13 | M2-15 | Acceptance-criteria + UI-contract cross-check per screen (D) | DONE | Home + Diary shipped per `docs/ui/03-screen-craft.md` checklist; tsc + expo export clean | One H1, two button shapes, one colour vocabulary per metric, text-never-colour-only. |
| 2026-09-13 | M2-16 | tsc/seed/verify after each phase + sign-off checkpoint (D) | DONE | `npx tsc --noEmit` (EXIT 0), `npx expo export --platform android` (EXIT 0) | Gate before M3. |
| 2026-09-13 | M2-17 | Home/dashboard tab — design-system §21 Composite 1 (greeting + date, stats, today's plan, quick actions, recent, CTA) | DONE | `app/(tabs)/index.tsx` | Sessions stat + recent wired to real data when signed in; Streak/Window "—" until M3. |
| 2026-09-14 | M2-18 | Mentor-feedback polish: dashboard §11 weekly chart + dummy streak/window + warm reminder; diary distinct prompt icons + bolder text + de-dup CTA; diary/new whole-chip Pressable + KAV behaviour "height" + prompts-optional info-badge; session helpfulness as colour-field tiles | DONE | `app/(tabs)/index.tsx`, `app/(tabs)/diary.tsx`, `app/diary/new.tsx`, `app/exercise/session/[id].tsx` | Polish pass before demo. tsc + expo export clean. |
| 2026-09-15 | M2-19 | Dark-mode toggle (3-way: light / dark / system, persisted) on every screen via ScreenHeader; green toned down (`secondary` for CTAs, `accent` for soft greens); diary/new prompts as TextInput placeholder + collapsible picker + back button; session helpfulness strong-tone tiles + Skip outlined | DONE | `theme/ThemeContext.tsx`, `components/ThemeToggle.tsx`, `components/ScreenHeader.tsx`, `app/(tabs)/*`, `app/diary/new.tsx`, `app/exercise/session/[id].tsx` | tsc + expo export clean. |
| 2026-09-16 | M2-20 | Avatar removed from ScreenHeader; dashboard greeting card anchored at the bottom (warm-gold, time-of-day icon, supportive sentence, chevron → /profile); ThemeToggle simplified to light/dark only; light-mode contrast bumped (`textMuted` #5A5645→#4A4536, `textFaint` #9C9583→#6E6857); diary/new placeholder colour aligned to screen (`textMuted`/`secondary`); borrowed design-system §17 loaders (`M3Skeleton`, `M3Spinner`, `ExerciseLoadingScreen`) and used in exercise + diary; session helpfulness tiles always-on 1dp border + press feedback; session nav buttons moved to `secondaryActive` (#4A4230) for proper contrast | DONE | `components/ScreenHeader.tsx`, `components/ThemeToggle.tsx`, `components/M3Skeleton.tsx`, `components/M3Spinner.tsx`, `components/ExerciseLoadingScreen.tsx`, `theme/tokens.ts`, `app/(tabs)/index.tsx`, `app/(tabs)/diary.tsx`, `app/exercise/[id].tsx`, `app/exercise/category/[key].tsx`, `app/exercise/session/[id].tsx`, `app/diary/new.tsx` | tsc + expo export clean. |

## Status values

`TODO / IN_PROGRESS / DONE / BLOCKED` — see `../README.md`.