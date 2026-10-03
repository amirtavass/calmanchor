-- ============================================================
-- ROW LEVEL SECURITY — run AFTER schema.sql
-- Idempotent: drops each policy first, then recreates per operation.
-- Fixes S04 (data isolation) — guarantees an INSERT policy exists on
-- every user-data table, with `with check (auth.uid() = user_id)`.
-- ============================================================

-- ---- CONTENT: public read, no public write ----
alter table chapters enable row level security;
drop policy if exists "public read" on chapters;
create policy "public read" on chapters for select using (true);

alter table exercises enable row level security;
drop policy if exists "public read" on exercises;
create policy "public read" on exercises for select using (true);

alter table checklist_items enable row level security;
drop policy if exists "public read" on checklist_items;
create policy "public read" on checklist_items for select using (true);

alter table prompts enable row level security;
drop policy if exists "public read" on prompts;
create policy "public read" on prompts for select using (true);

alter table documents enable row level security;
drop policy if exists "public read" on documents;
create policy "public read" on documents for select using (true);

-- ---- USERS: own rows only (identity is PII) ----
alter table users enable row level security;
drop policy if exists "users own" on users;
create policy "users own" on users
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ---- USER-DATA: own rows only, explicit per-operation ----
-- checkins
alter table checkins enable row level security;
drop policy if exists "checkins select" on checkins;
create policy "checkins select" on checkins for select using (auth.uid() = user_id);
drop policy if exists "checkins insert" on checkins;
create policy "checkins insert" on checkins for insert with check (auth.uid() = user_id);
drop policy if exists "checkins update" on checkins;
create policy "checkins update" on checkins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "checkins delete" on checkins;
create policy "checkins delete" on checkins for delete using (auth.uid() = user_id);

-- journal_entries
alter table journal_entries enable row level security;
drop policy if exists "journal_entries select" on journal_entries;
create policy "journal_entries select" on journal_entries for select using (auth.uid() = user_id);
drop policy if exists "journal_entries insert" on journal_entries;
create policy "journal_entries insert" on journal_entries for insert with check (auth.uid() = user_id);
drop policy if exists "journal_entries update" on journal_entries;
create policy "journal_entries update" on journal_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "journal_entries delete" on journal_entries;
create policy "journal_entries delete" on journal_entries for delete using (auth.uid() = user_id);

-- exercise_sessions
alter table exercise_sessions enable row level security;
drop policy if exists "exercise_sessions select" on exercise_sessions;
create policy "exercise_sessions select" on exercise_sessions for select using (auth.uid() = user_id);
drop policy if exists "exercise_sessions insert" on exercise_sessions;
create policy "exercise_sessions insert" on exercise_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "exercise_sessions update" on exercise_sessions;
create policy "exercise_sessions update" on exercise_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "exercise_sessions delete" on exercise_sessions;
create policy "exercise_sessions delete" on exercise_sessions for delete using (auth.uid() = user_id);

-- checklist_progress
alter table checklist_progress enable row level security;
drop policy if exists "checklist_progress select" on checklist_progress;
create policy "checklist_progress select" on checklist_progress for select using (auth.uid() = user_id);
drop policy if exists "checklist_progress insert" on checklist_progress;
create policy "checklist_progress insert" on checklist_progress for insert with check (auth.uid() = user_id);
drop policy if exists "checklist_progress update" on checklist_progress;
create policy "checklist_progress update" on checklist_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "checklist_progress delete" on checklist_progress;
create policy "checklist_progress delete" on checklist_progress for delete using (auth.uid() = user_id);

-- crisis_plan
alter table crisis_plan enable row level security;
drop policy if exists "crisis_plan select" on crisis_plan;
create policy "crisis_plan select" on crisis_plan for select using (auth.uid() = user_id);
drop policy if exists "crisis_plan insert" on crisis_plan;
create policy "crisis_plan insert" on crisis_plan for insert with check (auth.uid() = user_id);
drop policy if exists "crisis_plan update" on crisis_plan;
create policy "crisis_plan update" on crisis_plan for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "crisis_plan delete" on crisis_plan;
create policy "crisis_plan delete" on crisis_plan for delete using (auth.uid() = user_id);

-- settings
alter table settings enable row level security;
drop policy if exists "settings select" on settings;
create policy "settings select" on settings for select using (auth.uid() = user_id);
drop policy if exists "settings insert" on settings;
create policy "settings insert" on settings for insert with check (auth.uid() = user_id);
drop policy if exists "settings update" on settings;
create policy "settings update" on settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "settings delete" on settings;
create policy "settings delete" on settings for delete using (auth.uid() = user_id);

