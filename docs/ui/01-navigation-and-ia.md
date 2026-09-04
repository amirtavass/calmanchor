# CalmAnchor — UI/UX: Navigation Shell & Information Architecture

> **Status:** Draft v2 · **Milestone:** M1/M2 (shell + journey mapping)
> **Design source of truth:** `design-system/calm-anchor-design-system.css`
> **Rendering baseline:** Expo Router (`app/` = file-based routes)
> **Route map:** see `02-routing-map.md` (this doc covers *why* each screen exists; that doc covers *what route/file*).
> **Convention:** every screen is designed so a user can **do or answer 3–5 important things**. That is the
> design contract each screen must satisfy. Screens below list those actions; the ASCII screen proposals
> are built from them.

---

## 1. Design principle: 3–5 things per screen

Every screen exists to let a user complete a small set of **journey actions**. When designing any screen,
ask: *"What can the user do or answer here?"* If it's more than ~5, the screen is overloaded for a
dysregulated user. If it's fewer than 3, it's probably part of another screen.

The journey verticals (from the user-journey analysis) are:
**First-Touch · Learn/Read · Find/Choose · Do (Guided Exercise) · Reflect (Journal) · Check-in · Review · Privacy**

Each tab/screen below names its 3–5 actions and the vertical(s) they serve.

---

## 2. High-Level Information Architecture

Single-user companion. A persistent **Crisis FAB** floats above every tab. No login screens in the main
shell (auth is silent), no clinician views, no multi-user.

```
┌──────────────────────────────────────────────────────────────┐
│                 CALMANCHOR ROOT (app/_layout.tsx)            │
│              Root Stack + ThemeProvider + StatusBar           │
└──────────────────────────────┬───────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │  Stack/modal screens (pushed OVER the tabs)  │
        │  [crisis/*] [exercise/*] [diary/*] [profile/*]│
        │  [onboarding/* (M3)]                         │
        └──────────────────────┬──────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │         TAB SHELL (app/(tabs)/_layout.tsx)  │
        │       bottom tabs + Crisis FAB (always)     │
        └──────────────────────┬──────────────────────┘
                               │
   ┌──────────┬──────────┬─────┴──────┬──────────┬──────────┐
   ▼          ▼          ▼            ▼          ▼          ▼
[ HOME ]   [ TOOLKIT ] [ EXERCISES ] [ DIARY ] [PORTFOLIO][CRISIS FAB]
 check-in    read PDF    do self-      reflect   my stuff   always one
 (M3)       + chapters   soothing      + journal  (M3)      tap away
 [M3 home]  [M2]         (M2)          (M2)      [M3]      [M1]
```

> **Dashboard** is the *review* vertical and is **M3** (needs data to mean anything). For M1/M2 it is the
> home tab placeholder. **Portfolio** is M3. Both are routable placeholders now.

---

## 3. Screen → journeys → 3–5 actions (the design contract)

### HOME / CHECK-IN — `(tabs)/index.tsx` — *Check-in · Review · Do*
Verticals: **Check-in, Do (quick relief), Reflect (nudge)**

A user landing here can:
1. **Answer a quick check-in** — pick nervous-system state + survival response + add triggers + optional note → `saveCheckin()`
2. **Get quick relief now** — jump straight to crisis/breathe/ground tiles
3. **See today's reflection prompt** → one tap into Diary
4. **Pick up a favourite exercise** (quick start, from Portfolio when available)
5. *(M3)* **See a gentle pattern hint** — no pressure, no streak, no mood trend (S26)

### TOOLKIT — `(tabs)/toolkit.tsx` — *Learn/Read*
Verticals: **Learn/Read**

A user here can:
1. **Browse the 20 chapters in order** (title + page range) → `getChapters()`
2. **Open the workbook PDF** and jump to a chapter → `lib/toolkit.ts` (`TOOLKIT_URL`)
3. **Continue from last-read position** (remember where they stopped)
4. **Search/filter** a chapter title (M2 stretch) 
5. **Find an exercise** referenced in a chapter → deep-link to Exercises

### EXERCISES — `(tabs)/exercises.tsx` — *Find/Choose · Do*
Verticals: **Find/Choose, Do, Review (rate)**

