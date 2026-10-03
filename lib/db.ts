import { supabase } from "./supabase";
import { ensureSignedIn, getCurrentUserId } from "./auth";
import { nsBucket, type NsStateKey, type SurvivalKey } from "../types/checkin";

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

// ============================================================
// JOURNAL ENTRIES
// ============================================================
export async function saveJournalEntry(entry: JournalEntryInput) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save a journal entry");
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({ user_id: userId, ...entry })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getJournalEntries() {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view your journal");
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*, prompts(prompt_text), journal_entry_tags(tags(id, name))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Update a journal entry's body — app enforces the S21 edit window (created
 * before 23:59:59 of the calendar day after creation); this only writes.
 */
export async function updateJournalEntry(id: string, body: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to edit an entry");
  const { error } = await supabase
    .from("journal_entries")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

/** Replace an entry's tag set (S20) — delete + insert the junction rows. */
export async function setJournalEntryTags(entryId: string, tagIds: string[]) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to tag an entry");
  const { error: delErr } = await supabase
    .from("journal_entry_tags")
    .delete()
    .eq("entry_id", entryId);
  if (delErr) throw delErr;
  if (tagIds.length === 0) return;
  const { error: insErr } = await supabase.from("journal_entry_tags").insert(
    tagIds.map((tag_id) => ({ entry_id: entryId, tag_id })),
  );
  if (insErr) throw insErr;
}

export async function getPrompts() {
  const { data, error } = await supabase.from("prompts").select("*").order("prompt_text");
  if (error) throw error;
  return data;
}

// ============================================================
// CHECKINS
// ============================================================
export async function saveCheckin(entry: CheckinInput) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save a check-in");
  const { error } = await supabase.from("checkins").insert(entry);
  if (error) throw error;
}

export async function getCheckins() {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view check-ins");
  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ============================================================
// EXERCISE SESSIONS
// ============================================================
export async function saveSession(entry: SessionInput) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save a session");
  const { error } = await supabase.from("exercise_sessions").insert(entry);
  if (error) throw error;
}

export async function getSessions() {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view sessions");
  const { data, error } = await supabase
    .from("exercise_sessions")
    .select("*, exercises(title, category)")
    .order("started_at", { ascending: false });
  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from("users")
    .select("display_name, email")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getCurrentProfile() {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view your profile");
  const { data, error } = await supabase
    .from("profiles")
    .select("id, age_band, gender, ethnicity, treatment_status, referral_source")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Research profile for the signed-in user (S03). Returns the row, or `null`
 * when signed out / no profile yet. **Non-prompting** — used by the dashboard
 * to decide whether to show the first-sign-in research-questions prompt (A5,
 * 28 Aug §6) without triggering Google sign-in.
 */
export async function getResearchProfile() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, age_band, gender, ethnicity, treatment_status, referral_source")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function saveProfile(entry: ProfileInput) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save your profile");
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, ...entry }, { onConflict: "user_id" });
  if (error) throw error;
}

// ============================================================
// TAGS (system tags shared; user tags are private)
// ============================================================
export async function getSystemTags() {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .is("user_id", null)
    .order("name");
  if (error) throw error;
  return data;
}

