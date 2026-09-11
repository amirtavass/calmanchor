# M3 Component Design Ledger — Exercises screen (design options)

> **Status:** DESIGN ONLY — no code changed. This is the "agree on design before implementation"
> step. Each component below lists the **M3 spec** (from m3.material.io), our **token mapping**,
> and **2–3 design options** with a recommendation.
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

Status: decisions recorded; implementation follows in `app/(tabs)/exercises.tsx` + components.

---

## Open decisions for the review

- **Q1** Category tiles: filled (A) / outlined (B) / elevated (C)?
- **Q2** State chips container: bare row (M3-typical) or keep the grouping card?
- **Q3** Section labels: brand 800 type (A) or M3 title-medium (B)?
- **Q4** Start/Retry: hand-built M3 filled button (A) or keep Paper contained?
- **Q5** App bar headline: M3 weight 400 (A) or brand 800 (B)?

Nothing is implemented until these are agreed.