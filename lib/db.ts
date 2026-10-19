import { supabase } from "./supabase";
import { ensureSignedIn, getCurrentUserId } from "./auth";
import { nsBucket, type NsStateKey } from "../types/checkin";
import { newId } from "./id";
import {
  applyRemoteOp,
  cacheClearAll,
  cacheGet,
  cacheList,
  cacheRemove,
  cacheUpsert,
  cacheUpsertOne,
  dropOutbox,
  enqueue,
  flushOutbox,
  getLocalDb,
  pendingCount,
  readThrough,
  type OutboxOp,
} from "./offline";

// ============================================================
// TYPES
// ============================================================
export interface JournalEntryInput {
  prompt_id?: string | null;
  body: string;
}

export interface CheckinInput {
  ns_state?: string;
  survival_response?: string;
  triggers?: string[];
  note?: string;
}

export interface SessionInput {
  exercise_id?: string | null;
  started_at?: Date;
  ended_at?: Date | null;
  duration_minutes?: number;
  distress_before?: number;
  distress_after?: number;
  helpfulness?: number;
  note?: string;
}

export interface ProfileInput {
  age_band?: string;
  gender?: string;
  ethnicity?: string;
  treatment_status?: string;
  referral_source?: string;
}

export interface TagInput {
  name: string;
}

/**
 * M3-07: every write lands locally first and is replayed to Supabase by the
 * outbox. `writeThrough` centralises that so the write functions below read
 * like ordinary CRUD. `void flushOutbox()` is best-effort — when the device is
 * offline the row simply stays queued and is sent later (D05 append-only, so
 * replaying is order-preserving and cannot duplicate).
 */
async function writeThrough(
  op: OutboxOp,
  table: string,
  row: Record<string, unknown> | null,
  ownerId: string,
  rowId = String(row?.id ?? ""),
): Promise<void> {
  if (row) await cacheUpsertOne(table, row, ownerId);
  else await cacheRemove(table, rowId);

  // No local database (Expo Go / dev client without the ExpoSQLite module):
  // the outbox cannot persist anything, so write straight to Supabase. Losing
  // the write silently would leave the user's progress at zero.
  if (!getLocalDb()) {
    await applyRemoteOp(op, table, rowId, row ?? null);
    return;
  }

  await enqueue(op, table, rowId, row);
  void flushOutbox();
}

/** Best-effort background flush; used by the app on foreground. */
export async function syncNow() {
  return flushOutbox();
}

export async function pendingWriteCount() {
  return pendingCount();
}

// ============================================================
// JOURNAL ENTRIES
// ============================================================
export async function saveJournalEntry(entry: JournalEntryInput) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save a journal entry");
  const now = new Date().toISOString();
  const row = { id: newId(), user_id: userId, ...entry, created_at: now, updated_at: now };
  await writeThrough("insert", "journal_entries", row, userId);
  return row;
}

const remoteJournalEntries = () =>
  supabase
    .from("journal_entries")
    .select("*, prompts(prompt_text), journal_entry_tags(tags(id, name))")
    .order("created_at", { ascending: false })
    .then((r) => {
      if (r.error) throw r.error;
      return r.data ?? [];
    });

export async function getJournalEntries() {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view your journal");
  return readThrough("journal_entries", userId, remoteJournalEntries);
}

/**
 * Update a journal entry's body — app enforces the S21 edit window (created
 * before 23:59:59 of the calendar day after creation); this only writes.
 */
export async function updateJournalEntry(id: string, body: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to edit an entry");
  const existing = await cacheGet("journal_entries", id);
  const row = {
    id,
    user_id: userId,
    ...(existing?.payload ?? {}),
    body,
    updated_at: new Date().toISOString(),
  };
  await writeThrough("update", "journal_entries", row, userId, id);
}

