# Exercises — 5-4-3-2-1 Grounding: starting screen (detail)

> **Journey served:** Find/Choose → Do — "I've picked an exercise, show me what it is before I start."
> **Route:** `app/exercise/[id].tsx` · **Data:** `getAllExercises()` (by id) · **M:** M2
> **Contract (§1 IA doc):** user can read the exercise, know what to expect, and start — without pressure.

Chosen exercise: **5-4-3-2-1 Grounding** (Sensory category; 5 steps; no fixed duration). Seeded from
`services/seed.ts` (title/category/steps/duration_minutes).

---

## 1. Starting screen — the detail page

```
┌───────────────────────────────────────────────┐
│  ‹ Back                    Exercises   (🕶)   │
├───────────────────────────────────────────────┤
│  [SENSORY]  ★ 5-4-3-2-1 Grounding  (chip)    │
│  Sensory grounding · 5 steps · ~5 mins        │
│                                               │
│  WHAT THIS IS                                  │
│  Brings your attention back to the present     │
│  by noticing things around you, one sense     │
│  at a time. Useful when thoughts spiral or     │
│  you feel disconnected.                        │
│                                               │
│  WHAT TO EXPECT                                 │
│  · 5 gentle steps, one sense each              │
│  · No need to do it "right"                    │
│  · You can stop any time                       │
│  · You'll be asked how you feel before & after │
│                                               │
│  ┌───────────────────────────────────────────┐ │
│  │              [ Start ]                    │ │  → /exercise/session/[id]
│  │              (btn-primary, large)         │ │
│  └───────────────────────────────────────────┘ │
│  · I've done this before  (resume last time)   │  → resumes session state
│  · Add to Portfolio  ☆                         │  → saveFavourite()
└───────────────────────────────────────────────┘
```

**Annotations:** category chip = `.ex-chip` (token `--ex-sensory`); Start = `.btn-primary.btn-lg`;
favourite = `.btn-icon`/`☆`; "what to expect" uses design-system microcopy (no pressure, optional, skip
any time).

**Reasoning:** the 3–5 actions here are — *understand* the exercise (what/expect) · *start* it ·
*resume* a previous run · *favourite* it. Deliberately no timer on this page (duration is shown as
"~5 mins" hint, not a countdown — keeps the starting moment calm).

---

## 2. States

### 2.1 Null / no-data
- Exercise id not found (deep link to a deleted/never-seeded id):
```
┌───────────────────────────────────────────┐
│  ‹ Back                                   │
│  This exercise isn't available.           │
│  It may have been removed from the        │
│  workbook catalogue.                      │
│  [ Browse all exercises → ]               │
└───────────────────────────────────────────┘
```

### 2.2 No prior run
- "I've done this before (resume last time)" is **hidden** until there's a previous session for this
  exercise (S17). First time: only [Start] + ☆.

### 2.3 Error
- Steps failed to load (network): `Couldn't load this exercise. [Retry]` — keep the [Start] disabled until
  steps are present.

### 2.4 Edge cases
- **Duration null** (as with 5-4-3-2-1): show "5 steps · no fixed time" — never "0 mins".
- **Crisis exercises** (e.g. Box Breathing): same detail screen; no special styling, but the Crisis FAB
  remains reachable on the tab shell behind it.
- **Already favourited:** ☆ fills (★) and becomes disabled/"Saved to Portfolio".
- **Done many times today:** the detail shows a quiet "Done 2× today" hint (no streak/guilt) — feeds the
  landing's "done today" state.