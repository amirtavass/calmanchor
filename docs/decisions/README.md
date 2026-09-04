# Decisions (ADR)

Architectural Decision Records for the Calm Anchor app. One file per decision; numbering is stable
(`ADR-NNN`). Follow the ADR shape in `docs/schema-coaching/templates/ADR.md` when writing a new entry —
copy the format and headings; do not edit the template itself (it is project-lead-owned).

## Status values

`proposed` → `accepted` → `superseded by ADR-NNN` (never deleted).

## How to record a decision

1. Copy the template into a new file `docs/decisions/ADR-NNN-<short-slug>.md`.
2. Fill in context, decision, rationale, consequences, implementation notes.
3. Cross-reference any source decision in `docs/schema-coaching/05-decision-log.md` (e.g. D08).
4. Add one line to this index's register table (append-only, one row per new ADR).

## Register (append-only)

| ADR | Title | Status | Date | Author |
|---|---|---|---|---|
| ADR-001 | Toolkit PDF read source | accepted | 2026-08-30 | Amirreza |
| ADR-003 | RLS: on all tables, difference in the policy | accepted | 2026-08-30 | Amirreza |
| ADR-002 | Auth: Google-only sign-in, no anonymous path | accepted | 2026-09-05 | Amirreza |
| ADR-006 | "Delete my data" is anonymisation by UUID rotation | accepted | 2026-09-05 | Amirreza |
| ADR-009 | Journey-first screen mapping is M2 scope | accepted | 2026-09-05 | Amirreza |

> Remaining known candidate ADRs (shape from `schema-coaching/templates/ADR.md`, not yet written):
> - **ADR-004** Journal entry deletion — soft vs hard delete (source: S22; D13 resolves to row-level hard
>   delete at any time)
> - **ADR-005** Research export — free-text inclusion policy (source: S27)
> - **ADR-007** Dummy-data personas + schema stress-test as the M2 build gate — `services/personas.ts`
>   (`@persona.calm` accounts), Engine A2 → 29/29 PASS
> - **ADR-008** Design-system single source of truth — `designsystemtext.txt` v2.0; `theme/tokens.ts` +
>   app CSS reconciled to it (one divergence found & fixed)

## Next-up

ADR-002 (auth), ADR-006 (anonymisation) and ADR-009 (screen mapping → M2) are now recorded as accepted.
Remaining candidates to write soonest: **ADR-007** (personas + stress-test as the M2 build gate) and
**ADR-008** (design system single source of truth) — both decisions are already implemented, only the
records are missing. (RLS — the former ADR-003 — is resolved as ADR-003.)
