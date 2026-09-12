# Exercises — Landing update: design-system directions (3 options + recommendation)

> **Status:** OPTIONS + RECOMMENDATION — no code changed. Pick/approve per the flags at the end.
> **Route:** `app/(tabs)/exercises.tsx` · **Data:** `getAllExercises()` / `getExercisesByCategory()` · **M:** M2
> **Contract (§3 IA doc):** user can do 5 things here — browse 6 categories · open steps · start a session ·
> favourite · "what helps now" (state filter).
> **Sources:** `design-system/calm-anchor-design-system.{html,css}` v2.0 (visual reference) + `docs/ui/00-design-system-usage-rules.md`
> (standing rules — this file applies them, it does not restate them) + `01-user-stories.md` + `01-navigation-and-ia.md` +
> `00-m3-design-ledger.md` + `01-landing-variants.md`.
> **Scope:** landing only (category grid + filter chips + quick-start rows). Everything else (detail, session flow)
> is governed by `02-exercise-detail.md` / `03-session-flow.md`.

---

## What /docs already locks in (wins over design-system — rules §1)

- **Shape:** Layout A (2-column category grid) with Layout B's "How are you feeling?" filter inside —
  `01-landing-variants.md` recommendation.
- **Categories (S08):** `breathing, somatic, sensory, voice, mindful, crisis`; S10 no gating; S11 crisis is a normal
  category (no special UI).
- **Ledger Q1–Q5 (decided 12 Sep):** filled cards (`surface-container-highest`) · bare filter-chip row · brand-800
  section labels · hand-built M3 filled buttons · M3 small app bar (title weight 400).
- Current `exercises.tsx` already implements all of this. The design-system delta is **colour application + icons**,
  not structure.

## Borrowed from design-system (Type A unless flagged otherwise — rules §3)

