# ADR-009 - Journey-first screen mapping is M2 scope

Status: accepted
Date: 2026-09-05
Author: Amirreza

## Context

The 2 Sep meeting confirmed **M1 is nearly finished and the screen-mapping tasks can be moved to M2**
("M1 is nearly finished and screening tasks can be moved to M2"). Concurrently, the project lead made two
things standing rules: **journeys before design** ("focusing on user journeys rather than starting with
design elements") and design-before-code (ASCII proposals for shell + exercises before writing any code).
D14 fixes the navigation shape (bottom tabs + persistent Crisis FAB, no hamburger).

M1-21 (2026-09-05) split the old screen-mapping scope: the **shell + exercises** mapping was completed in
M1 (`docs/ui/01-navigation-and-ia.md` v2 + `docs/ui/sections/exercises/`), and the remaining screens —
Toolkit, Diary, Home/check-in, Crisis, Profile — move to M2 as explicit tasks.

## Decision

Screen mapping is a **deliverable of M2** (tracked as M2-11/M2-12), not residual M1 work:

1. **Map each screen's 3–5 actions** to the journey verticals
   (First-Touch · Learn/Read · Find/Choose · Do · Reflect · Check-in · Review · Privacy) — the design
   contract set out in `docs/ui/01-navigation-and-ia.md`.
2. **Produce ASCII proposals for the remaining screens** — Toolkit landing + PDF flow, Diary landing +
   entry flow, Home/check-in, Crisis, Profile — including null / no-data / error / edge states
   (build-practices §3).
3. **Build no screen before its ASCII is proposed and reviewed.** Code for those screens (M2-01..M2-05,
   M2-14) follows the reviewed diagrams, matching D14 (bottom tabs, Crisis FAB, category-card exercises,
   no invented design system).

## Rationale

- Follows the meeting direction: journeys first, ASCII before code, design is cheap while implementation
  is expensive — avoid costly rework by not building against un-mapped screens.
- Keeps `docs/ui/` as a build checklist: each ASCII block maps to a route file and a design token.
- Trauma-informed: a dysregulated user's screens must have one clear purpose; the 3–5-actions rule is
  the guard against overloaded screens.
- M1 can close on its architecture deliverable ("workbook content mapped to screens" = Toolkit PDF + seed
  + shell/exercises mapping) with a clean hand-over of the remaining mapping to M2.

## Consequences

- M1 register closes the mapping as **M1-21 DONE (shell + exercises)**, explicitly deferring the rest.
- M2 register gains **M2-11 (mapping)** and **M2-12 (ASCII + edge states)**; the nav shell and Crisis
  FAB arrive as **M2-14** (absorbing M1-13/M1-14).
- No code for Toolkit/Diary/Crisis/Profile screens until their ASCII is proposed and reviewed.
- The ASCII docs stay in sync with `app/` route files and `theme/tokens.ts`; every new screen must
  repeat the 3–5-actions check.

## Implementation notes

- Extend `docs/ui/01-navigation-and-ia.md` (milestone tag now M2) and add sections under
  `docs/ui/sections/` mirroring the exercises set (`01-landing-variants.md`, `02-exercise-detail.md`,
  `03-session-flow.md`).
- Route files to design against: `app/toolkit.tsx` (exists), `app/diary/`, `app/crisis/`,
  `app/profile/`, home check-in (in the tab shell).
- Every ASCII must include the Crisis FAB (D14) and design-system tokens only.