/** Replace an entry's tag set (S20) — the junction rows are swapped wholesale. */
export async function setJournalEntryTags(entryId: string, tagIds: string[]) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to tag an entry");
  const existing = await cacheGet("journal_entries", entryId);
  const tagRows = tagIds.map((tag_id) => ({ tag_id }));
  const row = {
    ...(existing?.payload ?? {}),
    id: entryId,
    user_id: userId,
    journal_entry_tags: tagRows,
    updated_at: new Date().toISOString(),
  };
  await cacheUpsertOne("journal_entries", row, userId);
  if (!getLocalDb()) {
    await applyRemoteOp("replace_entry_tags", "journal_entry_tags", entryId, { tag_ids: tagIds });
    return;
  }
  await enqueue("replace_entry_tags", "journal_entry_tags", entryId, { tag_ids: tagIds });
  void flushOutbox();
}

const remotePrompts = () =>
  supabase
    .from("prompts")
    .select("*")
    .order("prompt_text")
    .then((r) => {
      if (r.error) throw r.error;
      return r.data ?? [];
    });

export async function getPrompts() {
  return readThrough("prompts", "public", remotePrompts);
}

// ============================================================
// CHECKINS
// ============================================================
export async function saveCheckin(entry: CheckinInput) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save a check-in");
  const now = new Date().toISOString();
  const row = { id: newId(), user_id: userId, ...entry, created_at: now, updated_at: now };
  await writeThrough("insert", "checkins", row, userId);
  return row;
}

const remoteCheckins = () =>
  supabase
    .from("checkins")
    .select("*")
    .order("created_at", { ascending: false })
    .then((r) => {
      if (r.error) throw r.error;
      return r.data ?? [];
    });

export async function getCheckins() {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view check-ins");
  return readThrough("checkins", userId, remoteCheckins);
}

// ============================================================
// EXERCISE SESSIONS
// ============================================================
export async function saveSession(entry: SessionInput) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save a session");
  const now = new Date().toISOString();
  const row = {
    id: newId(),
    user_id: userId,
    ...entry,
    started_at: entry.started_at ? new Date(entry.started_at).toISOString() : now,
    ended_at: entry.ended_at ? new Date(entry.ended_at).toISOString() : null,
    created_at: now,
    updated_at: now,
  };
  await writeThrough("insert", "exercise_sessions", row, userId);
  return row;
}

const remoteSessions = () =>
  supabase
    .from("exercise_sessions")
    .select("*, exercises(title, category)")
    .order("started_at", { ascending: false })
    .then((r) => {
      if (r.error) throw r.error;
      return r.data ?? [];
    });

export async function getSessions() {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view sessions");
  return readThrough("exercise_sessions", userId, remoteSessions);
}

// ============================================================
// PROFILE (research fields — separately stored, never identity)
// ============================================================
/**
 * Identity for the signed-in user, read from the `users` table (28 Aug §5 —
 * identity lives on a separate table from research/behavioural data). Returns
 * null when signed out or when the `users` row is missing. Non-prompting: this
 * read never triggers the Google sign-in flow.
 */
export async function getCurrentUser(): Promise<{
  display_name: string | null;
  email: string | null;
} | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const cached = await cacheGet("users", userId);
  const fetchRemote = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, display_name, email")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? [data] : [];
  };
  if (cached) {
    void fetchRemote()
      .then((rows) => rows.forEach((r) => void cacheUpsertOne("users", r as never, userId)))
      .catch(() => undefined);
    return {
      display_name: (cached.payload.display_name as string | null) ?? null,
      email: (cached.payload.email as string | null) ?? null,
    };
  }
  try {
    const rows = await fetchRemote();
    if (rows[0]) await cacheUpsertOne("users", rows[0] as never, userId);
    return rows[0]
      ? { display_name: rows[0].display_name ?? null, email: rows[0].email ?? null }
      : null;
  } catch {
    return null;
  }
}

export async function getCurrentProfile() {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view your profile");
  const rows = await readThrough("profiles", userId, remoteProfile(userId));
  return rows[0] ?? null;
}

const remoteProfile = (userId: string) => async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, age_band, gender, ethnicity, treatment_status, referral_source")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
};

/**
 * Research profile for the signed-in user (S03). Returns the row, or `null`
 * when signed out / no profile yet. **Non-prompting** — used by the dashboard
 * to decide whether to show the first-sign-in research-questions prompt (A5,
 * 28 Aug §6) without triggering Google sign-in.
 */
export async function getResearchProfile() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const rows = await readThrough("profiles", userId, remoteProfile(userId));
  return rows[0] ?? null;
}