1. **Section 5 — colour association.** Categories are meant to be recognised by *colour* ("build association
   between color and practice type over time"). Today our tiles carry colour only as a 4px accent bar; the reference
   intends colour to do more work. Applied in every direction below (weakest in D1, strongest in D2).
2. **Section 4 — survival-response palette** (`--sr-fight/flight/freeze/fawn`) for the filter chips, matching the
   nervous-system responses exactly (trauma-informed colour language). Applied in D2/D3; D1 keeps the neutral
   `secondarySubtle` selected fill.
3. **Sections 11/18/21 — in-app rhythm:** leading icon → title → supporting line; compact, colour-forward tiles.
   Applied in all directions (list rows) and D3 (tile density).

## Deliberately not carried over (rules §2)

- **Emoji category glyphs → MaterialCommunityIcons.** Suggested mapping: breathing `weather-windy` · somatic
  `hand-heart` · sensory `ear-hearing` · voice `microphone` · mindful `meditation` · crisis `lifebuoy` (final names
  verified at implementation). ★ stays as a one-off warm touch on quick-start rows.
- **"Mood Selector" content** (Sections 6/10/20) — old framing; we log SUDS distress + helpfulness (S14/S15).
  Not used on this screen.
- **Category palette names** (Grounding/Journaling/Self-Kindness) — S08 categories win; colours remapped in
  `CATEGORY_TOKENS` (sensory←ground, voice←selfkind, mindful←journal).
- **`.app-section-label` small-caps** — ledger Q3 keeps brand-800 section labels.
- **`.fab` primary-green** — /docs IA §6 keeps error-red (not this screen; recorded in rules §1).
- **Warm-gold dark-mode headings** (Section 12) — not taken on this screen; app-bar title stays `text` (Q5, M3-pure).
- **Flat / border-only tile differentiation** — colour intent only, M3 anatomy throughout (rules §2.2).

---

## Direction 1 — "M3-neutral · colour accents"

*Keeps every locked ledger decision. Colour as a restrained recognition cue: a tonal icon container carries each
category's `--ex-*` identity; the card stays neutral.*

```
┌────────────────────────────────────────────────────────────┐
│  Exercises                                        (avatar) │
│                                                            │
│  How are you feeling?                                      │
│  (fight) (flight) (freeze) (fawn) (ok)                     │
│                                                            │
│  ┌───────────────┐  ┌───────────────┐                      │
│  │  ◎ Breath     │  │  ◎ Somatic    │                      │
│  │  3 exercises  │  │  11 exercises │                      │
│  └───────────────┘  └───────────────┘                      │
│  ┌───────────────┐  ┌───────────────┐                      │
│  │  ◎ Sensory    │  │  ◎ Voice      │                      │
│  │  8 exercises  │  │  4 exercises  │                      │
│  └───────────────┘  └───────────────┘                      │
│  ┌───────────────┐  ┌───────────────┐                      │
│  │  ◎ Mindful    │  │  ◎ Crisis     │                      │
│  │  2 exercises  │  │  7 exercises  │                      │
│  └───────────────┘  └───────────────┘                      │
│                                                            │
│  Quick start                                               │
│  ★ Gentle Inhale & Exhale   Breath · 2 steps · ~1 min [Start]
│  ★ Humming                  Voice · 2 steps · ~1 min  [Start]
└────────────────────────────────────────────────────────────┘
```

`◎` = 40dp tonal icon container filled `--ex-*-bg`, glyph in `--ex-*`. Card = filled `surfaceOffset2`, 12dp, ripple.
Chip selected = `secondarySubtle` fill. ★ = `warmGold`. Start button = M3 filled (`primary`/`textInverse`, 40dp, full-round).

**Component decisions** (rules §5 — one row per element differing from a plain M3 default):

| Element | design-system does | This direction uses | Why | Emoji → replacement |
|---|---|---|---|---|
| Category tile | Section 10 "Exercise Type Chips" = emoji + coloured pill *buttons*; Section 11 `ex-tile` = tinted tile | **M3 Card** (filled, `surfaceOffset2`, 12dp, ripple) + 40dp tonal icon container | Colour-as-meaning implemented per M3 (rules §2.2); Layout A grid kept (01-landing-variants) | `🫁🧍👂🗣🧠🆘` → MCI glyphs `weather-windy` / `hand-heart` / `ear-hearing` / `microphone` / `meditation` / `lifebuoy` in `--ex-*`, inside the `--ex-*-bg` container |
| Filter chips | Section 4 `sr-card` = tinted bg + coloured border + emoji title (flat, no state layer) | **M3Chip** (bare row, 32dp, 8dp, checkmark), selected = `secondarySubtle` fill | Q2 bare row + M3 filter-chip spec; neutral selected colour keeps the landing calm | N/A (text-only chips) |
| Quick-start leading mark | Section 21 quick actions use emoji icons | ★ in `warmGold` on the M3 two-line list row | One-off warm touch, allowed (rules §2.1); matches 01-landing-variants "★ [Start]" | ★ retained as a single warm glyph (allowed) |

**Reasoning:** matches the ledger's M3-pure filled cards exactly (Q1 unchanged), and picks up the design-system's
colour-association intent through the icon container — a tonal surface is M3's own "colour as meaning" mechanism, so
this is colour intent implemented per M3 (rules §2.2), not a flat tinted fill.

**Strengths**
- Zero revision of locked decisions — can be implemented immediately.
- Lowest colour noise; calmest landing for a dysregulated user; clearest hierarchy (neutral cards, colour as accent).
- Cards stay scannable: label + count on a neutral field.

**Weaknesses**
- Least faithful to the design system's colour-forward intent — recognition relies on a 40dp glyph, not the tile.
- May read as "not much changed" against today's accent-bar tiles.

**UX principles:** colour as meaning (restrained) · progressive disclosure · reduce choices to 6 tiles.

---

## Direction 2 — "Colour fields"

*Most faithful to the design system. Each category becomes a block of its own tinted colour; the state filter speaks
the survival-response palette.*

```
┌────────────────────────────────────────────────────────────┐
│  Exercises                                        (avatar) │
│                                                            │
│  How are you feeling?                                      │
│  (fight) (flight) (freeze) (fawn) (ok)   ← selected chip:  │
│                                            --sr-*-bg fill,  │
│                                            --sr-* label     │
│  ┌───────────────┐  ┌───────────────┐                      │
│  │ ▓◎ Breath     │  │ ▓◎ Somatic    │                      │
│  │   3 exercises │  │   11 exercises│                      │
│  └───────────────┘  └───────────────┘                      │
│  ┌───────────────┐  ┌───────────────┐                      │
│  │ ▓◎ Sensory    │  │ ▓◎ Voice      │                      │
│  │   8 exercises │  │   4 exercises │                      │
│  └───────────────┘  └───────────────┘                      │
│  ┌───────────────┐  ┌───────────────┐                      │
│  │ ▓◎ Mindful    │  │ ▓◎ Crisis     │                      │
│  │   2 exercises │  │   7 exercises │                      │
│  └───────────────┘  └───────────────┘                      │
│                                                            │
│  Quick start                                               │
│  ★ Gentle Inhale & Exhale   Breath · 2 steps · ~1 min [Start]
│  ★ Humming                  Voice · 2 steps · ~1 min  [Start]
└────────────────────────────────────────────────────────────┘
```

`▓` = card fill `--ex-*-bg` (per category) · `◎` = glyph in `--ex-*` · label `--ex-*` · count = `--ex-*` at muted
opacity. Card keeps 12dp, ripple, pressed state layer (M3 anatomy — rules §2.2). Selected chip = its response's
`--sr-*-bg` fill + `--sr-*` label; "OK/regulated" chip = `nsWindow`.

**Component decisions** (rules §5):

| Element | design-system does | This direction uses | Why | Emoji → replacement |
|---|---|---|---|---|
| Category tile | Section 10/11 tinted exercise blocks (emoji + coloured pill/tile) | **M3 Card** with `fillColor = --ex-*-bg`; label + glyph `--ex-*`; ripple + pressed state layer | Section 5 colour association — the card *is* the category colour; rules §2.2 (intent, M3 anatomy) | Emoji → MCI glyph (as D1) inside the tinted field |
| Filter chips | Section 4 `sr-card` | **M3Chip**, selected = `--sr-*-bg` fill + `--sr-*` label; "OK/regulated" = `nsWindow` | S25 survival-response language; trauma-informed state colour | N/A (text-only chips) |
| Quick-start leading mark | Section 21 emoji quick actions | ★ `warmGold` on the M3 two-line list row | As D1 — one-off warm touch, allowed (rules §2.1) | ★ retained (allowed) |

**Reasoning:** this is the design-system's own exercise-block pattern (Sections 5, 10, 11) mapped onto M3 card
anatomy, and Section 4's survival-response colours on the chips. It directly implements the reference's stated goal
("build association between color and practice type over time") and the trauma-informed state language the project
already adopted for check-ins (S25).

**Strengths**
- Strongest category recognition; warmest, most branded, most clearly "designed."
- State filter now reads via the nervous-system palette — colour association for regulation, not just decoration.
- Matches the reference mock's silhouette most closely among the two-column options.

**Weaknesses**
- 🔒 **REVISES ledger Q1:** card fill changes from `surface-container-highest` to `--ex-*-bg` per category, and
  chip selected colour from `secondarySubtle` to `--sr-*-bg`/`--sr-*`. Requires sign-off before implementation.
- More colourful than M3 default; the Crisis tile in `--ex-crisisBg` (red tint) must keep identical anatomy to the
  others (S11) so it doesn't read as "special."
- Colour contrast must be verified per tint on both modes (the `--ex-*` bases are AA on their tints; confirm in
  dark mode too).

**UX principles:** colour association over time · context-first (state colour) · meet-the-user-where-they-are.

---

## Direction 3 — "Compact colour tiles"

*Closest silhouette to the design-system's own app mock (Section 11): three small tiles per row, sr-tinted chips.*

```
┌────────────────────────────────────────────────────────────┐
│  Exercises                                        (avatar) │
│                                                            │
│  How are you feeling?                                      │
│  (fight) (flight) (freeze) (fawn) (ok)   ← sr-tinted chips │
│                                            (as D2)         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │  ◎ Breath    │ │  ◎ Somatic   │ │  ◎ Sensory   │       │
│  │    3         │ │    11        │ │    8         │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │  ◎ Voice     │ │  ◎ Mindful   │ │  ◎ Crisis    │       │
│  │    4         │ │    2         │ │    7         │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                            │
│  Quick start                                               │
│  ★ Gentle Inhale & Exhale   Breath · 2 steps · ~1 min [Start]
│  ★ Humming                  Voice · 2 steps · ~1 min  [Start]
└────────────────────────────────────────────────────────────┘
```

Tiles = filled `surfaceOffset2`, ~31% width each, 12dp, ripple; `◎` = `--ex-*-bg` tonal container + `--ex-*` glyph;
label `text`; count `textMuted` (compact). Chips = `--sr-*` tints (as D2). ★ = `warmGold`; Start = M3 filled.

**Component decisions** (rules §5):

| Element | design-system does | This direction uses | Why | Emoji → replacement |
|---|---|---|---|---|
| Category tile (compact) | Section 11 `ex-tile` = small emoji + name tiles, 3-across | **M3 Card** ~31% width (`surfaceOffset2`, 12dp, ripple) + 32dp tonal icon container | Mock silhouette + density; six tiles in two short rows | Emoji → MCI glyph (as D1) in a 32dp container |
| Filter chips | Section 4 `sr-card` | **M3Chip**, sr tints (as D2) | S25 survival-response language | N/A (text-only chips) |
| Quick-start leading mark | Section 21 emoji quick actions | ★ `warmGold` on the M3 two-line list row | As D1 | ★ retained (allowed) |

**Reasoning:** matches the reference mock's compact 3-across rhythm (Section 11 `ex-tile`), so all six categories
are visible in two short rows — the fastest scan of the three. Denser than Layout A's 2-column grid, so it reads
"update" more clearly against today.

**Strengths**
- Dense, tidy, mock-faithful silhouette; six categories at a glance.
- sr-tinted chips (trauma-informed state colour) as in D2.

**Weaknesses**
- 🔒 **REVISES layout shape:** Layout A's 2-column grid (01-landing-variants) → 3-across. Requires sign-off.
- Smallest tap targets and least room for counts/duration — labels risk truncation on narrow screens
  (320px `--bp-xs`).
- Two /docs revisions for a density change that's mostly cosmetic.

**UX principles:** full-disclosure when calm · scannability · reduce cognitive load to six small tiles.

---

## States

### Null / no-data
- **Never opened / seed failed:** the catalogue is public + seeded (S08), so it's never truly empty in practice.
  If `getAllExercises()` returns nothing (seed failure), show a centred muted message — `No exercises yet. This is a
  glitch — content is public and pre-loaded.` — with no tiles and no Quick start section. Retry re-runs the load.
- **Quick start empty:** if either `QUICK_TITLES` title is missing from the catalogue, the Quick start section
  **hides entirely** (no empty header, no placeholder) rather than showing an empty list.
- **No state selected:** the "Suggested for X" block is not rendered; default view = chips + grid + Quick start.
- **Category with 0 exercises:** the tile still renders with `(0) exercises` and stays tappable; the category
  screen shows its own empty list state. (Counts reflect catalogue size, not usage.)

### Error
- **`getAllExercises()` fails** (offline/network): the header stays; below it a centred error block —
  `Couldn't load exercises. {error}` in `error` colour — with an M3 **"Retry"** filled button (40dp, full-round,
  `primary`). Chips, grid and Quick start are **not rendered** during the error. Retry re-invokes the load; success
  restores the normal content.

### Loading
- **Initial load:** a muted `Loading exercises…` text line (current behaviour). Optional upgrade: skeleton
  tiles per Section 17 (`surface-offset` shimmer blocks) — a Type-A style borrow, not taken unless requested.

### Edge cases
- **Empty category:** tile shows `(0) exercises`, still links (see Null above).
- **Single-exercise category:** tile links to a one-row list.
- **Crisis category:** identical anatomy to every other tile (S11); the FAB is the faster path. In D2 the crisis
  tint (`--ex-crisisBg`) must not get extra emphasis.
- **Done 5× today:** counts show catalogue size, not usage; "done today" badges live on the exercise row in the
  session flow, never on the landing.
- **Chip rows on narrow screens:** chips wrap (`flex-wrap`) to a second line with `8dp` gaps and chip vertical
  margin for touch spacing.
- **Long category labels:** 2-column tiles (D1/D2) fit current labels; D3's 3-across truncates or shrinks — noted
  as a D3 weakness.

---

## Recommendation

**Pick Direction 2 — "Colour fields".** It is the only direction that genuinely fulfils what the design system is
*for*: colour association per practice type (Section 5) and a survival-response colour language for the state filter
(Section 4) — both things this project already believes in (S25 check-in states) but the landing hasn't adopted yet.
It keeps the /docs-agreed Layout A structure and M3 anatomy (state layers, ripple, 12dp) while making the screen
warm and recognisable instead of neutral.

Two locked values change to get there, and **only these need your sign-off**:

> 🔒 **REVISES ledger Q1 (category tiles):** card fill `surface-container-highest` → `--ex-*-bg` per category,
> icon/label `text` → `--ex-*`.
> 🔒 **REVISES filter-chip selected colour:** `secondarySubtle` fill → the response's `--sr-*-bg` fill + `--sr-*`
> label (and `nsWindow` for "OK / regulated").

If you decline either revision, **Direction 1** delivers the same colour step (tonal icon containers + `--ex-*`
glyphs) with zero locked-decision changes and is the fallback. Direction 3 is not recommended — it revises the
grid shape for a density gain that mostly cosmetic, at the cost of tap targets.

Everything else in D2 is Type-A (icons, sr-chip *addition* if Q1 stays, states, spacing) and applies without
further approval.