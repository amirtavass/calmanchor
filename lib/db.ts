import { supabase } from "./supabase";
import { ensureSignedIn } from "./auth";

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
  const { error } = await supabase.from("journal_entries").insert(entry);
  if (error) throw error;
}

export async function getJournalEntries() {
  const userId = await ensureSignedIn();
  if (!userId) throw new Error("Sign-in required to view your journal");
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*, prompts(prompt_text)")
    .order("created_at", { ascending: false });
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
