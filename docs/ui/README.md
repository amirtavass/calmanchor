# UI/UX Design Docs

ASCII-diagram-driven design for the Calm Anchor app. Documents are built bottom-up and cross-referenced to
the Expo Router file structure (`app/`) and the design-system tokens (`theme/tokens.ts`), so each diagram doubles
as a build checklist.

## Conventions

- Fixed-width monospace ASCII, box-drawing glyphs (`├──`, `▼`, `╔═══╗`).
- One file per flow group. A shared shell doc defines the navigation the rest hang off.
- Every block maps to a route file and a design-system class/token — never a hard-coded hex.
- Doc numbering: `00-`, `01-`, … defines the recommended reading order for the series.
- UK spelling throughout (colour, centre, organise, programme).

## Read these first — standing references

These apply to **every** screen and milestone. Do not re-derive their decisions per task.

| File | Concern |
|---|---|
| [`00-design-system-usage-rules.md`](00-design-system-usage-rules.md) | How to use `design-system/*` as a visual reference: reference hierarchy, anti-patterns (emoji-as-icon-system, flat/no-state-layer components, bare text, colour-as-decoration), Type A vs Type B borrows and the 🔒 flag format, Component-decisions tables, and the order of work for a new screen. |
| [`03-screen-craft.md`](03-screen-craft.md) | **UI/UX craft rules** distilled from the shipped, review-approved Exercises screens: the three-zone scaffold, safe-area spacing, centring without clipping, typography scale and voice, "text is never bare" structures, colour roles, controls that never move, motion vocabulary, icons, headers, states, keyboard. Ends with a per-screen checklist. |
| [`04-component-library.md`](04-component-library.md) | What already exists and must be reused: `M3Button`, `M3Chip`, `M3Card`, `M3Scale`, `ScreenHeader` (props + specs), token pairs, copy-paste patterns and the promotion rule, known constraints (icons, no native slider, RN `Animated`). |

**Canonical example screens** (copy patterns from these): `app/exercise/[id].tsx` ·
`app/exercise/session/[id].tsx` · `app/exercise/category/[key].tsx` · `app/(tabs)/exercises.tsx`.

## Structure and navigation

| File | Concern |
|---|---|
| [`01-navigation-and-ia.md`](01-navigation-and-ia.md) | Navigation shell + information architecture: 5-tab structure, route tree, screen anatomy, Crisis FAB spec, dashboard wireframe. The foundation for all other flows. |
| [`02-routing-map.md`](02-routing-map.md) | Route → file → data-call map. |
| [`sections/shell/01-shell.md`](sections/shell/01-shell.md) | Shell screen design (tab bar, header, FAB). |

## Per-section screen designs — `sections/`

### `sections/exercises/` (M2, shipped)

| File | Concern |
|---|---|
| [`00-m3-design-ledger.md`](sections/exercises/00-m3-design-ledger.md) | M3 component specs + token mapping + the agreed decisions (Q1–Q5) and the **as-built** treatments. |
| [`01-landing-variants.md`](sections/exercises/01-landing-variants.md) | Landing layout variants (A/B) considered. |
| [`02-exercise-detail.md`](sections/exercises/02-exercise-detail.md) | Detail screen content and actions. |
| [`03-session-flow.md`](sections/exercises/03-session-flow.md) | **Locked** session flow and data contract: distress-before → steps → distress-after + helpfulness → confirm → result. |
| [`04-landing-directions.md`](sections/exercises/04-landing-directions.md) | Three landing directions with ASCII + Component decisions; recommendation D2 "Colour fields" (approved, shipped). |
| [`05-session-start-ux-directions.md`](sections/exercises/05-session-start-ux-directions.md) | Three session directions; recommendation D2 "Colour-forward" (approved, shipped). |

## Planned

- `sections/crisis/` — Crisis FAB → Ground / Breathe / Quick Reset → contacts.
- `sections/checkin/` — home check-in card → state / survival response / triggers → save.
- `sections/toolkit/` — chapter list + PDF reader + resume position.
- `sections/diary/` — prompts, compose, timeline, edit/delete window, tags.
- `sections/portfolio/` — favourites, safe-space notes, custom strategies (M3).
- `sections/dashboard/` — descriptive patterns only, no mood trend (S26, M3).

> Upcoming ADRs that affect UI: RLS strategy (ADR-003), journal deletion (ADR-004), research export (ADR-005).
> See `docs/decisions/` and `docs/schema-coaching/05-decision-log.md` for the source decisions.