A user here can:
1. **Browse by 6 categories** (`breathing, somatic, sensory, voice, mindful, crisis`) → `getAllExercises()` / `getExercisesByCategory()`
2. **Open an exercise** → read steps + duration before starting → `exercise/[id]`
3. **Start a guided session** → `exercise/session/[id]` (timer, distress pre/post, helpfulness)
4. **Favourite / save to Portfolio**
5. **Find the right one for *right now*** — "what might help in this state" quick filter (feeds from check-in state when available)

### DIARY — `(tabs)/diary.tsx` — *Reflect*
Verticals: **Reflect**

A user here can:
1. **See the 3 seeded workbook prompts** → pick one
2. **Write a new entry** (free text, with/without a prompt) → `saveJournalEntry()`
3. **Review past entries** (timeline, newest first) → `getJournalEntries()`
4. **Edit within the limited window** (S21) / **delete a single entry** (S22)
5. **Tag an entry** (system or private tag) → `getSystemTags()` / `createUserTag()`

### PORTFOLIO — `(tabs)/portfolio.tsx` — *Review · Privacy (ownership)* — **M3 placeholder**
Verticals: **Review, Do (quick access)**

A user here can (M3):
1. **See favourited exercises** (their personal toolkit)
2. **Read safe-space notes** and custom strategies
3. **Add a custom entry** ("call my sister", "make tea")
4. **Reorder by priority** (feeds "My Quick Reset" in Crisis)

### DASHBOARD — `(tabs)/dashboard.tsx` — *Review* — **M3 placeholder**
Verticals: **Review**

A user here can (M3):
1. **See trigger frequency** over time
2. **See survival-response distribution**
3. **See exercise effectiveness** (helpfulness ratings)
4. **See time-of-day patterns**
5. **…and NOTHING more** — no mood trend, no guilt, no "good/bad" framing (S26). Descriptive only.

### CRISIS — `crisis/*` — *Do (emergency)* — **always one tap**
Verticals: **Do**

A user here can:
1. **Ground** — 5-4-3-2-1 sensory grounding
2. **Breathe** — box breathing (4-4-4-4)
3. **Quick Reset** — top-rated from Portfolio (default fallback set if empty)
4. **See UK crisis contacts** (Samaritans 116 123, Shout 85258, NHS 111) — visible, not intrusive

**Rules:** no confirmation dialogs, no login gate, fully offline, usage never logged/analysed.

### PROFILE / SETTINGS — `profile/*` (header avatar) — *Privacy · First-Touch*
Verticals: **Privacy, First-Touch**

A user here can:
1. **Edit research profile** (age band, gender, ethnicity, treatment, referral — all optional, prefer-not-to-say) → `saveProfile()`
2. **Change settings** (theme, font size)
3. **Export data** (CSV) — S27 (M3/M4)
4. **Delete all my data** (full withdrawal) — S05 (M3/M4)
5. **About** — crisis contacts, toolkit info

---

## 4. Route Tree (Expo Router) — concise

```
app/
├─ _layout.tsx                 Root: ThemeProvider + Stack + StatusBar
├─ (tabs)/
│  ├─ _layout.tsx              Tabs + <CrisisFab/> overlay
│  ├─ index.tsx                Home / check-in            [M3 home; M2 placeholder]
│  ├─ toolkit.tsx              Toolkit (PDF + chapters)   [M2]
│  ├─ exercises.tsx            Exercise catalogue         [M2]
│  ├─ diary.tsx                Journal                    [M2]
│  ├─ portfolio.tsx            Portfolio                  [M3 placeholder]
│  └─ dashboard.tsx            Pattern Dashboard          [M3 placeholder]
├─ crisis/
│  ├─ _layout.tsx              Full-screen modal (no tabs/header)
│  ├─ index.tsx  ground.tsx  breathe.tsx  reset.tsx
├─ exercise/
│  ├─ [id].tsx                 Exercise detail
│  └─ session/[id].tsx         Guided session
├─ diary/
│  ├─ new.tsx                  Compose entry
│  └─ [id].tsx                 View / edit / delete
├─ profile/
│  ├─ index.tsx  settings.tsx  data.tsx  about.tsx
└─ onboarding/
   └─ index.tsx                (M3) 7-step skippable
```

Full route→file→data-call map in `02-routing-map.md`.

---

## 5. The Shell — Screen Anatomy (every tab)

