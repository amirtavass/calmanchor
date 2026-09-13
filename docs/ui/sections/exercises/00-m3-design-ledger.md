# M3 Component Design Ledger — Exercises screen (design options)

> **Status:** IMPLEMENTED — decisions Q1–Q5 agreed and shipped; see **As-built** at the end of this file
> for the treatments now in code. Each component below lists the **M3 spec** (from m3.material.io), our
> **token mapping**, and the **2–3 design options** that were considered.
> **Route:** `app/(tabs)/exercises.tsx` · **M:** M2 · **Design sources:** m3.material.io (specs) +
> `design-system/calm-anchor-design-system.css` v2.0 + `docs/ui/sections/exercises/01-landing-variants.md`.

## Guiding principle

- **M3 website is the component source of truth.** We replicate its exact dp values, shapes, states
  and typography as hand-built RN components (Paper only for the press ripple / a11y utility).
- **Our design-system tokens supply the colours.** The CSS `--ex-*` / semantic tokens map onto the
  M3 colour roles (via `theme/tokens.ts` → `theme/md3.ts`).
- **Typography conflict to resolve:** M3 components specify Roboto-style type scales (label-large,
  title-large weight 400). Our design system specifies `Cabinet Grotesk` (display, weight 800) for
  titles. RN loads neither font, so both are approximations. Decide **per component** whether M3
  type or brand type wins.

---

## 1. Header — M3 Small app bar

**M3 spec** (`m3.material.io/components/app-bars/specs`):
container height **64dp** · colour `surface` · elevation **0** (not scrolled; `surface-container` on
scroll) · headline **title-large** (22/28) · subtitle **label-medium** (12/16) on `on-surface-variant` ·
trailing icon button 48dp touch target.

