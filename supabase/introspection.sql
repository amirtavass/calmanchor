-- ============================================================
-- get_schema_introspection() — Engine B introspection over RPC
-- Replaces the need for a direct Postgres connection string
-- (SUPABASE_DB_URL). Engine B calls this via the service-role key,
-- which the project already uses for its other checks.
-- Run this in the Supabase SQL editor, then `npm run verify:rls`.
-- ============================================================

create or replace function public.get_schema_introspection()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'rls', (
      select coalesce(json_agg(json_build_object('tablename', tablename, 'rowsecurity', rowsecurity)), '[]'::json)
      from pg_tables
      where schemaname = 'public'
        and tablename = any (array['checkins','journal_entries','exercise_sessions','checklist_progress','crisis_plan','settings','profiles','tags','users'])
    ),
    'views', (
      select coalesce(json_agg(table_name), '[]'::json)
      from information_schema.views
      where table_schema = 'public'
    ),
    'ts_columns', (
      select coalesce(json_agg(json_build_object('table_name', table_name, 'column_name', column_name)), '[]'::json)
      from information_schema.columns
      where table_schema = 'public'
        and column_name in ('created_at', 'updated_at')
    ),
    'users_columns', (
      select coalesce(json_agg(column_name), '[]'::json)
      from information_schema.columns
      where table_schema = 'public' and table_name = 'users'
    ),
    'profiles_columns', (
      select coalesce(json_agg(column_name), '[]'::json)
      from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles'
    )
  ) into result;

  return result;
end;
$$;

-- Only service_role (our verifier) and authenticated (the app) may call it.
-- anon / public are denied. Read-only introspection; no data exposure.
revoke all on function public.get_schema_introspection() from public, anon;
grant execute on function public.get_schema_introspection() to service_role, authenticated;