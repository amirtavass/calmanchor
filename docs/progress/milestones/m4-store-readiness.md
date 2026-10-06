# M4 — Store Readiness

**Deliverable:** Final polish, store assets and listings, submission-ready review package
**Due:** Sun 20 Sep · **Payment:** 20% · **Status:** TODO

## Task register

| Date | ID | Task | Status | Evidence | Notes |
|---|---|---|---|---|---|
| 2026-10-03 | M4-01 | Visual QA — every screen in light + dark, verify all design tokens render | IN_PROGRESS | Code-level pass done: `components/CrisisFab.tsx` hardcoded light-only red → `c.error`/`c.textInverse`; no hardcoded hex outside `theme/tokens.ts` + RN `shadowColor`; no US spellings or pressure language in new copy. | **Device pass still required** — walk every screen in light + dark on a real device before sign-off. |
| 2026-10-03 | M4-02 | Cross-platform QA — iOS safe areas, Android hardware back, status bar, navigation stack | IN_PROGRESS | Code-level pass done: `useSafeAreaInsets` on every screen, `onRequestClose` on modals, Home ScrollView given `KeyboardAvoidingView` + `automaticallyAdjustKeyboardInsets` (was missing — check-in note field could hide behind the keyboard). | **Device pass still required** (Android + iOS). Also the outstanding M2-06 gate. |
| — | M4-03 | Custom fonts — Cabinet Grotesk (display) + Satoshi (body) via `expo-font` | TODO | — | System fonts for M1; swap in M4. |
| — | M4-04 | App Store assets — icon 1024×1024, splash, screenshots (iPhone/iPad/Android), description, privacy policy | TODO | — | — |
| — | M4-05 | Play Store assets — feature graphic, screenshots, content rating, data safety | TODO | — | — |
| — | M4-06 | Build and submit — EAS Build, test release builds, App Store Connect + Play Console | TODO | — | — |
| 2026-10-03 | M4-07 | Data export — user-initiated CSV export (diary, triggers, portfolio) | DONE | `app/profile/export.tsx`, `lib/export.ts` | Landed as part of M3-09. See the M3 register for the recorded column/format deviations. |
| — | M4-08 | Documentation — README, architecture overview, known limitations | TODO | — | — |

## Status values

`TODO / IN_PROGRESS / DONE / BLOCKED` — see `../README.md`.
