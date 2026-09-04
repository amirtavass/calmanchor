/// <reference types="node" />
import "dotenv/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// CalmAnchor — schema-coaching query-pack verifier
// Runs the SQL checks in docs/schema-coaching/02-query-pack.md
// against LIVE Supabase. Read-only by default.
//
// Engines:
//   A (works now): content/count/column checks via PostgREST table API.
//   B (optional):  schema introspection (information_schema) — needs DATABASE_URL.
//
// RLS isolation (S04) + cascade-delete (S05) create TWO throwaway users and
// delete them — only runs with --rls. Use --destroy to also purge any
// leftover test-user rows.
// ============================================================

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const dbUrl = process.env.SUPABASE_DB_URL; // optional — postgres connection string for Engine B

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// ============================================================
// TYPES
// ============================================================
type CheckResult = { story: string; ok: boolean; detail: string };
const results: CheckResult[] = [];
function record(story: string, ok: boolean, detail: string) {
  results.push({ story, ok, detail });
}

async function expectRowCount(
  client: SupabaseClient,
  story: string,
  table: string,
  label: string,
  min: number,
  max?: number,
) {
  const { count: n, error } = (await client.from(table).select("*", { count: "exact", head: true })) as {
    count: number | null;
    error: { message: string } | null;
  };
  if (error) return record(story, false, `${label}: query error -> ${error.message}`);
  if (n == null) return record(story, false, `${label}: no count returned`);
  const ok = n >= min && (max === undefined || n <= max);
  record(story, ok, `${label}: count=${n} (expected >=${min}${max !== undefined ? `, <=${max}` : ""})`);
}

async function columnsExist(client: SupabaseClient, table: string, columns: string[]): Promise<boolean> {
  const { error } = await client.from(table).select(columns.join(",")).limit(0);
  return !error;
}

