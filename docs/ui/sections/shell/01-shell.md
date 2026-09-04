# Shell — Persistent App Shell & States

> **Journey served:** every journey (the shell wraps all tabs).
> **Route:** `app/(tabs)/_layout.tsx` + `app/_layout.tsx` · **Data:** none (static shell) · **M:** M1/M2
> **Contract (§1 IA doc):** persistent bottom tabs + Crisis FAB + header avatar; user can always reach the 5 sections and the crisis path.

---

## 1. The shell (every tab)

```
┌───────────────────────────────────────────────────────────────┐
│  ▲ StatusBar (expo-status-bar, style="auto")                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  HEADER (app-topbar)              [surface]             │ │
│  │  <Screen title>            ...   (🕶 avatar → /profile) │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  BODY (app-body) — flex:1, scrollable                  │ │
│  │                                                         │ │
│  │       <ScreenContent/>   ← per-screen 3–5 actions       │ │
│  │                                                         │ │
│  │       · bottom padding = 80 so FAB never covers the     │ │
│  │         last item                                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  TAB BAR (bottom-nav)          [surface]                │ │
│  │                                                         │ │
│  │    ◧          ▢          ◈          ✎          ◐        │ │
│  │   Home      Toolkit   Exercises    Diary   Portfolio    │ │
│  │  (active)   [icon]    [icon]      [icon]    [icon]      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│                    ╔═══════════════════╗                       │
│                    ║  ☰  Crisis FAB   ║  ←-- floats over body │
│                    ║  (56×56,radius-full)║   + tab bar        │
│                    ╚═══════════════════╝                       │
└───────────────────────────────────────────────────────────────┘
```

**Annotations:** header = `.app-topbar`/`.app-title` (`--color-surface`, `--color-text`); tab bar =
`.bottom-nav`/`.nav-item`/`.nav-icon`/`.is-active` (active `--color-primary`); FAB = `.fab`
(56×56, `--radius-full`, `--shadow-lg`, `--color-error`).

**Rules:** exactly one active tab · header avatar on every tab → `profile/*` · Crisis FAB never hidden,
never gated, no confirmation.

---

## 2. States

### 2.1 Null / first launch
```
┌───────────────────────────────────────────────┐
│  Calm Anchor                  (🕶)            │
│  ┌─────────────────────────────────────────┐  │
│  │  Welcome. This is your private          │  │
│  │  companion to the Bella & Wolf toolkit. │  │
│  │                                         │  │
│  │        [ Begin onboarding → ]           │  │  ← M3 onboarding (skippable)
│  │        [ Skip for now ]                 │  │
│  └─────────────────────────────────────────┘  │
│  [  Home | Toolkit | Exercises | Diary | ... ]│
└───────────────────────────────────────────────┘
```
- First launch shows a gentle welcome; onboarding (M3) is skippable. Tabs are still reachable
  (content is public, S07).

### 2.2 No-data (fresh user, no history)
- Tabs render fine; each section shows its own "no data yet" state (e.g. Exercises shows the full
  catalogue — content is public — but Diary shows "no entries yet"). No error, no guilt.

### 2.3 Error / offline
```
┌───────────────────────────────────────────────┐
│  You're offline.                              │
│  • The workbook and exercise catalogue may    │
│    already be saved on this device.           │
│  • Journal and check-ins still work offline.  │
│  [ OK ]                                       │
│  [  Home | Toolkit | Exercises | Diary | ... ]│
└───────────────────────────────────────────────┘
```
- Offline banner on the shell (non-blocking). Crisis FAB always works offline.
- A hard content load failure (e.g. PDF network error) shows an error state **inside that screen**,
  not on the shell.

### 2.4 Edge cases
- **Tab bar labels always visible** (text + icon) — no icon-only tabs (dysregulation).
- **5 tabs max** — Portfolio + Dashboard share the bar only as their sections land; no 6th tab.
- **Crisis FAB never in a menu** — one persistent affordance, never two competing paths.