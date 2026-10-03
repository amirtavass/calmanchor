-- ============================================================
-- 1. CONTENT TABLES (public read, no user data)
-- ============================================================

drop table if exists documents cascade;
drop table if exists prompts cascade;
drop table if exists checklist_items cascade;
drop table if exists exercises cascade;
drop table if exists chapters cascade;

-- chapters — 20 page anchors
create table chapters (
  id uuid primary key default gen_random_uuid(),
  order_index int not null,
  title text not null,
  page_range text not null,
  content_group text not null,
  colour_token text not null
);

-- exercises — category uses the 6 contract names (S08)
create table exercises (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references chapters(id) on delete cascade,
  exercise_type text not null,
  category text not null,
  title text not null,
  steps jsonb not null,
  duration_minutes int,
  constraint chk_exercises_category check (
    category in ('breathing','somatic','sensory','voice','mindful','crisis')
  )
);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references chapters(id) on delete cascade,
  text text not null,
  order_index int not null
);

-- prompts (renamed from journal_prompts)
create table prompts (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references chapters(id) on delete cascade,
  prompt_text text not null
);

-- ============================================================
-- 2. USERS (identity mirror of auth.users; NO password columns)
-- ============================================================
drop table if exists users cascade;

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  google_identity text unique,      -- OAuth sub (S02); no password/password_hash
  created_at timestamptz default now()
);

-- ============================================================
-- 3. USER-DATA TABLES (all reference users(id), ALL ON DELETE CASCADE — S05)
-- ============================================================

drop table if exists settings cascade;
drop table if exists custom_strategies cascade;
drop table if exists safe_space_notes cascade;
drop table if exists favourites cascade;
drop table if exists exercise_session_tags cascade;
drop table if exists journal_entry_tags cascade;
drop table if exists exercise_sessions cascade;
drop table if exists crisis_plan cascade;
drop table if exists checklist_progress cascade;
drop table if exists journal_entries cascade;
drop table if exists mood_logs cascade;
drop table if exists checkins cascade;
drop table if exists tags cascade;
drop table if exists profiles cascade;

-- checkins
create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade default auth.uid() not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  ns_state text,
  survival_response text,
  triggers text[],
  note text
);

-- journal_entries
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade default auth.uid() not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  prompt_id uuid references prompts(id) on delete set null,
  body text not null
);

-- exercise_sessions (renamed; distress/helpfulness)
create table exercise_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade default auth.uid() not null,
  exercise_id uuid references exercises(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_minutes int,
  distress_before smallint,
  distress_after smallint,
  helpfulness smallint,
  note text,
  constraint chk_distress_before check (distress_before between 0 and 10),
  constraint chk_distress_after  check (distress_after  between 0 and 10),
  constraint chk_helpfulness     check (helpfulness     between 0 and 10)
);

-- checklist_progress
create table checklist_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade default auth.uid() not null,
  checklist_item_id uuid references checklist_items(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed boolean default false,
  completed_at timestamptz,
  unique(user_id, checklist_item_id)
);

-- crisis_plan
create table crisis_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade default auth.uid() not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  plan_data jsonb not null default '{}'::jsonb
);

-- settings
create table settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade default auth.uid() not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  settings_data jsonb not null default '{}'::jsonb
);

-- profiles (research fields only)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null unique,
  age_band text,
  gender text,
  ethnicity text,
  treatment_status text,
  referral_source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- favourites (M3-04 Portfolio — favourited exercises)
create table favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade default auth.uid() not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, exercise_id)
);

-- safe_space_notes (M3-04 Portfolio — "Making Safety Real" notes)
create table safe_space_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade default auth.uid() not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  body text not null
);

-- custom_strategies (M3-04 Portfolio — user's own strategies)
create table custom_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade default auth.uid() not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  title text not null,
  body text
);

-- tags (user_id null = system tag)
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- exercise_session_tags
create table exercise_session_tags (
  session_id uuid not null references exercise_sessions(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (session_id, tag_id)
);

-- journal_entry_tags
create table journal_entry_tags (
  entry_id uuid not null references journal_entries(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (entry_id, tag_id)
);

-- documents (metadata anchor for the Storage PDF — no PDF bytes)
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  storage_path text not null,
  bucket text not null,
  created_at timestamptz default now()
);

-- indexes
create index idx_checkins_user_id          on checkins(user_id);
create index idx_journal_entries_user_id   on journal_entries(user_id);
create index idx_exercise_sessions_user_id on exercise_sessions(user_id);
create index idx_exercise_sessions_exercise_id on exercise_sessions(exercise_id);
create index idx_checklist_progress_user_id on checklist_progress(user_id);
create index idx_crisis_plan_user_id       on crisis_plan(user_id);
create index idx_settings_user_id          on settings(user_id);
create index idx_tags_user_id              on tags(user_id);
create index idx_profiles_user_id          on profiles(user_id);
create index idx_favourites_user_id        on favourites(user_id);
create index idx_safe_space_notes_user_id  on safe_space_notes(user_id);
create index idx_custom_strategies_user_id on custom_strategies(user_id);

-- S16 hygiene: system tag names must be unique (user tags can repeat names)
create unique index tags_system_name_key on tags(name) where user_id is null;

-- ============================================================
-- 4. AUTO-CREATE a users row on auth signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- backfill existing auth users
insert into public.users (id, email)
select id, email from auth.users
on conflict (id) do nothing;