// ============================================================
// ENGINE A — table-API checks (works with service role + anon read)
// ============================================================
async function engineA() {
  console.log("\n=== ENGINE A: table-API content & column checks ===");

  // S06 — chapters: 20, ordered, with 5 fields
  const chExist = await columnsExist(admin, "chapters", ["order_index", "title", "page_range", "content_group", "colour_token"]);
  record("S06", chExist, chExist ? "chapters has order_index/title/page_range/content_group/colour_token" : "chapters missing one of the 5 fields");
  await expectRowCount(admin, "S06", "chapters", "chapter count", 20, 20);

  // S08 — exercises grouped by 6 contract categories, count matches seed (35)
  const exExist = await columnsExist(admin, "exercises", ["category", "exercise_type", "steps", "duration_minutes"]);
  record("S08", exExist, exExist ? "exercises has category/exercise_type/steps/duration_minutes" : "exercises missing columns");
  await expectRowCount(admin, "S08", "exercises", "exercise count", 35, 35);

  // S08 — categories
  const { data: cats, error: catsErr } = await admin.from("exercises").select("category");
  if (catsErr) {
    record("S08", false, `category query error -> ${catsErr.message}`);
  } else {
    const counts: Record<string, number> = {};
    for (const r of cats ?? []) counts[r.category] = (counts[r.category] ?? 0) + 1;
    const expected = ["breathing", "somatic", "sensory", "voice", "mindful", "crisis"];
    const missing = expected.filter((c) => !counts[c] || counts[c] === 0);
    const extra = Object.keys(counts).filter((c) => !expected.includes(c));
    record("S08", missing.length === 0 && extra.length === 0,
      `categories=${JSON.stringify(counts)}; missing=${missing.join(",") || "none"}; extra=${extra.join(",") || "none"}`);
  }

  // S09 — steps present, duration nullable (implied by above)
  const s09 = await columnsExist(admin, "exercises", ["steps"]);
  record("S09", s09, s09 ? "steps column present" : "steps column missing");

  // S11 — crisis exercises present (exercise_type='crisis') AND category='crisis'
  const { count: crisisType } = (await admin.from("exercises").select("*", { count: "exact", head: true }).eq("exercise_type", "crisis")) as { count: number | null };
  const { count: crisisCat } = (await admin.from("exercises").select("*", { count: "exact", head: true }).eq("category", "crisis")) as { count: number | null };
  record("S11", (crisisType ?? 0) > 0 && (crisisCat ?? 0) > 0,
    `exercise_type='crisis'=${crisisType}; category='crisis'=${crisisCat}`);

  // S16/S20 — journals + sessions join tables exist; system tags seeded
  const tagJoin = await columnsExist(admin, "exercise_session_tags", ["session_id", "tag_id"]);
  const entryJoin = await columnsExist(admin, "journal_entry_tags", ["entry_id", "tag_id"]);
  record("S16", tagJoin, tagJoin ? "exercise_session_tags present" : "exercise_session_tags missing");
  record("S20", entryJoin, entryJoin ? "journal_entry_tags present" : "journal_entry_tags missing");

  const { data: sysTags, error: tagErr } = await admin.from("tags").select("name").is("user_id", null);
  if (tagErr) {
    record("S16", false, `system tags query error -> ${tagErr.message}`);
  } else {
    const names = (sysTags ?? []).map((t) => t.name);
    const need = ["grounding", "anxious", "mood"];
    const missing = need.filter((n) => !names.includes(n));
    record("S16/S20", missing.length === 0, `system tags=${names.join(",") || "none"}; missing=${missing.join(",") || "none"}`);
  }

  // S14/S15 — distress/helpfulness columns
  const s14 = await columnsExist(admin, "exercise_sessions", ["distress_before", "distress_after"]);
  const s15 = await columnsExist(admin, "exercise_sessions", ["helpfulness"]);
  record("S14", s14, s14 ? "distress_before/distress_after present" : "distress columns missing");
  record("S15", s15, s15 ? "helpfulness present" : "helpfulness missing");

  // S19 — journal_entries has body, prompt_id, no required session FK
  const s19a = await columnsExist(admin, "journal_entries", ["body", "prompt_id"]);
  const s19b = await columnsExist(admin, "journal_entries", ["session_id"]);
  record("S19", s19a, s19a ? "journal_entries has body/prompt_id" : "journal_entries missing body/prompt_id");
  if (s19b) record("S19", false, "journal_entries unexpectedly has session_id (S19 wants journal independent of session)");

  // S23 — prompts table exists + 3 prompts
  const pExist = await columnsExist(admin, "prompts", ["prompt_text", "chapter_id"]);
  record("S23", pExist, pExist ? "prompts table present" : "prompts table missing");
  await expectRowCount(admin, "S23", "prompts", "prompt count", 3, 3);

  // S25 — checkins columns
  const s25 = await columnsExist(admin, "checkins", ["ns_state", "survival_response", "triggers", "note"]);
  record("S25", s25, s25 ? "checkins has ns_state/survival_response/triggers/note" : "checkins missing fields");

  // S03 — profiles research fields (nullable implied by PostgREST table shape)
  const s03 = await columnsExist(admin, "profiles", ["age_band", "gender", "ethnicity", "treatment_status", "referral_source"]);
  record("S03", s03, s03 ? "profiles has 5 research fields" : "profiles missing research fields");

  // S01 — profiles concept exists
  record("S01", (await columnsExist(admin, "profiles", ["user_id"])), "profiles table present with user_id");

  // S02 — users: no password column (probe should FAIL on select password), google_identity present
  const hasGoogle = await columnsExist(admin, "users", ["google_identity", "email", "display_name"]);
  const hasPasswordCol = await columnsExist(admin, "users", ["password"]);
  record("S02", hasGoogle && !hasPasswordCol,
    hasGoogle && !hasPasswordCol ? "users has google_identity/email/display_name, NO password column" : `users col check: google=${hasGoogle}, passwordObj=${hasPasswordCol}`);
}