export async function saveProfile(entry: ProfileInput) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save your profile");
  const existing = await cacheGet("profiles", userId);
  const now = new Date().toISOString();
  const row = {
    ...(existing?.payload ?? {}),
    id: (existing?.payload.id as string) ?? newId(),
    user_id: userId,
    ...entry,
    created_at: (existing?.payload.created_at as string) ?? now,
    updated_at: now,
  };
  await writeThrough("update", "profiles", row, userId, String(row.id));
}

// ============================================================
// TAGS (system tags shared; user tags are private)
// ============================================================
const remoteSystemTags = () =>
  supabase
    .from("tags")
    .select("*")
    .is("user_id", null)
    .order("name")
    .then((r) => {
      if (r.error) throw r.error;
      return r.data ?? [];
    });

export async function getSystemTags() {
  return readThrough("tags", "public", remoteSystemTags);
}

export async function createUserTag(entry: TagInput) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to create a tag");
  const now = new Date().toISOString();
  const row = { id: newId(), user_id: userId, name: entry.name, created_at: now, updated_at: now };
  await writeThrough("insert", "tags", row, userId);
  return row;
}

// ============================================================
// S05 / S22 — data deletion & anonymisation
// ============================================================
/**
 * "Delete my data" (S05/D13): rotate this user's UUID across all records
 * to a fresh anonymous id. Mapping is not stored; re-identification is
 * impossible. The anonymised rows remain for research (S27).
 *
 * The local cache and any queued writes are dropped too — a queued replay must
 * never resurrect data the user asked to delete.
 */
export async function anonymiseMyData(): Promise<string | null> {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to delete your data");
  const { data, error } = await supabase.rpc("anonymise_user", { p_user_id: userId });
  if (error) throw error;
  await dropOutbox();
  await cacheClearAll();
  return data as string | null;
}

/**
 * Delete a single journal entry at any time (S22) — does not affect any
 * other record. Runs against the user's own rows via RLS.
 */
export async function deleteJournalEntry(id: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to delete an entry");
  await writeThrough("delete", "journal_entries", null, userId, id);
}

// ============================================================
// EXERCISES (public content — no user_id needed)
// ============================================================
/**
 * Exercise row as the app uses it. `steps` is `jsonb` in Postgres (typed `Json`
 * by `npm run gen:types`), so it is narrowed to `string[]` at this seam — the
 * only place that has to know the column is untyped JSON.
 */
export interface ExerciseRow {
  id: string;
  chapter_id: string | null;
  exercise_type: string;
  category: string;
  title: string;
  steps: string[];
  duration_minutes: number | null;
}

function toExerciseRow(r: Record<string, unknown>): ExerciseRow {
  const raw = r.steps;
  return {
    id: r.id as string,
    chapter_id: (r.chapter_id as string | null) ?? null,
    exercise_type: r.exercise_type as string,
    category: r.category as string,
    title: r.title as string,
    steps: Array.isArray(raw) ? raw.filter((s): s is string => typeof s === "string") : [],
    duration_minutes: (r.duration_minutes as number | null) ?? null,
  };
}

const remoteExercises = () =>
  supabase
    .from("exercises")
    .select("*")
    .order("category", { ascending: true })
    .order("title", { ascending: true })
    .then((r) => {
      if (r.error) throw r.error;
      return r.data ?? [];
    });

export async function getExercisesByCategory(category: string): Promise<ExerciseRow[]> {
  const all = await getAllExercises();
  return all.filter((e) => e.category === category);
}

export async function getAllExercises(): Promise<ExerciseRow[]> {
  const rows = await readThrough("exercises", "public", remoteExercises);
  return rows.map(toExerciseRow);
}

// ============================================================
// CHAPTERS (public — navigation anchors)
// ============================================================
const remoteChapters = () =>
  supabase
    .from("chapters")
    .select("*")
    .order("order_index")
    .then((r) => {
      if (r.error) throw r.error;
      return r.data ?? [];
    });

export async function getChapters() {
  return readThrough("chapters", "public", remoteChapters);
}

