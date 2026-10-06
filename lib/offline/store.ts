import { and, eq, inArray, sql } from "drizzle-orm";
import { getLocalDb, schema } from "./client";

/**
 * Generic cache CRUD (M3-07). Every function is a no-op when SQLite is
 * unavailable, so the rest of `lib/db.ts` can call these unconditionally and
 * simply fall through to the network.
 */

export interface CachedRecord {
  id: string;
  table: string;
  payload: Record<string, unknown>;
  sortKey: string | null;
  ownerId: string | null;
}

const keyOf = (table: string, id: string) => `${table}:${id}`;

function toRecord(row: typeof schema.cache.$inferSelect): CachedRecord {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(row.payload) as Record<string, unknown>;
  } catch {
    payload = {};
  }
  return {
    id: row.id,
    table: row.tableName,
    payload,
    sortKey: row.sortKey,
    ownerId: row.ownerId,
  };
}

/** All cached rows for a table, newest first by `sortKey`. */
export async function cacheList(table: string, ownerId?: string): Promise<CachedRecord[]> {
  const db = getLocalDb();
  if (!db) return [];
  const where = ownerId
    ? and(eq(schema.cache.tableName, table), eq(schema.cache.ownerId, ownerId))
    : eq(schema.cache.tableName, table);
  const rows = await db.select().from(schema.cache).where(where);
  return rows
    .map(toRecord)
    .sort((a, b) => (b.sortKey ?? "").localeCompare(a.sortKey ?? ""));
}

export async function cacheGet(table: string, id: string): Promise<CachedRecord | null> {
  const db = getLocalDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(schema.cache)
    .where(eq(schema.cache.key, keyOf(table, id)))
    .limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function cacheGetMany(table: string, ids: string[]): Promise<CachedRecord[]> {
  const db = getLocalDb();
  if (!db || ids.length === 0) return [];
  const rows = await db
    .select()
    .from(schema.cache)
    .where(and(eq(schema.cache.tableName, table), inArray(schema.cache.id, ids)));
  return rows.map(toRecord);
}

/**
 * Insert-or-replace cached rows. `sortKey` falls back to `created_at` then
 * `started_at`, whichever the row carries.
 */
export async function cacheUpsert(
  table: string,
  rows: Record<string, unknown>[],
  ownerId?: string | null,
): Promise<void> {
  const db = getLocalDb();
  if (!db || rows.length === 0) return;
  const values = rows.map((r) => {
    const id = String(r.id ?? "");
    const sortKey =
      (r.created_at as string | undefined) ?? (r.started_at as string | undefined) ?? null;
    return {
      key: keyOf(table, id),
      tableName: table,
      id,
      payload: JSON.stringify(r),
      sortKey,
      ownerId: ownerId ?? (typeof r.user_id === "string" ? r.user_id : "public"),
    };
  });
  await db
    .insert(schema.cache)
    .values(values)
    .onConflictDoUpdate({
      target: schema.cache.key,
      // `excluded.*` so each row of a bulk upsert writes its own values.
      set: {
        payload: sql`excluded.payload`,
        sortKey: sql`excluded.sort_key`,
      },
    })
    .run();
}

/** Upsert one row at a time — safe for bulk hydrate as well as single writes. */
export async function cacheUpsertOne(
  table: string,
  row: Record<string, unknown>,
  ownerId?: string | null,
): Promise<void> {
  await cacheUpsert(table, [row], ownerId);
}

export async function cacheRemove(table: string, id: string): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  await db.delete(schema.cache).where(eq(schema.cache.key, keyOf(table, id))).run();
}

/** Wipe everything — used by "delete my data" (S05 anonymisation). */
export async function cacheClearAll(): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  await db.delete(schema.cache).run();
}
