export { getLocalDb, type LocalDb } from "./client";
export * from "./schema";
export * from "./store";
export * from "./outbox";

import { cacheList, cacheUpsert } from "./store";

/**
 * Read-through cache (M3-07).
 *
 * - Nothing cached → block on the network once, then cache (first paint has data).
 * - Something cached → return it immediately and re-sync in the background, so
 *   an offline read is instant and an online read never goes stale for long.
 *
 * If both the cache and the network are unavailable the caller gets `[]` — an
 * honest empty state rather than a spinner that never resolves.
 */
export async function readThrough<T extends { id: string }>(
  table: string,
  ownerId: string | null,
  fetchRemote: () => PromiseLike<T[]>,
): Promise<T[]> {
  const local = await cacheList(table, ownerId ?? undefined);
  const localRows = local.map((r) => r.payload as unknown as T);

  const sync = () =>
    Promise.resolve()
      .then(fetchRemote)
      .then((rows) => cacheUpsert(table, rows as unknown as Record<string, unknown>[], ownerId))
      .catch(() => undefined);

  if (localRows.length === 0) {
    try {
      const rows = await fetchRemote();
      await cacheUpsert(table, rows as unknown as Record<string, unknown>[], ownerId);
      return rows;
    } catch {
      return [];
    }
  }

  void sync();
  return localRows;
}
