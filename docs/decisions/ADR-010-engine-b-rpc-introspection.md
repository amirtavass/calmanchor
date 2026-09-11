# ADR-010 - Engine B introspects via RPC, not a direct DB password

Status: accepted
Date: 2026-09-11
Author: Amirreza

## Context

Engine B (schema introspection for stories S02-rows, S04-rows, S26, S27, S29) needs to read
`pg_tables` / `information_schema`. The original design connected over a direct Postgres connection
string (`SUPABASE_DB_URL`) so the verifier could query the catalog directly.

Trying to get that connection working exposed three stacked blockers:

1. **Legacy direct host is IPv6-only.** `db.uqisvrvgjoujxgrqigie.supabase.co` resolves only to `AAAA`
   (e.g. `2a05:d014:...`). Node on this Windows machine returns `getaddrinfo ENOTFOUND` — no usable
   IPv6 path, so the host is unreachable.
2. **The dashboard "Dedicated IPv4 address" add-on costs $4/month** (Pro plan). The shared pooler is
   free and IPv4-capable, but still requires the DB password.
3. **The DB password was reset several times** and never reliably propagated into `.env`; the pooler
   kept answering `password authentication failed for user "postgres"` (pgbouncer reports the base
   role, so a stale/wrong password is indistinguishable from a config error to the user). The
   dashboard shows `[YOUR-PASSWORD]` placeholders rather than the live value, which made the copy-paste
   loop easy to get wrong.

Constraint: `npm run verify:rls` must keep working without anyone juggling a raw Postgres password,
and it must run against the LIVE project (not a fresh local CLI stack, which would be empty).

## Decision

Engine B no longer connects to Postgres directly. Introspection is exposed as a `SECURITY DEFINER`
RPC — `public.get_schema_introspection()` (in `supabase/introspection.sql`) — and the verifier calls it
with the **service-role key already used by Engine A**:

- `services/verify-schema.ts` → `admin.rpc("get_schema_introspection")`.
- The RPC returns a JSON object: RLS flags per user-data table, public views, users/profiles columns,
  and which tables have `created_at`/`updated_at`.
- The `postgres` driver import and the `SUPABASE_DB_URL` branch were removed from the verifier.
- Grants: `execute` to `service_role` and `authenticated` only; `public`/`anon` revoked.

## Rationale

- Uses the one credential that is already proven working in this project (the service-role key).
- No password to store, reset, or URL-encode — removes the entire failure loop above.
- Introspection is read-only schema metadata; a `SECURITY DEFINER` function scoped with
  `set search_path = public` and denied to `anon` exposes nothing sensitive.
- Keeps the checks running against the live DB the app actually uses.
- The dashboard-proven alternative (shared pooler + correct password) is still valid, but it is
  operational friction with no test-value gain over the RPC path.

## Consequences

- `npm run verify:rls` → **46 checks, 46 PASS** (was 29/29 with Engine B skipped). S02-rows, S04-rows,
  S26, S27, S29 now execute and pass.
- **`SUPABASE_DB_URL` is no longer required** for verification. The `.env` line can be removed; the
  key is no longer referenced by `verify-schema.ts`.
- Direct/local database access is **deferred, not abandoned**: still to be revisited to connect this
  machine to Supabase (via the shared pooler with the correct password, or the paid IPv4 add-on) if we
  ever need ad-hoc SQL that the RPC does not expose. Documented here so the attempt is not lost.
- New introspection stories must be added to `get_schema_introspection()` (and run in the SQL editor),
  not to a new DB connection.

## Implementation notes

- One-time SQL setup in the SQL editor: `supabase/introspection.sql` (creates the RPC + grants).
  Without it, Engine B logs "introspection RPC unavailable" and the run stays at the earlier totals.
- `services/verify-schema.ts` has no dependency on the `postgres` npm package anymore (dependency
  remains installed but unused by this path).
- See `docs/schema-coaching/03-schema-status.md` (2026-09-11 session) for the 46/46 PASS evidence.