// ============================================================
// DASHBOARD STATS (M3-03) — descriptive counts only (S26/D03:
// no mood or wellbeing trend is ever derived or charted; the
// weekly bars carry the nervous-system *state* from check-ins,
// which is not a wellbeing metric). Computed from the local
// cache, so the numbers are available offline too.
// ============================================================
export interface DashboardWeekDay {
  /** "Mon".."Sun" for the six days before today; "Today" for today. */
  day: string;
  /** Window-of-tolerance bucket of the last check-in that day, if any. */
  state: NsStateKey | null;
  /** True when any check-in was saved that day, with or without a state. */
  hasCheckin: boolean;
  isToday: boolean;
  /** Bar height in dp — presence is the message, height carries no metric. */
  height: number;
}

export interface DashboardStats {
  sessions: number;
  /** Consecutive days with any activity — exercise, check-in or journal entry. */
  streak: number;
  week: DashboardWeekDay[];
  daysInWindow: number;
  daysWithState: number;
  inWindowPct: number;
  checkedInToday: boolean;
}

/** Local calendar-day key (YYYY-MM-DD) so "a day" matches the user's day. */
function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view your stats");

  const [sessionRows, checkinRows, journalRows] = await Promise.all([
    readThrough("exercise_sessions", userId, remoteSessions),
    readThrough("checkins", userId, remoteCheckins),
    readThrough("journal_entries", userId, remoteJournalEntries),
  ]);

  const today = new Date();
  const todayKey = localDayKey(today);

  const dayKeyOf = (r: Record<string, unknown>) =>
    localDayKey(
      new Date(
        (r.started_at ?? r.created_at ?? new Date().toISOString()) as string,
      ),
    );

  // A streak day is any day the user did something: an exercise, a check-in or
  // a journal entry. The app should never show "0d" to someone who just
  // finished an exercise because only one of the three was counted.
  const activityDays = new Set<string>([
    ...sessionRows.map(dayKeyOf),
    ...checkinRows.map(dayKeyOf),
    ...journalRows.map(dayKeyOf),
  ]);
  let streak = 0;
  let cursor = activityDays.has(todayKey) ? today : addDays(today, -1);
  while (activityDays.has(localDayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  const stateByDay = new Map<string, NsStateKey | null>();
  const hadCheckinOn = new Set<string>();
  for (const row of checkinRows) {
    const key = localDayKey(new Date(row.created_at as string));
    hadCheckinOn.add(key);
    const bucket = nsBucket(row.ns_state as string | null);
    if (bucket) stateByDay.set(key, bucket);
  }

  const week: DashboardWeekDay[] = [];
  let daysInWindow = 0;
  let daysWithState = 0;
  for (let i = 6; i >= 0; i -= 1) {
    const d = addDays(today, -i);
    const key = localDayKey(d);
    const isToday = key === todayKey;
    const state = stateByDay.get(key) ?? null;
    if (state) {
      daysWithState += 1;
      if (state === "window") daysInWindow += 1;
    }
    week.push({
      day: isToday ? "Today" : d.toLocaleDateString("en-GB", { weekday: "short" }),
      state,
      hasCheckin: hadCheckinOn.has(key),
      isToday,
      height: state || (isToday && hadCheckinOn.has(key)) ? 32 : 12,
    });
  }

  return {
    sessions: sessionRows.length,
    streak,
    week,
    daysInWindow,
    daysWithState,
    inWindowPct: daysWithState > 0 ? Math.round((daysInWindow / daysWithState) * 100) : 0,
    checkedInToday: hadCheckinOn.has(todayKey),
  };
}

// ============================================================
// PORTFOLIO (M3-04) — favourites · safe-space notes · custom
// strategies. Owner-only rows (RLS); browse-first sign-in at save.
// ============================================================
export interface FavouriteRow {
  id: string;
  exercise_id: string;
  created_at: string;
  exercises: { id: string; title: string; category: string; duration_minutes: number | null } | null;
}

export interface NoteRow {
  id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface StrategyRow {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
}

const remoteFavourites = () =>
  supabase
    .from("favourites")
    .select("id, exercise_id, created_at, exercises(id, title, category, duration_minutes)")
    .order("created_at", { ascending: false })
    .then((r) => {
      if (r.error) throw r.error;
      return (r.data ?? []) as unknown as FavouriteRow[];
    });

export async function getFavourites(): Promise<FavouriteRow[]> {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view your portfolio");
  return readThrough("favourites", userId, remoteFavourites) as Promise<FavouriteRow[]>;
}

/** Exercise ids the user has favourited — one read for the star state. */
export async function getFavouriteExerciseIds(): Promise<Set<string>> {
  const userId = await getCurrentUserId();
  if (!userId) return new Set();
  const local = await cacheList("favourites", userId);
  if (local.length > 0) {
    return new Set(local.map((r) => String(r.payload.exercise_id ?? "")));
  }
  // No local cache (Expo Go / first run): read the star state from Supabase.
  try {
    const rows = await remoteFavourites();
    await cacheUpsert("favourites", rows as unknown as Record<string, unknown>[], userId);
    return new Set(rows.map((r) => r.exercise_id));
  } catch {
    return new Set();
  }
}

export async function addFavourite(exerciseId: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save to your portfolio");
  const now = new Date().toISOString();
  const row = {
    id: newId(),
    user_id: userId,
    exercise_id: exerciseId,
    created_at: now,
    updated_at: now,
  };
  await writeThrough("insert", "favourites", row, userId);
}

export async function removeFavourite(exerciseId: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to update your portfolio");
  const existing = (await cacheList("favourites", userId)).find(
    (r) => r.payload.exercise_id === exerciseId,
  );
  if (!existing && !getLocalDb()) {
    // No local index (Expo Go): resolve the row id from Supabase itself.
    const { data, error } = await supabase
      .from("favourites")
      .select("id")
      .eq("exercise_id", exerciseId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) await writeThrough("delete", "favourites", null, userId, data.id);
    return;
  }
  await writeThrough("delete", "favourites", null, userId, existing?.id ?? exerciseId);
}

const remoteNotes = () =>
  supabase
    .from("safe_space_notes")
    .select("id, body, created_at, updated_at")
    .order("created_at", { ascending: false })
    .then((r) => {
      if (r.error) throw r.error;
      return (r.data ?? []) as NoteRow[];
    });

export async function getSafeSpaceNotes(): Promise<NoteRow[]> {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view your notes");
  return readThrough("safe_space_notes", userId, remoteNotes) as Promise<NoteRow[]>;
}

export async function saveSafeSpaceNote(body: string, id?: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save a note");
  const now = new Date().toISOString();
  const existing = id ? await cacheGet("safe_space_notes", id) : null;
  const row = {
    ...(existing?.payload ?? {}),
    id: id ?? newId(),
    user_id: userId,
    body,
    created_at: (existing?.payload.created_at as string) ?? now,
    updated_at: now,
  };
  await writeThrough(id ? "update" : "insert", "safe_space_notes", row, userId, String(row.id));
}

export async function deleteSafeSpaceNote(id: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to delete a note");
  await writeThrough("delete", "safe_space_notes", null, userId, id);
}

const remoteStrategies = () =>
  supabase
    .from("custom_strategies")
    .select("id, title, body, created_at, updated_at")
    .order("created_at", { ascending: false })
    .then((r) => {
      if (r.error) throw r.error;
      return (r.data ?? []) as StrategyRow[];
    });

export async function getCustomStrategies(): Promise<StrategyRow[]> {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view your strategies");
  return readThrough("custom_strategies", userId, remoteStrategies) as Promise<StrategyRow[]>;
}

export async function saveCustomStrategy(
  entry: { title: string; body?: string },
  id?: string,
) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save a strategy");
  const now = new Date().toISOString();
  const existing = id ? await cacheGet("custom_strategies", id) : null;
  const row = {
    ...(existing?.payload ?? {}),
    id: id ?? newId(),
    user_id: userId,
    title: entry.title,
    body: entry.body ?? null,
    created_at: (existing?.payload.created_at as string) ?? now,
    updated_at: now,
  };
  await writeThrough(id ? "update" : "insert", "custom_strategies", row, userId, String(row.id));
}

export async function deleteCustomStrategy(id: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to delete a strategy");
  await writeThrough("delete", "custom_strategies", null, userId, id);
}
