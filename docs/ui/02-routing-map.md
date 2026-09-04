# CalmAnchor — Route Map (architecture view)

File-based routing via **Expo Router** (`app/` = routes). This maps the agreed UI pattern (bottom tabs
+ Crisis FAB + header avatar) to routes and to the `lib/db.ts` data layer. Placeholders are noted
`(M3)` — build as dummy/empty routes now, wire them later.

Legend: `(tabs)` = bottom-tab group · `(modal)` = full-screen push over tabs · `[id]` = dynamic segment.

---

## 1. Route tree

```
app/
├─ _layout.tsx                    Root Stack + ThemeProvider + StatusBar (wrap ThemeProvider)
│
├─ (tabs)/                        ← BOTTOM TAB SHELL (4–5 tabs, always visible)
│  ├─ _layout.tsx                 Tabs navigator + <CrisisFab/> overlay (floats above tabs)
│  ├─ index.tsx                   HOME / CHECK-IN  (landing tab)
│  ├─ toolkit.tsx                 READ  — Toolkit browser (PDF + chapter nav)        ✅ exists (app/toolkit.tsx)
│  ├─ exercises.tsx               DO    — Exercise catalogue by category
│  ├─ diary.tsx                   ADD   — Journal (prompts + entries)
│  ├─ portfolio.tsx               MY STUFF — Portfolio (M3 placeholder)
│  └─ dashboard.tsx               REVIEW — Pattern Dashboard (M3 placeholder)
│
├─ crisis/                        (modal)  ← CRISIS FAB target — always one tap away
│  ├─ _layout.tsx                 Minimal full-screen modal (no tab bar, no header)
│  ├─ index.tsx                   Landing: Ground / Breathe / Quick Reset + UK contacts
│  ├─ ground.tsx                  5-4-3-2-1 sensory grounding
│  ├─ breathe.tsx                 Box breathing (4-4-4-4)
│  └─ reset.tsx                   "My Quick Reset" (top-rated from Portfolio)
│
├─ exercise/                      (stack, pushed over tabs)
│  ├─ [id].tsx                    Exercise detail (title, category, steps, duration)
│  └─ session/[id].tsx            Guided session (timer/steps → distress pre/post → helpfulness → save)
│
├─ diary/                         (stack)
│  ├─ new.tsx                     Compose entry (optional prompt + body)
│  └─ [id].tsx                    View / edit (within window) / delete
│
├─ profile/                       (stack, pushed over tabs from header avatar)
│  ├─ index.tsx                   Profile overview (research fields, privacy links)
│  ├─ settings.tsx                App settings (theme, font size, etc.)
│  ├─ data.tsx                    Export / delete-my-data (S05/S27)
│  └─ about.tsx                   About / crisis contacts / toolkit info
│
└─ onboarding/                    (M3, first-launch only)
   ├─ _layout.tsx
   └─ index.tsx                   7-step welcome (skippable) → S01/S03
```

---

## 2. Tabs / sections ↔ what gets done ↔ routes

| Section | What the user does | Route | Data call (`lib/db.ts`) | Milestone |
|---|---|---|---|---|
| **Home / Check-in** | Daily check-in card: pick ns_state, survival response, triggers, note; quick relief shortcuts; today's reflection | `(tabs)/index.tsx` | `saveCheckin()`, `getCheckins()` | M3 (card can render statically now) |
| **Toolkit** | Browse 20 chapters, open workbook PDF, jump to a chapter | `(tabs)/toolkit.tsx` | `getChapters()`, `lib/toolkit.ts` (`TOOLKIT_URL`) | M2 (PDF already works) |
| **Exercises** | Browse by 6 categories, open an exercise's steps, start a session | `(tabs)/exercises.tsx` → `exercise/[id]` | `getAllExercises()`, `getExercisesByCategory()` | M2 |
| **Diary** | See 3 prompts, write/view/edit/delete entries, tag them | `(tabs)/diary.tsx` → `diary/new` → `diary/[id]` | `getJournalEntries()`, `saveJournalEntry()`, `getSystemTags()`, `createUserTag()` | M2 |
| **Portfolio** | Favourited exercises, safe-space notes, custom strategies | `(tabs)/portfolio.tsx` | (M3 tables: favourites, safe_space_notes, custom_strategies) | M3 placeholder |
| **Dashboard** | Pattern Dashboard — 4 descriptive charts (no mood trends, S26) | `(tabs)/dashboard.tsx` | `getSessions()`, `getCheckins()` (raw) | M3 placeholder |
| **Crisis FAB** | One-tap grounding: 5-4-3-2-1 / box breathing / quick reset + UK contacts | `crisis/*` (modal) | static contacts + `exercises` crisis rows (S11) | M1/M2 |
| **Profile / Settings** | Research profile (S03), settings, export, delete-my-data, about | `profile/*` (from header avatar) | `getCurrentProfile()`, `saveProfile()` | M2/M3 |

