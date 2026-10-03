-- ============================================================
-- Additive migration — Portfolio tables (M3-04)
-- Run this in the Supabase SQL editor against the LIVE database.
--
-- Why this file: `supabase/schema.sql` is a full rebuild (it drops and
-- recreates every table) and would wipe user data. This script only
-- ADDS the three Portfolio tables and their policies, and is idempotent
-- (`if not exists` / `drop policy if exists`) so it can be re-run safely.
--
-- Canonical definitions also live in `schema.sql` (tables) and `rls.sql`
-- (policies) for fresh environments.
-- ============================================================

-- ---- tables ------------------------------------------------
create table if not exists favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade default auth.uid() not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, exercise_id)
);

create table if not exists safe_space_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade default auth.uid() not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  body text not null
);

create table if not exists custom_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade default auth.uid() not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  title text not null,
  body text
);

-- ---- indexes -----------------------------------------------
create index if not exists idx_favourites_user_id        on favourites(user_id);
create index if not exists idx_safe_space_notes_user_id  on safe_space_notes(user_id);
create index if not exists idx_custom_strategies_user_id on custom_strategies(user_id);

-- ---- RLS: owner-only, explicit per-operation (matches rls.sql) ----
alter table favourites enable row level security;
drop policy if exists "favourites select" on favourites;
create policy "favourites select" on favourites for select using (auth.uid() = user_id);
drop policy if exists "favourites insert" on favourites;
create policy "favourites insert" on favourites for insert with check (auth.uid() = user_id);
drop policy if exists "favourites update" on favourites;
create policy "favourites update" on favourites for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "favourites delete" on favourites;
create policy "favourites delete" on favourites for delete using (auth.uid() = user_id);

alter table safe_space_notes enable row level security;
drop policy if exists "safe_space_notes select" on safe_space_notes;
create policy "safe_space_notes select" on safe_space_notes for select using (auth.uid() = user_id);
drop policy if exists "safe_space_notes insert" on safe_space_notes;
create policy "safe_space_notes insert" on safe_space_notes for insert with check (auth.uid() = user_id);
drop policy if exists "safe_space_notes update" on safe_space_notes;
create policy "safe_space_notes update" on safe_space_notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "safe_space_notes delete" on safe_space_notes;
create policy "safe_space_notes delete" on safe_space_notes for delete using (auth.uid() = user_id);

alter table custom_strategies enable row level security;
drop policy if exists "custom_strategies select" on custom_strategies;
create policy "custom_strategies select" on custom_strategies for select using (auth.uid() = user_id);
drop policy if exists "custom_strategies insert" on custom_strategies;
create policy "custom_strategies insert" on custom_strategies for insert with check (auth.uid() = user_id);
drop policy if exists "custom_strategies update" on custom_strategies;
create policy "custom_strategies update" on custom_strategies for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "custom_strategies delete" on custom_strategies;
create policy "custom_strategies delete" on custom_strategies for delete using (auth.uid() = user_id);
