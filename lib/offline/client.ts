import { requireOptionalNativeModule } from "expo";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

/**
 * Lazy, failure-tolerant local database (M3-07).
 *
 * `getLocalDb()` returns `null` when SQLite cannot be opened — on Expo Go it is
 * unavailable, and any device failure should degrade to "everything is remote"
 * rather than break the app. Every caller in `lib/offline/store.ts` checks for
 * `null` and falls back to the network.
 */

export type LocalDb = ExpoSQLiteDatabase<typeof schema>;

const DB_NAME = "calmanchor-cache.db";

let db: LocalDb | null = null;
let attempted = false;

export function getLocalDb(): LocalDb | null {
  if (attempted) return db;
  attempted = true;
  try {
    // Check for the native module *before* requiring `expo-sqlite`: its module
    // factory calls `requireNativeModule('ExpoSQLite')` at import time, and
    // Metro's dev loader reports any factory error as a fatal error before a
    // surrounding try/catch can suppress it. A missing module simply means the
    // app runs online-only (Expo Go / a dev client built before it was added).
    if (!requireOptionalNativeModule("ExpoSQLite")) {
      db = null;
      return null;
    }
    const { drizzle } = require("drizzle-orm/expo-sqlite") as typeof import("drizzle-orm/expo-sqlite");
    const { openDatabaseSync } = require("expo-sqlite") as typeof import("expo-sqlite");
    const sqlite = openDatabaseSync(DB_NAME);
    sqlite.execSync(`
      create table if not exists cache (
        key        text primary key not null,
        table_name text not null,
        id         text not null,
        payload    text not null,
        sort_key   text,
        owner_id   text
      );
      create index if not exists idx_cache_table on cache(table_name);
      create index if not exists idx_cache_owner on cache(owner_id);

      create table if not exists outbox (
        id         integer primary key autoincrement,
        op         text not null,
        table_name text not null,
        row_id     text not null,
        payload    text,
        created_at text not null,
        attempts   integer not null default 0,
        last_error text,
        status     text not null default 'pending'
      );
      create index if not exists idx_outbox_status on outbox(status);
    `);
    db = drizzle(sqlite, { schema });
    return db;
  } catch {
    // No local cache on this device — the app keeps working entirely online.
    db = null;
    return null;
  }
}

export { schema };