export async function createUserTag(entry: TagInput) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to create a tag");
  const { data, error } = await supabase
    .from("tags")
    .insert({ user_id: userId, name: entry.name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// S05 / S22 — data deletion & anonymisation
// ============================================================
/**
 * "Delete my data" (S05/D13): rotate this user's UUID across all records
 * to a fresh anonymous id. Mapping is not stored; re-identification is
 * impossible. The anonymised rows remain for research (S27).
 */
export async function anonymiseMyData(): Promise<string | null> {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to delete your data");
  const { data, error } = await supabase.rpc("anonymise_user", { p_user_id: userId });
  if (error) throw error;
  return data as string | null;
}

/**
 * Delete a single journal entry at any time (S22) — does not affect any
 * other record. Runs against the user's own rows via RLS.
 */
export async function deleteJournalEntry(id: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to delete an entry");
  const { error } = await supabase.from("journal_entries").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

// ============================================================
// EXERCISES (public content — no user_id needed)
// ============================================================
export async function getExercisesByCategory(category: string) {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", category)
    .order("title");
  if (error) throw error;
  return data;
}

export async function getAllExercises() {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("category", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw error;
  return data;
}

// ============================================================
// CHAPTERS (public — navigation anchors)
// ============================================================
export async function getChapters() {
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .order("order_index");
  if (error) throw error;
  return data;
}

// ============================================================
// DASHBOARD STATS (M3-03) — descriptive counts only (S26/D03:
// no mood or wellbeing trend is ever derived or charted; the
// weekly bars carry the nervous-system *state* from check-ins,
// which is not a wellbeing metric).
// ============================================================
export interface DashboardWeekDay {
  /** "Mon".."Sun" for the six days before today; "Today" for today. */
  day: string;
  /** Window-of-tolerance bucket of the last check-in that day, if any. */
  state: NsStateKey | null;
  isToday: boolean;
  /** Bar height in dp — presence is the message, height carries no metric. */
  height: number;
}

export interface DashboardStats {
  sessions: number;
  /** Consecutive days (ending today, or yesterday if today has none) with a session. */
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

  const [{ data: sessions, error: sErr }, { data: checkins, error: cErr }] = await Promise.all([
    supabase.from("exercise_sessions").select("started_at").order("started_at", { ascending: true }),
    supabase.from("checkins").select("created_at, ns_state").order("created_at", { ascending: true }),
  ]);
  if (sErr) throw sErr;
  if (cErr) throw cErr;

  const today = new Date();
  const todayKey = localDayKey(today);

  // --- streak: consecutive days with an exercise session (08 doc B1 default)
  const sessionDays = new Set(
    (sessions ?? []).map((r) => localDayKey(new Date(r.started_at as string))),
  );
  let streak = 0;
  let cursor = sessionDays.has(todayKey) ? today : addDays(today, -1);
  while (sessionDays.has(localDayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  // --- week: last 7 local days, state = last check-in's ns_state that day
  const stateByDay = new Map<string, NsStateKey | null>();
  const hadCheckinToday = new Set<string>();
  for (const row of checkins ?? []) {
    const key = localDayKey(new Date(row.created_at as string));
    hadCheckinToday.add(key);
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
      isToday,
      height: state || (isToday && hadCheckinToday.has(key)) ? 32 : 12,
    });
  }

  return {
    sessions: (sessions ?? []).length,
    streak,
    week,
    daysInWindow,
    daysWithState,
    inWindowPct: daysWithState > 0 ? Math.round((daysInWindow / daysWithState) * 100) : 0,
    checkedInToday: hadCheckinToday.has(todayKey),
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

export async function getFavourites(): Promise<FavouriteRow[]> {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view your portfolio");
  const { data, error } = await supabase
    .from("favourites")
    .select("id, exercise_id, created_at, exercises(id, title, category, duration_minutes)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  // PostgREST types the to-one join as an array; the query returns one row.
  return (data ?? []) as unknown as FavouriteRow[];
}

/** Exercise ids the user has favourited — one read for the star state. */
export async function getFavouriteExerciseIds(): Promise<Set<string>> {
  const userId = await getCurrentUserId();
  if (!userId) return new Set();
  const { data, error } = await supabase.from("favourites").select("exercise_id");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.exercise_id as string));
}

export async function addFavourite(exerciseId: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save to your portfolio");
  const { error } = await supabase
    .from("favourites")
    .upsert({ user_id: userId, exercise_id: exerciseId }, { onConflict: "user_id,exercise_id" });
  if (error) throw error;
}

export async function removeFavourite(exerciseId: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to update your portfolio");
  const { error } = await supabase
    .from("favourites")
    .delete()
    .eq("exercise_id", exerciseId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getSafeSpaceNotes(): Promise<NoteRow[]> {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view your notes");
  const { data, error } = await supabase
    .from("safe_space_notes")
    .select("id, body, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as NoteRow[];
}

export async function saveSafeSpaceNote(body: string, id?: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save a note");
  const { error } = id
    ? await supabase
        .from("safe_space_notes")
        .update({ body, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
    : await supabase.from("safe_space_notes").insert({ user_id: userId, body });
  if (error) throw error;
}

export async function deleteSafeSpaceNote(id: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to delete a note");
  const { error } = await supabase.from("safe_space_notes").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function getCustomStrategies(): Promise<StrategyRow[]> {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view your strategies");
  const { data, error } = await supabase
    .from("custom_strategies")
    .select("id, title, body, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StrategyRow[];
}

export async function saveCustomStrategy(
  entry: { title: string; body?: string },
  id?: string,
) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to save a strategy");
  const { error } = id
    ? await supabase
        .from("custom_strategies")
        .update({ title: entry.title, body: entry.body ?? null, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
    : await supabase
        .from("custom_strategies")
        .insert({ user_id: userId, title: entry.title, body: entry.body ?? null });
  if (error) throw error;
}

export async function deleteCustomStrategy(id: string) {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to delete a strategy");
  const { error } = await supabase.from("custom_strategies").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