-- profiles
alter table profiles enable row level security;
drop policy if exists "profiles select" on profiles;
create policy "profiles select" on profiles for select using (auth.uid() = user_id);
drop policy if exists "profiles insert" on profiles;
create policy "profiles insert" on profiles for insert with check (auth.uid() = user_id);
drop policy if exists "profiles update" on profiles;
create policy "profiles update" on profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "profiles delete" on profiles;
create policy "profiles delete" on profiles for delete using (auth.uid() = user_id);

-- favourites (M3-04 Portfolio)
alter table favourites enable row level security;
drop policy if exists "favourites select" on favourites;
create policy "favourites select" on favourites for select using (auth.uid() = user_id);
drop policy if exists "favourites insert" on favourites;
create policy "favourites insert" on favourites for insert with check (auth.uid() = user_id);
drop policy if exists "favourites update" on favourites;
create policy "favourites update" on favourites for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "favourites delete" on favourites;
create policy "favourites delete" on favourites for delete using (auth.uid() = user_id);

-- safe_space_notes (M3-04 Portfolio)
alter table safe_space_notes enable row level security;
drop policy if exists "safe_space_notes select" on safe_space_notes;
create policy "safe_space_notes select" on safe_space_notes for select using (auth.uid() = user_id);
drop policy if exists "safe_space_notes insert" on safe_space_notes;
create policy "safe_space_notes insert" on safe_space_notes for insert with check (auth.uid() = user_id);
drop policy if exists "safe_space_notes update" on safe_space_notes;
create policy "safe_space_notes update" on safe_space_notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "safe_space_notes delete" on safe_space_notes;
create policy "safe_space_notes delete" on safe_space_notes for delete using (auth.uid() = user_id);

-- custom_strategies (M3-04 Portfolio)
alter table custom_strategies enable row level security;
drop policy if exists "custom_strategies select" on custom_strategies;
create policy "custom_strategies select" on custom_strategies for select using (auth.uid() = user_id);
drop policy if exists "custom_strategies insert" on custom_strategies;
create policy "custom_strategies insert" on custom_strategies for insert with check (auth.uid() = user_id);
drop policy if exists "custom_strategies update" on custom_strategies;
create policy "custom_strategies update" on custom_strategies for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "custom_strategies delete" on custom_strategies;
create policy "custom_strategies delete" on custom_strategies for delete using (auth.uid() = user_id);

-- ---- TAGS: system tags readable by all; user tags owner-only ----
alter table tags enable row level security;
drop policy if exists "tags select" on tags;
create policy "tags select" on tags for select using (user_id is null or auth.uid() = user_id);
drop policy if exists "tags insert" on tags;
create policy "tags insert" on tags for insert with check (auth.uid() = user_id);
drop policy if exists "tags update" on tags;
create policy "tags update" on tags for update using (user_id is null or auth.uid() = user_id) with check (user_id is null or auth.uid() = user_id);
drop policy if exists "tags delete" on tags;
create policy "tags delete" on tags for delete using (user_id is null or auth.uid() = user_id);

-- ---- JUNCTION TABLES: owner via parent row ----
alter table exercise_session_tags enable row level security;
drop policy if exists "session_tags select" on exercise_session_tags;
create policy "session_tags select" on exercise_session_tags for select using (auth.uid() = (select s.user_id from exercise_sessions s where s.id = session_id));
drop policy if exists "session_tags insert" on exercise_session_tags;
create policy "session_tags insert" on exercise_session_tags for insert with check (auth.uid() = (select s.user_id from exercise_sessions s where s.id = session_id));
drop policy if exists "session_tags update" on exercise_session_tags;
create policy "session_tags update" on exercise_session_tags for update using (auth.uid() = (select s.user_id from exercise_sessions s where s.id = session_id)) with check (auth.uid() = (select s.user_id from exercise_sessions s where s.id = session_id));
drop policy if exists "session_tags delete" on exercise_session_tags;
create policy "session_tags delete" on exercise_session_tags for delete using (auth.uid() = (select s.user_id from exercise_sessions s where s.id = session_id));

alter table journal_entry_tags enable row level security;
drop policy if exists "entry_tags select" on journal_entry_tags;
create policy "entry_tags select" on journal_entry_tags for select using (auth.uid() = (select j.user_id from journal_entries j where j.id = entry_id));
drop policy if exists "entry_tags insert" on journal_entry_tags;
create policy "entry_tags insert" on journal_entry_tags for insert with check (auth.uid() = (select j.user_id from journal_entries j where j.id = entry_id));
drop policy if exists "entry_tags update" on journal_entry_tags;
create policy "entry_tags update" on journal_entry_tags for update using (auth.uid() = (select j.user_id from journal_entries j where j.id = entry_id)) with check (auth.uid() = (select j.user_id from journal_entries j where j.id = entry_id));
drop policy if exists "entry_tags delete" on journal_entry_tags;
create policy "entry_tags delete" on journal_entry_tags for delete using (auth.uid() = (select j.user_id from journal_entries j where j.id = entry_id));
