import { asc, eq, inArray, sql } from "drizzle-orm";
import { supabase } from "../supabase";
import { getLocalDb, schema } from "./client";

/**
 * Write-behind queue (M3-07).
 *
 * Records are append-only (D05), so replaying this queue is a pure ordering
 * problem: oldest first, no merges, no conflicts. Every queued row already
 * carries the client-generated primary key (`lib/id.ts`), so a replayed
 * `insert` is an upsert and cannot duplicate.
 *
 * The payload is never dropped — only marked `failed` after many attempts —
 * because losing a diary entry would be worse than a stuck queue.
 */

export type OutboxOp = "insert" | "update" | "delete" | "replace_entry_tags";

const MAX_ATTEMPTS = 25;

export async function enqueue(
  op: OutboxOp,
  tableName: string,
  rowId: string,
  payload: Record<string, unknown> | null,
): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  await db
    .insert(schema.outbox)
    .values({
      op,
      tableName,
      rowId,
      payload: payload ? JSON.stringify(payload) : null,
      createdAt: new Date().toISOString(),
    })
    .run();
}

export async function pendingCount(): Promise<number> {
  const db = getLocalDb();
  if (!db) return 0;
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.outbox)
    .where(eq(schema.outbox.status, "pending"));
  return Number(rows[0]?.n ?? 0);
}

async function applyRemote(
  op: OutboxOp,
  tableName: string,
  rowId: string,
  payload: Record<string, unknown> | null,
): Promise<void> {
  if (op === "insert") {
    const { error } = await supabase.from(tableName as never).upsert(payload as never, {
      onConflict: "id",
    });
    if (error) throw error;
    return;
  }
  if (op === "update") {
    const { error } = await supabase
      .from(tableName as never)
      .update(payload as never)
      .eq("id", rowId);
    if (error) throw error;
    return;
  }
  if (op === "delete") {
    const { error } = await supabase.from(tableName as never).delete().eq("id", rowId);
    if (error) throw error;
    return;
  }
  // replace_entry_tags — junction rows have no `id`; replace the set wholesale.
  const tagIds = Array.isArray(payload?.tag_ids) ? (payload!.tag_ids as string[]) : [];
  const { error: delErr } = await supabase
    .from("journal_entry_tags")
    .delete()
    .eq("entry_id", rowId);
  if (delErr) throw delErr;
  if (tagIds.length > 0) {
    const { error: insErr } = await supabase
      .from("journal_entry_tags")
      .insert(tagIds.map((tag_id) => ({ entry_id: rowId, tag_id })));
    if (insErr) throw insErr;
  }
}

/**
 * Replay pending work against Supabase. Safe to call at any time (after each
 * write, on app foreground, on reconnect) — rows are marked done only once the
 * remote call has succeeded.
 */
export async function flushOutbox(): Promise<{ pushed: number; failed: number; pending: number }> {
  const db = getLocalDb();
  if (!db) return { pushed: 0, failed: 0, pending: 0 };

  const rows = await db
    .select()
    .from(schema.outbox)
    .where(eq(schema.outbox.status, "pending"))
    .orderBy(asc(schema.outbox.id))
    .limit(50);

  let pushed = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      await applyRemote(
        row.op as OutboxOp,
        row.tableName,
        row.rowId,
        row.payload ? (JSON.parse(row.payload) as Record<string, unknown>) : null,
      );
      await db.update(schema.outbox).set({ status: "done" }).where(eq(schema.outbox.id, row.id)).run();
      pushed += 1;
    } catch (e) {
      const attempts = row.attempts + 1;
      await db
        .update(schema.outbox)
        .set({
          attempts,
          lastError: e instanceof Error ? e.message : String(e),
          status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
        })
        .where(eq(schema.outbox.id, row.id))
        .run();
      if (attempts >= MAX_ATTEMPTS) failed += 1;
    }
  }

  const rest = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.outbox)
    .where(eq(schema.outbox.status, "pending"));
  return { pushed, failed, pending: Number(rest[0]?.n ?? 0) };
}

/** Forget every queued row — "delete my data" must not replay old writes. */
export async function dropOutbox(): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  await db.delete(schema.outbox).where(inArray(schema.outbox.status, ["pending", "failed"])).run();
}

/** For diagnostics: rows that have given up. */
export async function failedRows(): Promise<{ op: string; table: string; error: string | null }[]> {
  const db = getLocalDb();
  if (!db) return [];
  const rows = await db.select().from(schema.outbox).where(eq(schema.outbox.status, "failed"));
  return rows.map((r) => ({ op: r.op, table: r.tableName, error: r.lastError }));
}
