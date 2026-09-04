# Exercises — 5-4-3-2-1 Grounding: session flow (start → result → landing change)

> **Journey served:** Do + Reflect — "I'm doing this exercise and logging it" (journeys 11–18).
> **Routes:** `app/exercise/session/[id].tsx` · **Data:** `saveSession()` (`exercise_sessions` +
> distress/helpfulness), `saveCheckin()` · **M:** M2
> **Contract (§1 IA doc):** a guided session = start → do steps → pre/post ratings → confirm → saved;
> the landing must change once an exercise is completed.

---

## Flow overview

```
[Detail] → [Distress before] → [Step 1..5] → [Distress after + helpfulness]
        → [Confirm summary] → [Result: saved] → (back) → [Landing: done-today]
```

---

## 1. Starting the session — distress-before screen (form data)

```
┌───────────────────────────────────────────────┐
│  ✕ Cancel                        (no header) │
├───────────────────────────────────────────────┤
│  Before you begin                              │
│                                               │
│  How distressed do you feel right now?        │
│                                               │
│  [0][1][2][3][4][5][6][7][8][9][10]           │  ← SUDS 0–10 (S14)
│  calm        ·     ·      ·       very high    │
│                                               │
│  · This is just for you — helps you notice    │
│    how the exercise affects you.              │
│  · You can skip.                              │
│                                               │
│  [ Skip ]                    [ Continue → ]   │
└───────────────────────────────────────────────┘
```

**Annotations:** scale = `.form-slider` or pill row (`mood1..mood5` tokens); Save at the end →
`distress_before` on `exercise_sessions`. Skippable, no pressure (S14 nullable).

---

## 2. Individual exercise steps — one step per screen

```
┌───────────────────────────────────────────────┐
│  ✕ Cancel        3 of 5   (gentle dots ••●•)  │
├───────────────────────────────────────────────┤
│                                               │
│          👁                                 │
│        "Find 3 things                        │
│         you can hear"                         │
│                                               │
│  · A quiet hum · traffic outside · birds      │
│  (hint — not a checklist)                     │
│                                               │
│  · You can take as long as you need.          │
│  · Nothing here is "wrong".                   │
│                                               │
│  [ ‹ Previous ]            [ Next → ]         │
└───────────────────────────────────────────────┘
```

**Reasoning:** one sense per screen = the guided, low-load path for a dysregulated user (my earlier
recommendation). Gentle dots, no harsh countdown, no pressure.

**Annotations:** progress = `.stepper` (soft) or dots; icon = sense glyph; `Next` = `.btn-primary`.

---

## 3. Completing — distress-after + helpfulness (form data)

```
┌───────────────────────────────────────────────┐
│  ✕ Cancel                                     │
├───────────────────────────────────────────────┤
│  That's it — well done for showing up.        │
│                                               │
│  How distressed do you feel now?              │
│  [0][1][2][3][4][5][6][7][8][9][10]           │  ← distress_after (S14)
│                                               │
│  Did this exercise help?                      │
│  [ Not really ] [ A little ] [ Yes, it helped ]│  ← helpfulness (S15)
│  ──────────────────────────────────────────── │
│  [0]–[10]  (optional detailed slider)         │
│                                               │
│  Add a note (optional)                        │
│  [ ______________________________ ]           │
│                                               │
│  Tag it (optional)                            │  ← S16: system/private tags
│  [ grounding ] [ anxious ] [ + new ]          │
│                                               │
│  [ Back ]                    [ Review & save ]│
└───────────────────────────────────────────────┘
```

**Annotations:** `distress_after`, `helpfulness` (0–10, nullable) on `exercise_sessions`; note → `note`;
tags → `exercise_session_tags`. Helpfulness shown as friendly words with an optional 0–10 slider (D04).

---

## 4. End — confirmation summary (review before commit, S13)

```
┌───────────────────────────────────────────────┐
│  Review what will be saved                     │
│                                               │
│  Exercise     5-4-3-2-1 Grounding            │
│  Started      14:32                            │
│  Finished     14:37  (~5 mins)                 │
│  Distress     6 → 3                           │
│  Helped       Yes, it helped                   │
│  Note         "helped me come back to the room"│
│  Tags         [grounding]                      │
│                                               │
│  [ ‹ Adjust ]              [ Save ]           │  → saveSession()
└───────────────────────────────────────────────┘
```

**Reasoning:** S13 requires a confirmation step — the user reviews everything before it's committed, and
can go back. `duration_minutes` computed from started/ended.

---

## 5. Result — saved screen

```
┌───────────────────────────────────────────────┐
│  ✓ Saved                                       │
│                                               │
│  This exercise is in your history.            │
│                                               │
│  How do you feel now?                         │
│  [ 😌 Regulated ] [ 🧊 Freeze ] [ ⚡ Fight ]  │  ← optional re-check-in (S25)
│  [ 🏃 Flight ] [ 🤝 Fawn ] [ Skip ]           │
│                                               │
│  [ Done ]                                      │  → back to landing
│  [ View history → ]                            │  → session history (S17)
└───────────────────────────────────────────────┘
```

**Annotations:** save → `saveSession()`; optional state re-check-in → `saveCheckin()` (ns_state). This is
the "how do you feel now" step — completes the loop without forcing it.

---

## 6. How the landing changes once completed

After `[Done]`, the Exercises landing reflects completion **quietly** (no streaks, no guilt):

```
┌───────────────────────────────────────────────┐
│  Exercises                       (🕶)         │
│                                               │
│  ☑ Done today                                  │
│  · 5-4-3-2-1 Grounding   14:37   Helped ✓     │  ← recent completion row
│    [ Do again ]                                │  → straight to session
│                                               │
│  ┌──────────┐ ┌──────────┐ ...                │
│  │ SENSORY  │  (category cards unchanged)     │
│  └──────────┘ └──────────┘                    │
│                                               │
│  Favourites                                    │
│  · 5-4-3-2-1 Grounding   ★  [Start]           │
└───────────────────────────────────────────────┘
```

**Changes after completion:**
1. A **"Done today"** row appears (exercise, time, helpfulness ✓) with a quick **[Do again]**.
2. The exercise's row in its category gains a quiet **✓ done today** marker (no count/streak).
3. Favourites row (if starred) shows it too.
4. The pattern dashboard (M3) later consumes the raw session for effectiveness — no user-facing trend.

---

## 7. States

### Null / no-data
- **First session ever:** no "Done today" row; Favourites row empty (hidden or "★ to save").
- **Resume:** if a session was cancelled mid-flow, detail page offers "Resume last time" (edge case
  below).

### Error
- **Save failed** (offline): `Couldn't save this session. It's safe to retry. [Retry]` — keep the summary
  screen so no data is lost.
- **Step load failed** mid-session: show current step with a `[Pause]`/`[Resume]`; content is bundled so
  this is unlikely.

### Edge cases
- **Cancel mid-session:** confirm? **No confirmation** (trauma-informed) — just exit and discard the
  incomplete session; no partial save. Resume option offered on detail.
- **Doing it 5× today:** allowed (S18), each logged independently; landing "Done today" lists the most
  recent, not a count.
- **Skipping all ratings:** allowed (S14/S15 nullable) — session still saved.
- **No duration (5-4-3-2-1):** confirm summary shows "~5 mins" computed from started/ended, or "—" if
  ended == started.
- **Tags:** user can only create their own (S16) — "grounding"/"anxious" are system, others become private.