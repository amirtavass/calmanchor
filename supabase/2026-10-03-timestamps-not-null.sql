-- ============================================================
-- Additive migration — timestamps NOT NULL (S29 hardening)
-- Run in the Supabase SQL editor, or via the direct Postgres connection.
--
-- Why: `schema.sql` declared `created_at timestamptz default now()` WITHOUT
-- `not null`, so Postgres allows NULL timestamps on every user-data table.
-- The app has always assumed they are present (S29: "created_at + updated_at
-- on all user-data tables", and the S21 edit window is computed from
-- `created_at`). Generated types (`npm run gen:types`) surfaced this as
-- `string | null`.
--
-- This script backfills any NULLs to `now()` and then makes the columns
-- non-nullable. Additive and safe: no rows are dropped, no type changes.
-- Idempotent — `set not null` on an already-not-null column is a no-op.
-- ============================================================

do $$
declare
  t text;
  cols text[] := array[
    'checkins','journal_entries','exercise_sessions','checklist_progress',
    'crisis_plan','settings','profiles','tags','favourites',
    'safe_space_notes','custom_strategies','users','documents',
    'exercise_session_tags','journal_entry_tags'
  ];
begin
  foreach t in array cols loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'created_at'
    ) then
      execute format('update public.%I set created_at = now() where created_at is null', t);
      execute format('alter table public.%I alter column created_at set default now()', t);
      execute format('alter table public.%I alter column created_at set not null', t);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'updated_at'
    ) then
      execute format('update public.%I set updated_at = created_at where updated_at is null', t);
      execute format('update public.%I set updated_at = now() where updated_at is null', t);
      execute format('alter table public.%I alter column updated_at set default now()', t);
      execute format('alter table public.%I alter column updated_at set not null', t);
    end if;

    -- exercise_sessions.started_at: a session always starts. (ended_at stays
    -- nullable — an abandoned session legitimately has no end.)
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'started_at'
    ) then
      execute format('update public.%I set started_at = created_at where started_at is null', t);
      execute format('update public.%I set started_at = now() where started_at is null', t);
      execute format('alter table public.%I alter column started_at set default now()', t);
      execute format('alter table public.%I alter column started_at set not null', t);
    end if;
  end loop;
end
$$;