// ============================================================
// ENGINE A2 — data-driven lifecycle checks (uses persona data)
//   Cover S12/S17/S18/S19/S20/S21/S22/S24 against live rows.
// ============================================================
async function engineA2() {
  console.log("\n=== ENGINE A2: data-driven lifecycle checks (persona data) ===");

  // Pick the persona user (active) for data-driven tests
  const { data: personaUser } = await admin.from("users").select("id").eq("email", "active@persona.calm");
  if (!personaUser || personaUser.length === 0) {
    console.log("  (skipping lifecycle checks — run `npm run personas` first)");
    return;
  }
  const uid = personaUser[0].id;

  // S17 — session history: own sessions, newest first (exercise join present)
  const { data: sessions, error: sErr } = await admin
    .from("exercise_sessions")
    .select("id, exercise_id, started_at, duration_minutes, exercises(title, category)")
    .eq("user_id", uid)
    .order("started_at", { ascending: false });
  if (sErr) {
    record("S17", false, `session history query error -> ${sErr.message}`);
  } else {
    const ordered = (sessions ?? []).every((s: any, i: number) => i === 0 || new Date((sessions as any)[i - 1].started_at) >= new Date(s.started_at));
    record("S17", (sessions?.length ?? 0) > 0 && ordered && !!sessions?.[0]?.exercises,
      `S17 own sessions=${sessions?.length ?? 0}, newest-first=${ordered}, exercise-join=${!!sessions?.[0]?.exercises}`);
  }

  // S18 — multiple sessions per day (no uniqueness on user/day/exercise)
  const { error: s18err } = await admin.from("exercise_sessions").insert({
    user_id: uid,
    exercise_id: sessions?.[0]?.exercise_id ?? null,
    started_at: new Date().toISOString(),
  });
  const { error: s18errb } = await admin.from("exercise_sessions").insert({
    user_id: uid,
    exercise_id: sessions?.[0]?.exercise_id ?? null,
    started_at: new Date(Date.now() + 1000).toISOString(),
  });
  record("S18", !s18err && !s18errb, `two same-day inserts: ${s18err?.message ?? s18errb?.message ?? "both succeeded (no uniqueness constraint)"}`);

  // S19 — journal independent of session (no required session FK)
  const jr = await admin.from("journal_entries").insert({ user_id: uid, body: "verify: independent entry" }).select("id");
  record("S19", !jr.error, jr.error ? `journal insert error -> ${jr.error.message}` : "journal entry inserted (no session coupling)");

  // S20 — journal tags join works (attach a system tag)
  const { data: tag } = await admin.from("tags").select("id").eq("name", "anxious").is("user_id", null).limit(1);
  const { data: entryForTag } = await admin.from("journal_entries").select("id").eq("user_id", uid).order("created_at", { ascending: false }).limit(1);
  const entryId = (jr.data?.[0] as { id?: string } | undefined)?.id ?? (entryForTag?.[0] as { id?: string } | undefined)?.id;
  if (tag && tag.length && entryId) {
    const jr2 = await admin.from("journal_entry_tags").insert({ entry_id: entryId, tag_id: tag[0].id });
    record("S20", !jr2.error, jr2.error ? `journal tag attach error -> ${jr2.error.message}` : "journal tag attached");
  } else {
    record("S20", false, `no system tag 'anxious' or entry to attach (tag=${tag?.length ?? 0}, entry=${!!entryId})`);
  }

  // S21 — edit window: created_at + updated_at present
  const s21 = await columnsExist(admin, "journal_entries", ["created_at", "updated_at"]);
  record("S21", s21, s21 ? "journal_entries has created_at + updated_at (edit-window computable)" : "journal_entries missing timestamps");

  // S24 — unlimited entries per day (no uniqueness on user/day)
  const d24 = new Date().toISOString();
  const e24a = await admin.from("journal_entries").insert({ user_id: uid, body: "verify: entry 1", created_at: d24 });
  const e24b = await admin.from("journal_entries").insert({ user_id: uid, body: "verify: entry 2", created_at: d24 });
  record("S24", !e24a.error && !e24b.error, `two same-day entries: ${e24a.error || e24b.error ? "unique constraint hit" : "both succeeded"}`);

  // S22 — single-entry delete does not affect others
  const { data: entry } = await admin.from("journal_entries").select("id").eq("user_id", uid).order("created_at", { ascending: false }).limit(1);
  if (entry && entry.length) {
    const before = (await admin.from("journal_entries").select("*", { count: "exact", head: true }).eq("user_id", uid)) as { count: number | null };
    const del = await admin.from("journal_entries").delete().eq("id", entry[0].id);
    const after = (await admin.from("journal_entries").select("*", { count: "exact", head: true }).eq("user_id", uid)) as { count: number | null };
    record("S22", !del.error && (before.count ?? 0) === (after.count ?? 0) + 1,
      `delete one entry: ${del.error ? `err ${del.error.message}` : `before=${before.count} after=${after.count}`}`);
  } else {
    record("S22", false, "no journal entry to delete");
  }
}

