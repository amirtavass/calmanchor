import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Local cache + write queue (M3-07).
 *
 * Deliberately a **generic row cache** rather than a mirror of every Postgres
 * column: each record is stored as its JSON payload plus the two columns the
 * app actually filters on. Adding a column upstream then needs no migration
 * here — the schema is a shadow of the data, not of the DDL.
 *
 * `key` is `${table_name}:${id}` so the composite identity is a single
 * primary key, and the client generates `id` (see `lib/id.ts`) which is what
 * makes retried queue writes idempotent.
 */

export const cache = sqliteTable("cache", {
  key: text("key").primaryKey(),
  tableName: text("table_name").notNull(),
  id: text("id").notNull(),
  payload: text("payload").notNull(),
  /** ISO timestamp used for ordering (created_at / started_at). */
  sortKey: text("sort_key"),
  /** user_id for user rows; `'public'` for shared content. */
  ownerId: text("owner_id"),
});

/**
 * Append-only outbox. Records are insert-only by design (D05), so ordering
 * matters and there are no merge conflicts to resolve: rows are replayed
 * oldest-first against Supabase and marked done.
 */
export const outbox = sqliteTable("outbox", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** `insert` | `update` | `delete` | `replace_entry_tags` */
  op: text("op").notNull(),
  tableName: text("table_name").notNull(),
  rowId: text("row_id").notNull(),
  payload: text("payload"),
  createdAt: text("created_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  /** `pending` | `done` | `failed` */
  status: text("status").notNull().default("pending"),
});

export type CacheRow = typeof cache.$inferSelect;
export type OutboxRow = typeof outbox.$inferSelect;
