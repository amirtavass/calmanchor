# ADR-006 - "Delete my data" is anonymisation by UUID rotation

Status: accepted
Date: 2026-09-05
Author: Amirreza

## Context

Story S05 ("delete my data") and S22 ("delete a single entry") left delete semantics open until D13.
D13 settles the product intent: "delete my data" must **anonymise** — not hard-delete — by rotating the
user's internal UUID to a new random value across every user-data row in one transaction, never storing
the old/new mapping. Individual journal entries (and exercise session entries) requested by the user are
hard-deleted row-by-row at any time. "Delete my account" (full removal) is a distinct action.

Implementation needed a concrete mechanism:

1. The rotation must touch every user-data table, atomically (all-or-nothing), owner-scoped.
2. No mapping table may exist anywhere (re-identification must be impossible).
3. The client needs public seams (`lib/db.ts` discipline) while the rotation itself needs privileges
   higher than anon-key client rights.

## Decision

- Add a `SECURITY DEFINER` SQL function in `public`:

  ```sql
  create or replace function public.anonymise_user(p_user_id uuid)
  returns uuid as $$
  declare new_id uuid := gen_random_uuid(); begin
    update public.checkins           set user_id = new_id where user_id = p_user_id;
    update public.journal_entries    set user_id = new_id where user_id = p_user_id;
    update public.exercise_sessions  set user_id = new_id where user_id = p_user_id;
    update public.checklist_progress set user_id = new_id where user_id = p_user_id;
    update public.crisis_plan        set user_id = new_id where user_id = p_user_id;
    update public.settings           set user_id = new_id where user_id = p_user_id;
    update public.profiles           set user_id = new_id where user_id = p_user_id;
    update public.tags               set user_id = new_id where user_id = p_user_id;
    update public.users
       set google_identity = null, email = null, display_name = null
     where id = p_user_id;
    return new_id;
  end; $$ language plpgsql security definer set search_path = public;
  ```

  - Run in the SQL editor (same workflow as `schema.sql`/`rls.sql`), with
    `grant execute on function public.anonymise_user(uuid) to authenticated;`.
  - `set search_path = public` keeps the definer function from resolving objects elsewhere.
  - The auth-level identity (`auth.users`, `auth.identities`) is intentionally **not** rewritten here —
    detaching Google identity is handled out of band; the `users` row (identity mirror) is cleared below.

- Expose the client seams in `lib/db.ts`:
  - `anonymiseMyData(): Promise<string | null>` — calls `supabase.rpc("anonymise_user", { p_user_id })`
    after `ensureSignedIn()`; returns the fresh anonymous id.
  - `deleteJournalEntry(id)` — hard-deletes a single `journal_entries` row for the signed-in
    user via RLS (`user_id` owner check), any time, per S22/D05.
- No mapping table is created anywhere; the old/new UUID link exists only inside the single transaction.

## Rationale

- Implements D13 literally: anonymisation by rotation, single transaction, no stored mapping.
- Preserves longitudinal research data (S27) while making re-identification impossible.
- S22's row-level hard delete respects user agency without touching any other record.
- A single security-definer function is the only elevated-credential surface: the client never holds
  service-role keys, and owner-scoping is enforced by the `where user_id = p_user_id` argument.

## Consequences

- **User-data rows are never deleted by anonymisation** — only re-pointed and PII-cleared. "Delete my
  account" must be implemented separately (later) if required.
- Each further deletion cycle creates a fresh anonymous identity (D13).
- App copy must distinguish **"delete my data"** (anonymise) from **"delete my account"** (full removal).
- `anonymise_user` runs as the definer (typically `postgres`), so it must be granted explicitly to
  `authenticated`; without the grant the RPC fails at runtime.
- The `users` row's `google_identity` is nulled, so a later Google sign-in re-links to a fresh identity
  path — acceptable per D13 (user becomes a new anonymous entity).

## Implementation notes

- File: `supabase/anonymise.sql` (the only new SQL this session — `schema.sql`/`rls.sql` unchanged).
- Run in the SQL editor, then test against a persona (`active@persona.calm`): call
  `select public.anonymise_user('<uid>');` and confirm old id returns zero rows across user-data tables.