# ADR-011 - Portfolio data model: three owner-only tables

Status: proposed (implemented; awaiting the project lead's confirmation)
Date: 2026-10-03
Author: Amirreza

## Context

M3-04 ("Portfolio tab — favourited exercises, safe-space notes, custom strategies") is in the
lead's milestone plan, and both the design system and the IA describe a Portfolio: *"A personal
'comfort box' of favourited exercises, safe-space notes, and custom strategies. Reorderable,
categorised, fully user-controlled"* (`designsystemHTMLV1.txt`) and *"See favourited exercises …
Read safe-space notes and custom strategies"* (`docs/ui/01-navigation-and-ia.md` §3).

The milestone row itself names the three tables (`favourites`, `safe_space_notes`,
`custom_strategies`) but flags that they are **not in the requirements contract**: stories S01–S29
never mention a portfolio, so there is no query-pack row and no schema-status entry to validate
against. The user-stories pack governs schema work (per `docs/schema-coaching/AGENT.md`), so
adding tables outside it needs a recorded decision and a confirmation rather than a silent
invention.

Options considered:

1. **Three small tables, one per portfolio concern** (chosen) — matches the milestone's own naming
   and the design system's three sections.
2. **One `portfolio_items` table with a `kind` discriminator** — fewer tables, but conflates
   exercise references (an FK to shared content) with free text, and makes "favourite an exercise"
   (a one-tap toggle) carry the same shape as a multi-line note.
3. **Store all three in `settings.settings_data` as JSON** — no schema change at all, but no RLS
   per row, no FK to `exercises`, and no way to delete a single note without read-modify-write on
   a JSON blob.

## Decision

Add three user-data tables — `favourites`, `safe_space_notes`, `custom_strategies` — following the
conventions already established by ADR-003 and the existing user-data tables:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid references users(id) on delete cascade default auth.uid() not null`
- `created_at timestamptz default now()` + `updated_at timestamptz default now()` (S29)
- RLS enabled with explicit per-operation owner-only policies (`auth.uid() = user_id`) — S04
- `favourites` additionally carries `exercise_id uuid references exercises(id) on delete cascade
  not null` and `unique(user_id, exercise_id)`; `safe_space_notes` carries `body text not null`;
  `custom_strategies` carries `title text not null` + `body text`.

## Rationale

- Option 1 mirrors the lead's own milestone wording and the design system's three sections, so the
  code, the schema and the docs say the same thing.
- The constraints above are exactly the existing house style, so the new tables cannot be left
  unprotected or without timestamps — the ADR-003 consequence ("no table can be added without an
  explicit RLS decision") is satisfied here.
- `unique(user_id, exercise_id)` makes "star an exercise" idempotent, which is what a one-tap
  toggle needs; without it a double-tap would create duplicates.
- Nothing here contradicts the workbook or the contract — the contract is simply *silent* on the
  portfolio, which is why this is `proposed` rather than `accepted`.

## Consequences

- The Portfolio tab and the exercise-detail ★ can be real rather than placeholders.
- Three more tables in the S04 RLS list and the S29 timestamps list (`services/verify-schema.ts`),
  so `npm run verify` now covers them.
- **Gave up:** reorderable/categorised portfolio items (the design system asks for reorder) — no
  `order_index` column and no drag-reorder UI. Cheap to add later as a column + a sort key; not
  worth a speculative column today.
- **Still to confirm by the lead:** that these three shapes are the intended ones, and whether the
  portfolio belongs in the requirements contract (a new story) so the query pack can validate it.
  Carried as an open question in `docs/progress/07-questions-for-aamir.md` (2026-10-03).

## Implementation notes

- **Live database:** `supabase/2026-10-03-portfolio.sql` was **applied 2026-10-03** (additive,
  idempotent, nothing existing touched). **Do not re-run `supabase/schema.sql` against live** — it
  drops and recreates every table and would wipe user data (it is a fresh-environment rebuild).
- **Gotcha for future tables:** `supabase/introspection.sql`'s `get_schema_introspection()` carries a
  **hardcoded table list** in its `rls` section. Tables missing from it report `rowsecurity: false`
  in `npm run verify` even when RLS is correctly enabled. The three tables were added to that array
  and the function re-applied; `npm run verify` is 50/50.
- `supabase/schema.sql` + `supabase/rls.sql` updated to carry the canonical definitions.
- App code: `lib/db.ts` (portfolio CRUD), `app/(tabs)/portfolio.tsx`, `app/exercise/[id].tsx` ★.
- Free text in notes/strategies is user-authored personal content. It follows the same rule as
  journal bodies: excluded from any future research export by default (S27 / FAQ).
