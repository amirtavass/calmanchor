# ADR-012 - Offline behaviour: local cache + write-behind outbox

Status: accepted
Date: 2026-10-03
Author: Amirreza

## Context

M3-07 reads: *"Offline-first — `expo-sqlite` + `drizzle-orm`, local cache primary; swap `lib/db.ts`
internals; Supabase opt-in backup."* That sentence supports two very different builds:

1. a **write-behind cache** — reads cached locally so the app works offline, writes queued and
   replayed to Supabase when reachable, with Supabase remaining the source of truth;
2. a **full local-first store** — SQLite becomes primary and Supabase is a backup the user opts
   into, which would mean user data can exist with no account at all.

Option 2 cuts across decisions already in force: **S02/D02 Google-only auth** (a stable internal
UUID tied to a Google identity), **S04 owner-only RLS** (every user-data row is scoped to
`auth.uid()`), and **A4's sign-in gate** at the first exercise. Making local primary would mean the
app must accept, store and eventually reconcile data belonging to nobody.

The 26 Aug meeting already deferred offline to "a later milestone", so the timing was flexible and
the choice could be made on merit. Raised with the project lead 2026-10-03.

## Decision

Build **option 1: local cache + write-behind outbox**, using `expo-sqlite` + `drizzle-orm` behind the
existing `lib/db.ts` seam (as the milestone names). Supabase stays the source of truth and the
auth/RLS model is untouched.

- `lib/offline/` holds the local layer: `schema.ts` (a generic row cache + outbox), `client.ts`
  (lazy open), `store.ts`, `outbox.ts`, `index.ts` (the `readThrough` helper).
- **Reads:** `readThrough` returns cached rows immediately and re-syncs in the background; if the
  cache is empty it blocks on the network once so first paint has data. If both are unavailable the
  caller gets `[]` — an honest empty state, not an endless spinner.
- **Writes:** every write is applied to the cache and appended to the outbox, then flushed
  best-effort. Queued rows are replayed oldest-first. The client generates the primary key
  (`lib/id.ts`), so a replayed insert is an upsert and cannot duplicate.
- **No new conflicts are possible** because records are append-only (D05) and edits are
  last-write-wins. There is nothing to merge.
- SQLite is **optional**: `getLocalDb()` returns `null` when it cannot open (Expo Go, or any device
  failure) and the app degrades to fully-online behaviour. Nothing breaks.

## Rationale

- Honours the user-visible promise — "works offline, nothing is lost" — without re-architecting
  ownership or weakening RLS.
- Keeps the `lib/db.ts` seam that M1 was built around: screens never learn where the data comes from.
- The client-generated key is what makes the queue safe to retry; without it an offline replay could
  duplicate a diary entry, which for this app would be a real harm.
- Dropping the outbox on "delete my data" (S05) means a queued write can never resurrect rows the
  user asked to delete.

## Consequences

- **A dev-client rebuild is required** — `expo-sqlite` is a native module. The project already needs
  one for the `react-native-blob-util` patch (M2-01b), so this adds no new rebuild.
- Writes made while signed out still require network for the Google sign-in gate (A4). That is
  correct: there is no identity to attach the row to.
- Gave up: the literal "Supabase opt-in backup" reading. If that is wanted later, it becomes a
  sync-direction change on top of this layer, not a rewrite.
- Gave up: cross-device reconciliation of *edits* — last-write-wins per D05. Fine for this product.

## Implementation notes

- Local tables: `cache` (key `${table}:${id}`, JSON payload, `sort_key`, `owner_id`) and `outbox`
  (op, table, row_id, payload, attempts, status). Deliberately generic so upstream column changes
  need no local migration.
- Ops: `insert` (upsert by id), `update`, `delete`, `replace_entry_tags` (the only non-`id` table,
  `journal_entry_tags`, replaced wholesale).
- `syncNow()` is called on app start and whenever `AppState` becomes `active`
  (`app/_layout.tsx`). `pendingWriteCount()` is exported for a future quiet "saving…" affordance.
- Queued rows are marked `failed` only after 25 attempts and the payload is never deleted.
