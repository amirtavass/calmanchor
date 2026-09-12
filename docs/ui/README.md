# UI/UX Design Docs

ASCII-diagram-driven design for the Calm Anchor app. Documents are built bottom-up and cross-referenced to
the Expo Router file structure (`app/`) and the design-system tokens (`theme/tokens.ts`), so each diagram doubles
as a build checklist.

## Conventions

- Fixed-width monospace ASCII, box-drawing glyphs (`├──`, `▼`, `╔═══╗`).
- One file per flow group. A shared shell doc defines the navigation the rest hang off.
- Every block maps to a route file and a design-system class/token — never a hard-coded hex.
- Doc numbering: `01-`, `02-`, … defines the recommended reading order for the series.

## Files

| File | Concern |
|---|---|
| [`00-design-system-usage-rules.md`](00-design-system-usage-rules.md) | Standing rules for using `design-system/*` as a visual reference: reference hierarchy, anti-patterns (emoji-as-icon-system, flat/no-state-layer components), and how to flag a borrow that revises a locked decision. |
| [`01-navigation-and-ia.md`](01-navigation-and-ia.md) | Navigation shell + information architecture: 5-tab structure, route tree, screen anatomy, Crisis FAB spec, dashboard wireframe. The foundation for all other flows. |

## Planned

- `02-exercise-session-flow.md` — start exercise → timer/steps → pre/post distress → helpfulness → save.
- `03-crisis-flow.md` — Crisis FAB → Ground / Breathe / Quick Reset → contacts.
- `04-checkin-flow.md` — home check-in card → state/survival response/triggers → save.
- `05-portfolio-flow.md` — favourites, safe-space notes, custom categories.

> Upcoming ADRs that affect UI: RLS strategy (ADR-003), journal deletion (ADR-004), research export (ADR-005).
> See `docs/decisions/` and `docs/schema-coaching/05-decision-log.md` for the source decisions.