**Token mapping:** container ← `surface` (#FAF8F3 / #2E3E26) · headline ← `text` ·
subtitle ← `textMuted` · avatar ← 40dp circle.

| Option | Description |
|---|---|
| **A (recommended)** | Standard M3 small app bar. Surface bg, title-large (400), subtitle label-medium in `textMuted`, trailing avatar. Straight corners, no shadow. |
| B | Same, but headline keeps our brand weight **800 + letter-spacing −0.02** (design-system `.section-title` override on the app bar). |
| C | Keep current ScreenHeader (custom padding, title + avatar) but restyle values to A. |

**Recommendation: A.** M3 wins for component anatomy; our 800-weight type is better used on
section labels inside content (see §5), not the app bar.

---

## 2. State filter — M3 Filter chips

**M3 spec** (`m3.material.io/components/chips/specs`, "Filter chip" table):
container height **32dp** · corner radius **8dp** · icon **18dp** · label **label-large** (14/20/500) ·
padding **16dp** sides (8dp with icon) · **8dp** between elements · **toggle**: unselected =
`surface` + `outline-variant` stroke, `on-surface-variant` label; selected = `secondary-container`
fill + leading **checkmark**, `on-secondary-container` label.

**Token mapping:** `secondary-container` ← `secondarySubtle` · `outline-variant` ← `divider` ·
`on-surface-variant` ← `textMuted` · `on-secondary-container` ← `text`.

| Option | Description |
|---|---|
| **A (recommended)** | M3 filter chips exactly per spec: outlined → filled on selection, 18dp checkmark, 8dp corners, label-large. (This is the `M3Chip` I built earlier — now spec-approved rather than a surprise.) |
| B | Keep Paper `Chip` as-is (current state). |
| C | Filter chips as M3 **outlined chips** (always stroked, colour change only) for lighter emphasis. |

**Container:** chips normally sit directly on the background (M3). Options: **bare row** (M3-typical)
or keep them grouped in a `surface-container-low` card as today.

---

## 3. Category tiles — M3 Cards

**M3 spec** (`m3.material.io/components/cards/specs`):
corner radius **12dp** · padding **16dp** l/r · gap between cards **8dp max** · three variants:

| Variant | Container colour | Edge |
|---|---|---|
| Elevated | `surface-container-low` | shadow (level 1) |
| Filled | `surface-container-highest` | none |
| Outlined | `surface` | `outline-variant` stroke |

**Token mapping:** our `surface-offset` family = `surface-container` family; `divider` = `outline-variant`.

| Option | Description |
|---|---|
| **A (recommended)** | **Filled cards** in `surface-container-highest`, 12dp radius, emoji 34pt, category label + count. Each card carries its **`--ex-*` colour as the emoji tint / small accent bar** so categories stay colour-coded per the design system. |
| B | **Outlined cards** (`surface` + `divider` stroke) — stronger boundary, categories distinguished by emoji only. |
| C | **Elevated cards** (`surface-container-low` + shadow) — most separation, heaviest visual weight. |

**Recommendation: A** (filled keeps the tiles calm; colour remains via the `--ex-*` accent rather
than heavy fills).

---

## 4. Section labels ("Quick start", "Suggested for …")

**M3 type scale:** section headers are typically **title-medium** (16/24) or an **overline** for
micro-labels. Our design system uses `.section-title` (display font, **800**, −0.02em, ~20px).

| Option | Description |
|---|---|
| **A (recommended)** | Keep **brand type** for section labels: 800 weight, letter-spacing −0.02 (matches design system `.section-title`), size ~20. Distinct from M3's body copy, and it's our voice. |
| B | Use M3 **title-medium** (16/24, weight 400-ish) for a purer M3 look. |

---

## 5. Quick start rows — M3 List (two-line) + trailing filled button

**M3 spec** (`m3.material.io/components/lists/specs`):
row height **72dp** (two-line) · container `surface` · label left padding **16dp** · label **body-large**
(16/24) · supporting text **body-medium** (14/20) `on-surface-variant` · trailing element right-aligned.

**M3 spec** (buttons/specs — filled): container height **40dp** · **fully rounded** (radius = height/2
= 20dp) · label **label-large** (14/20/500) · container `primary`, label `onPrimary` · state layers
(hover 8% / focus 12% / pressed 12% of `onPrimary`) · elevation 0 · optional leading icon **20dp**.

**Token mapping:** `primary` ← `primary` (#1C4A32) · `onPrimary` ← `textInverse` · supporting text ← `textMuted`.

| Option | Description |
|---|---|
| **A (recommended)** | Two-line **list items** (72dp): ★ + title + supporting "Breath · 2 steps · ~1 min", trailing **filled button** "Start" (40dp, full round, primary). Rows sit on `surface`. |
| B | Keep the current **card rows** but restyle to M3 card spec (12dp radius) instead of lists. |
| C | Single-line list items (56dp) — title only, more compact; less scannable. |

**Recommendation: A** — matches the ASCII "Favourites (quick start) · [Start]" exactly.

---

## Summary of recommendations (one line each)

1. Header = M3 small app bar (A) · 2. State filter = M3 filter chips (A), bare row · 3. Category
tiles = filled cards + `--ex-*` accent (A) · 4. Section labels = brand type (A) · 5. Quick start =
two-line list + M3 filled button (A).

## Decisions (agreed 2026-09-12)

- **Q1** Category tiles → **Filled** cards (`surface-container-highest`, 12dp radius, `--ex-*` accent).
- **Q2** State chips → **Bare row** on the background (M3-typical), no grouping card.
- **Q3** Section labels → **Brand type** (`.section-title`: weight 800, letter-spacing −0.02em, ~20px).
- **Q4** Start/Retry → **Hand-built M3 filled button** (40dp, radius 20dp, `primary`/`onPrimary`, state layers).
- **Q5** App bar headline → **M3 weight 400** (title-large), subtitle label-medium.

Status: decisions recorded and **implemented**; see "As-built" below.

---

## As-built (shipped, review-approved 2026-09-13)

The Exercises flow is built and has passed three review rounds. These are the treatments now in code —
**new screens should match them** (craft rules generalised in `docs/ui/03-screen-craft.md`, reusable
components in `docs/ui/04-component-library.md`).

| Element | Shipped treatment | File |
|---|---|---|
| Landing state chips | `M3Chip` **tinted mode**: `--sr-*-bg` fill + 1.5dp `--sr-*` stroke + `--sr-*` icon/label; selected = solid `--sr-*` + `textInverse`. Horizontal ScrollView (never wraps). Icons: `flash`/`run`/`snowflake`/`handshake`/`leaf` | `app/(tabs)/exercises.tsx` |
| Landing category tiles | `M3Card fill={--ex-*-bg}`, glyph 28 + label 16/24/700 + count 12/16 @0.75, 48% width | `app/(tabs)/exercises.tsx` |
| Landing quick start | two-line rows: 40dp `--ex-*-bg` lead icon, title 16/24, supporting 14/20, ★ in `warmGold`, trailing filled `M3Button` | `app/(tabs)/exercises.tsx` |
| Detail screen | **Tinted hero** (`--ex-*-bg`, bottom radius 28, `insets.top + 8`): floating 38dp `surface2` back button → 88dp medallion → title 800 → meta pills. Body: tinted "What this is" statement card + icon-led "What to expect" list. **Pinned** action bar: lock-icon sign-in note + full-width `M3Button color={--ex-*}` | `app/exercise/[id].tsx` |
| Category listing | Quiet inset header (`insets.top + 6`), 34dp back target in a 44dp hit area, title + "N exercises" subtitle, tinted `M3Card` rows | `app/exercise/category/[key].tsx` |
| Session shell | One shell for all five stages: icon-only 36dp close (top-right) → content (auto-margin centred, `flexGrow: 1`) → **pinned bottom nav** (secondary `flex: 1`, primary `flex: 1.3`). Actions never move between stages | `app/exercise/session/[id].tsx` |
| Distress scale | `M3Scale`: `--mood-5…1` gradient track + spring thumb + 34dp fixed-height value chip. Fixed-height layout — choosing a value shifts nothing | `components/M3Scale.tsx` |
| Step screen | Sense pill → breathing ring (112dp, `--ex-*`) with expanding halo → statement. **Per-sense hues** (`SENSE_TONES`: see=teal, hear=purple, touch=brown, smell=rose, taste=green) so the flow isn't monochrome. Motion: ring scale 1→1.045 (4s), halo 1→1.65/0.4→0 (3s), text fade-up 350ms | `app/exercise/session/[id].tsx` |
| Helpfulness | Three `M3Button variant="outlined"` full-width, distinct hues + glyphs: `srFreeze`+`emoticon-neutral-outline`, `mood3`+`emoticon-outline`, `success`+`emoticon-happy-outline`; selected fills solid | `app/exercise/session/[id].tsx` |
| Review screen | Centred medallion + headline + subline, then a summary card: exercise row (40dp icon, title, `14:32 → 14:37 · ~5 min`), hairline divider, **SUDS chips coloured via `moodBandKey()`**, "Helped" word row, note as an italic quote block with a `primary` spine | `app/exercise/session/[id].tsx` |
| Result screen | `success` medallion + "Saved", then `--sr-*`-tinted re-check-in cards (2-col, `M3Card fill`), optional and skippable | `app/exercise/session/[id].tsx` |
| Icons | **`@expo/vector-icons`** (MaterialCommunityIcons) everywhere; glyph names typed as `MciGlyph`. `react-native-vector-icons` removed — its fonts are not linked in the dev build, so glyphs rendered as empty boxes | all |
| Native slider | **Removed** (`@react-native-community/slider`) — its ViewManager is absent from the dev build and crashed the session screen. `M3Scale` replaces it | `components/M3Scale.tsx` |

**Superseded by the above:** the emoji glyphs in options Q1/Q3 of this ledger (🫁🧍👂🗣🧠🆘) — replaced by
MaterialCommunityIcons per `00-design-system-usage-rules.md` §2.1; and the "bare row" chip treatment in Q2 —
the shipped chips are tinted per the design-system pill idiom (Type B revision, signed off by the project
lead on 2026-09-13 together with `04-landing-directions.md` D2).