```
┌───────────────────────────────────────────────────────────────┐
│  ▲ StatusBar (expo-status-bar, style="auto")                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  HEADER (app-topbar)                 [surface]           │ │
│  │  Title (app-title)          ...   (🕶 avatar → /profile) │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  BODY (app-body) — flex:1, scrollable                 │ │
│  │                                                        │ │
│  │     <ScreenContent/>  ← per-screen 3–5 actions         │ │
│  │     (check-in card / pdf / ex-cards / prompts / ...)   │ │
│  │                                                        │ │
│  │  ...bottom padding = 80 so the FAB never covers        │ │
│  │     the last item                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  TAB BAR (bottom-nav)            [surface]               │ │
│  │                                                         │ │
│  │    ◧          ▢          ◈          ✎          ◐        │ │
│  │   Home      Toolkit    Exercises    Diary   Portfolio   │ │
│  │  (active)   [icon]     [icon]     [icon]    [icon]      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│                    ╔═══════════════════╗                       │
│                    ║  ☰  Crisis FAB   ║  ←-- floats over body │
│                    ║  (56×56,radius-full)║   + tab bar        │
│                    ╚═══════════════════╝                       │
└───────────────────────────────────────────────────────────────┘
```

**Design-system mapping:**
| Screen band   | Component / token                                                              |
| ------------- | --------------------------------------------------------------------------------- |
| Header        | `.app-topbar`, `.app-title`, `.app-sub` — `--color-surface`, `--color-text`        |
| Body          | `.app-body` — `--color-bg`, spacing `--sp-*`                                       |
| Tab bar       | `.bottom-nav`, `.nav-item`, `.nav-icon`, `.is-active` — active=`--color-primary` |
| Crisis FAB    | `.fab` — fixed, 56×56, `--radius-full`, `--shadow-lg`                             |

**Active-tab rule:** exactly one `.nav-item` has `.is-active` → `--color-primary` text+icon, weight 700.
**Header avatar rule:** top-right on every tab → `profile/` stack (low-frequency actions, never a tab).

---

## 6. Crisis FAB — placement & z-index

```
Container: fixed, bottom: 24 + tab-bar-height, right: 24
z-index:    > tab bar (see token zIndex: modal 400, toast 500)
size:       56×56, radius full, bg = --color-error
content:    ☰ / "+" glyph, --color-text-inverse

Tap → push /crisis (full-screen modal). NO confirmation dialog.
Offline: fully functional. If a crisis gesture is used, DO NOT log it.
```

---

## 7. Tab-by-tab summary

| Tab        | Vertical(s)            | 3–5 actions (do/answer)                                   | Route | M |
|------------|------------------------|-----------------------------------------------------------|-------|---|
| **Home**   | Check-in · Review · Do | check-in, quick relief, today's prompt, quick-start | `(tabs)/index` | M3 |
| **Toolkit**| Learn/Read             | browse chapters, open PDF+jump, resume, search, find ex  | `(tabs)/toolkit` | M2 |
| **Exercises**| Find/Choose · Do     | browse 6 categories, open steps, start session, fav, "what helps now" | `(tabs)/exercises` | M2 |
| **Diary**  | Reflect                | see prompts, write, review, edit/delete, tag             | `(tabs)/diary` | M2 |
| **Portfolio**| Review · Do (M3)    | favourites, safe-space notes, custom, reorder            | `(tabs)/portfolio` | M3 |
| **Dashboard**| Review (M3)         | 4 descriptive charts; no mood trend (S26)                | `(tabs)/dashboard` | M3 |
| **Crisis** | Do (emergency)         | ground, breathe, quick reset, UK contacts                | `crisis/*` | M1 |
| **Profile**| Privacy · First-Touch  | research profile, settings, export, delete-all, about    | `profile/*` | M3 |

---

## 8. Legend

```
[text]      = a screen / route  │ (text) = a user action  │ text = microcopy
┌───┐ ──┐   = box grouping (a visual block)
▼           = a branch (tabs / child routes)
╔═══╗       = persistent overlay (Crisis FAB)
──           = arrow / flow direction
```

**Cross-reference:** each block links to a design-system `.class` and a token from `theme/tokens.ts`.
When implementing, use the token, never hard-code a hex. UK spelling throughout.