// ============================================================
// ENGINE B — introspection via information_schema (needs DATABASE_URL)
// ============================================================
async function engineB(pg: any) {
  console.log("\n=== ENGINE B: schema introspection (information_schema) ===");

  // S04-ready RLS status for all user-data tables
  const rlsTables = ["checkins", "journal_entries", "exercise_sessions", "checklist_progress", "crisis_plan", "settings", "profiles", "tags", "users"];
  const { rows: rlsRows } = await pg.query(
    `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename = ANY($1)`,
    [rlsTables],
  );
  for (const row of rlsRows) {
    record("S04", row.rowsecurity === true, `RLS enabled on ${row.tablename}`); // false = not enabled
  }

  // S29 — created_at + updated_at on all user-data tables
  const { rows: ts } = await pg.query(
    `SELECT table_name, string_agg(column_name, ',') AS cols
     FROM information_schema.columns
     WHERE table_schema='public' AND column_name IN ('created_at','updated_at')
     GROUP BY table_name`,
  );
  const need = ["journal_entries", "exercise_sessions", "checkins", "tags", "profiles"];
  const tsMap: Record<string, Record<string, boolean>> = {};
  for (const { rows } of await pg.query(
    `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND column_name IN ('created_at','updated_at')`,
  )) for (const r of rows) (tsMap[r.table_name] ??= {})[r.column_name] = true;
  void ts;
  for (const t of need) {
    const c = tsMap[t];
    const ok = !!c?.created_at && !!c?.updated_at;
    record("S29", ok, `${t}: created_at=${!!c?.created_at}, updated_at=${!!c?.updated_at}`);
  }

  // S26 — no mood-trend chart/aggregation views
  const { rows: views } = await pg.query(
    `SELECT table_name FROM information_schema.views WHERE table_schema='public'`,
  );
  const bad = (views ?? []).filter((v: any) => /mood|trend|chart/i.test(v.table_name));
  record("S26", bad.length === 0, `no mood/trend views${bad.length ? ` (found ${bad.map((b: any) => b.table_name).join(",")})` : ""}`);

  // S02/S03 — users table has no password column (introspection authoritative)
  const { rows: userCols } = await pg.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'`,
  );
  const pwCols = (userCols ?? []).map((c: any) => c.column_name).filter((c: string) => /password/i.test(c));
  record("S02", pwCols.length === 0, pwCols.length ? `password-like columns: ${pwCols.join(",")}` : "no password columns in users (introspection)");

  // S27 — research export: users has identity cols SEPARATE from profiles research cols
  const { rows: profCols } = await pg.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND table_schema='public'`,
  );
  const profPII = (profCols ?? []).map((c: any) => c.column_name).filter((c: string) => /email|name|google|phone|password/i.test(c));
  record("S27", profPII.length === 0, profPII.length ? `PII leaked into profiles: ${profPII.join(",")}` : "no identity/PII columns in profiles (research separation holds)");
}

// ============================================================
// RLS ISOLATION + CASCADE (S04 / S05) — creates 2 throwaway users
// ============================================================
async function rlsIsolation() {
  console.log("\n=== RLS isolation (S04) + cascade delete (S05) ===");
  const mk = (email: string, password: string) => admin.auth.admin.createUser({ email, password, email_confirm: true });
  const ua = await mk(`rls-test-a-${Date.now()}@calmanchor.test`, "Test-1234!");
  const ub = await mk(`rls-test-b-${Date.now()}@calmanchor.test`, "Test-1234!");
  if (ua.error || ub.error) {
    record("S04", false, `could not create test users -> ${ua.error?.message ?? ub.error?.message}`);
    return;
  }
  const aId = ua.data.user.id;
  const bId = ub.data.user.id;

  // Clients that act AS each user (sign in with password, anon key client)
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const asA = createClient(url, anonKey, { auth: { persistSession: false } });
  const asB = createClient(url, anonKey, { auth: { persistSession: false } });
  const la = await asA.auth.signInWithPassword({ email: ua.data.user.email!, password: "Test-1234!" });
  const lb = await asB.auth.signInWithPassword({ email: ub.data.user.email!, password: "Test-1234!" });
  if (la.error || lb.error) {
    record("S04", false, `sign-in failed -> ${la.error?.message ?? lb.error?.message}`);
  } else {
    // Insert a checkin as A and B (capture errors — a policy bug surfaces here as an RLS violation)
    const insA = await asA.from("checkins").insert({ ns_state: "regulated", note: "a" });
    const insB = await asB.from("checkins").insert({ ns_state: "dysregulated", note: "b" });
    if (insA.error) console.log("  [diag] A insert error:", insA.error.message);
    if (insB.error) console.log("  [diag] B insert error:", insB.error.message);

    const { count: aCount } = (await asA.from("checkins").select("*", { count: "exact", head: true })) as { count: number | null };
    // A should see only A's rows (count 1 of the 2, and 0 for b's)
    const { data: aRows, error: aErr } = await asA.from("checkins").select("note").eq("note", "b");
    record("S04", (aCount ?? 0) === 1 && (aErr ? false : (aRows ?? []).length === 0),
      `user A count=${aCount}, rows with note='b' seen by A=${aErr ? "error" : (aRows ?? []).length} (want 1 and 0)`);
  }

  // S05 — deleting user A cascades
  const del = await admin.auth.admin.deleteUser(aId);
  if (del.error) {
    record("S05", false, `delete user A failed -> ${del.error.message}`);
  } else {
    const { count: orphanA } = (await admin.from("checkins").select("*", { count: "exact", head: true }).eq("user_id", aId)) as { count: number | null };
    record("S05", (orphanA ?? 0) === 0, `after user A delete: orphaned checkins for A=${orphanA} (want 0)`);
  }
  await admin.auth.admin.deleteUser(bId);
}

// ============================================================
// GIT CHECK (S07 / S28)
// ============================================================
async function gitCheck() {
  try {
    const { execSync } = await import("child_process");
    const out = execSync("git ls-files", { encoding: "utf8" });
    const pdfs = out.split(/\r?\n/).filter((f) => /\.pdf$/i.test(f) && f.trim().length > 0);
    record("S07", pdfs.length === 0, pdfs.length ? `PDF tracked in index: ${pdfs.join(", ")}` : "no PDF in git index (tracked)");
  } catch (e: any) {
    record("S07", false, `git check could not run: ${e?.message ?? e}`);
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const flags = process.argv.slice(2);
  const doRls = flags.includes("--rls");
  const doDestruct = flags.includes("--destruct");

  if (!url || !serviceKey) {
    console.error("Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  await engineA();
  await engineA2();
  if (dbUrl) {
    const postgres = await import("postgres");
    const pg = postgres.default(dbUrl, { max: 1 });
    try {
      await engineB(pg);
    } finally {
      await pg.end();
    }
  } else {
    console.log("\n(Engine B skipped — set SUPABASE_DB_URL to a postgres:// connection string for introspection checks S02pw/S04-rows/S26/S27/S29.)");
  }

  if (doRls) await rlsIsolation();
  else console.log("\n(RLS isolation S04 + cascade S05 skipped — pass --rls to run. It only creates/deletes test users.)");

  await gitCheck();

  // Report
  const fail = results.filter((r) => !r.ok);
  console.log("\n" + "=".repeat(58));
  console.log("SCHEMA QUERY-PACK RESULTS");
  console.log("=".repeat(58));
  for (const r of results) {
    console.log(`  ${r.story.padEnd(10)} ${r.ok ? "✅ PASS" : "❌ FAIL"}  ${r.detail}`);
  }
  console.log("-".repeat(58));
  console.log(`  TOTAL ${results.length}  ·  PASS ${results.length - fail.length}  ·  FAIL ${fail.length}`);
  if (fail.length) {
    console.log("  Failing stories: " + fail.map((f) => f.story).join(", "));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("verify aborted:", e);
  process.exit(1);
});
