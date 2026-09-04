# Exercises — Landing (3 layout variants)

> **Journey served:** Find/Choose · Do — "which exercise shall I do?" (journeys 7–17 in the analysis).
> **Route:** `app/(tabs)/exercises.tsx` · **Data:** `getAllExercises()`, `getExercisesByCategory()` · **M:** M2
> **Contract (§1 IA doc):** user can do 5 things here — browse 6 categories · open steps · start a session ·
> favourite · "what helps now".

Three layouts are proposed. Each is a full landing page for the same 5 actions — they differ in
**information architecture**, not features. I recommend **Layout A**, with **Layout B's "what helps now"**
as an optional quick-filter toggle inside it.

---

## Layout A — Category cards (recommended)

```
┌───────────────────────────────────────────────┐
│  Exercises                       (🕶)         │
│                                               │
│  How are you feeling? [ filter: ☰ state ]     │  ← optional "what helps now" (B's idea)
│                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 🫁       │ │ 🧍      │ │ 👂       │      │  ← category cards (design-system colours)
│  │ Breath   │ │ Somatic  │ │ Sensory  │      │
│  │ (3)      │ │ (11)     │ │ (8)      │      │
│  └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 🗣       │ │ 🧠      │ │ 🆘       │      │
│  │ Voice    │ │ Mindful  │ │ Crisis   │      │
│  │ (4)      │ │ (2)      │ │ (7)      │      │
│  └──────────┘ └──────────┘ └──────────┘      │
│                                               │
│  Favourites (quick start)                     │
│  · 5-4-3-2-1 Grounding   ★  [Start]          │
│  · Box Breathing          ★  [Start]          │
└───────────────────────────────────────────────┘
```

**Reasoning:** colour-coded category cards match the design system's exercise-type tokens, giving instant
visual recognition. Counts ("(3)") set expectations without pressure. Favourites row is the "do it again"
path (journey 12).

**Strengths**
- Scannable, colour-guided; lowest cognitive load of the three.
- Design-system colours do the work (each category already has a token).
- Favourites row = fast repeat + feeds Crisis "Quick Reset".

**Weaknesses**
- One extra tap to reach an actual exercise (card → list).
- Category names may not match the user's mental model ("what is 'somatic'?").

**UX principles:** progressive disclosure · colour as meaning · reduce choices to 6 tiles (not 35 rows).

---

## Layout B — "What helps now?" (state-first)

```
┌───────────────────────────────────────────────┐
│  Exercises                       (🕶)         │
│                                               │
│  How is your nervous system right now?        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ ⚡ Fight │ │ 🏃 Flight│ │ 🧊 Freeze│      │
│  └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐                   │
│  │ 🤝 Fawn │ │ 😌 OK    │  [Clear]          │
│  └──────────┘ └──────────┘                   │
│                                               │
│  Suggested for Freeze:                        │
│  · Rocking or Swaying        [Start]          │
│  · Hand on Chest & Breath    [Start]          │
│  · Warm bath / slow music    [Start]          │
│                                               │
│  [ Browse all categories → ]                  │
└───────────────────────────────────────────────┘
```

**Reasoning:** matches the toolkit's own "When I'm in X mode, I can try…" pages (pp. 33–34). Puts the
user's *state* first — ideal for someone dysregulated who can't scan 6 categories.

**Strengths**
- Journey-first: "I feel X, what do I do?" answered immediately.
- Trauma-informed — meets the user where they are, not where the catalogue is.
- Uses check-in state if the user just checked in.

**Weaknesses**
- Requires state data or a state picker (extra interaction).
- Risk of feeling like a *prescription* rather than a menu (must be worded as suggestions).
- The state→exercise mapping needs curating; some users may not know their state.

**UX principles:** context-first design · meet-the-user-where-they-are · suggestion, never instruction.

---

## Layout C — Flat grouped list

```
┌───────────────────────────────────────────────┐
│  Exercises                       (🕶)         │
│  [ 🔍 Search exercise ]                      │
│                                               │
│  BREATHING  (3)                               │
│  · Gentle Inhale & Exhale          [▸]        │
│  · Counting on the Outbreath       [▸]        │
│  · Breath & Movement Combo         [▸]        │
│                                               │
│  SOMATIC  (11)                                │
│  · Tapping / EFT                    [▸]       │
│  · Rocking or Swaying               [▸]       │
│  · Butterfly Hug                    [▸]       │
│  · … (8 more)                                  │
│                                               │
│  SENSORY  (8)  · VOICE  (4)  · MINDFUL  (2)   │
│  · CRISIS  (7)                                │
└───────────────────────────────────────────────┘
```

**Reasoning:** everything visible in one scroll; strongest for discovery when the user is calm and
exploring ("I have time, show me everything").

**Strengths**
- Fewest taps to any exercise.
- Search helps a user who knows *what* they want by name.
- Great for the "travelling / spare time" journey.

**Weaknesses**
- 35 rows is overwhelming for a dysregulated user (cognitive + scroll load).
- No colour guidance; relies on text headers.
- Mixed emotional load (crisis exercises sit beside calm ones).

**UX principles:** full-disclosure when calm · search as safety-valve · but risk of choice-overload.

---

## Recommendation

**Layout A primary**, with a **"How are you feeling?" filter** (Layout B's idea) as a non-intrusive toggle
that narrows A's categories. Layout C's **search** can be added later (M2 stretch). This gives:
- lowest load by default (A),
- state-aware help when needed (B inside A),
- discovery for the calm user (search, optional).

---

## States

### Null / no-data
- **Never opened:** catalogue is public + seeded, so it's never truly empty. If it *were* empty (seed
  failed), show: `No exercises yet. This is a glitch — content is public and pre-loaded.` + error copy.
- **No favourites yet:** Favourites row hidden or shows "Save an exercise with ★ to see it here."
- **No state selected (B):** suggestions area hidden until a state is chosen.

### Error
- `Couldn't load exercises. [Retry]` — if `getAllExercises()` fails (offline/network).
- Search (C): "No matches for 'xyz'" — empty result, not an error.

### Edge cases
- **Empty category:** a category with 0 rows still shows its card with `(0)` and a disabled tap.
- **Single-exercise category:** card still links to a one-row list.
- **Crisis category:** present like any other (S11) — no special treatment, but the FAB is the faster path.
- **Done 5× today:** the category card shows the count of exercises, not usage; "done today" badges live
  on the exercise row (see session flow), not the landing.