---

## 3. Stack routes (pushed over tabs) — detail

| Route | What happens | Data call | Milestone |
|---|---|---|---|
| `exercise/[id].tsx` | Show exercise title/category/steps/duration; "Start" button | `getAllExercises()` (filter id) | M2 |
| `exercise/session/[id].tsx` | Guided session: step-by-step timer → distress_before → do → distress_after → helpfulness → note → confirm → save | `saveSession()` (`exercise_sessions` + distress/helpfulness) | M2 |
| `diary/new.tsx` | Optional prompt (from 3 seeded) + free-text body; save; tag | `saveJournalEntry()`, `getSystemTags()`, `createUserTag()` | M2 |
| `diary/[id].tsx` | View entry; edit within limited window (S21); delete single (S22) | `saveJournalEntry()`, `getJournalEntries()` | M2 |
| `profile/index.tsx` | Research profile fields (S03), prefer-not-to-say | `getCurrentProfile()`, `saveProfile()` | M3 |
| `profile/settings.tsx` | Theme toggle, font size, etc. | `settings` table | M3 |
| `profile/data.tsx` | Export CSV / delete all data | (S05 cascade; S27 export) | M3/M4 |
| `onboarding/index.tsx` | 7 skippable steps (S01) + optional research profile (S03) | `saveProfile()` | M3 |

---

## 4. Navigation rules

- **Tabs are the primary shell** — Toolkit / Exercises / Diary are M2; Portfolio / Dashboard are M3 placeholders (still routable, render a "coming soon" view).
- **Crisis FAB is always visible** above the tab bar (higher z-index), targets `crisis/` modal. Never hidden, never gated by auth (S07 content public; S11 crisis = catalogue exercises).
- **Header avatar** (top-right on each tab) → `profile/` stack. Low-frequency actions live there, not in the tab bar.
- **Root layout** wraps `(tabs)` + stack groups in `ThemeProvider` (currently not wrapped — `_layout.tsx` has no provider yet; M2 task).
- Check-in is a **card on Home**, not a 6th tab.

---

## 5. Current file reality vs target

| Path | Status |
|---|---|
| `app/_layout.tsx` | EXISTS — Stack only; needs ThemeProvider wrap + `(tabs)` + modal groups |
| `app/toolkit.tsx` | EXISTS — move to `(tabs)/toolkit.tsx`; wire chapter list from `getChapters()` |
| `app/index.tsx` | EXISTS — becomes Home/check-in tab (`(tabs)/index.tsx`) |
| `(tabs)/_layout.tsx` | NEW — Tabs navigator + CrisisFab overlay |
| `(tabs)/exercises.tsx`, `diary.tsx`, `portfolio.tsx`, `dashboard.tsx` | NEW |
| `crisis/*`, `exercise/*`, `diary/*`, `profile/*`, `onboarding/*` | NEW (M2/M3) |

> This map is the routing skeleton. The visual refinement (layout of each screen) is the separate
> `01-navigation-and-ia.md` pass done AFTER this — routes first, then screens.