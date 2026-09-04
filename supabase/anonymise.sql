-- ============================================================
-- S05 / D13 — Anonymisation via UUID rotation
--
-- "Delete my data" does NOT hard-delete. It rotates the user's
-- internal UUID across all their user-data records to a new
-- random UUID, and the old->new mapping is NOT stored, making
-- re-identification impossible. The anonymised rows remain for
-- research (S27). Each deletion cycle creates a fresh anonymous id.
--
-- Run in the Supabase SQL Editor. Call with the OLD user id.
-- Usage (from the app/admin): SELECT public.anonymise_user('<uid>');
-- ============================================================

create or replace function public.anonymise_user(p_user_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  new_id uuid := gen_random_uuid();
begin
  -- Re-point every user-data table to the fresh uuid.
  update public.checkins             set user_id = new_id where user_id = p_user_id;
  update public.journal_entries      set user_id = new_id where user_id = p_user_id;
  update public.exercise_sessions    set user_id = new_id where user_id = p_user_id;
  update public.checklist_progress   set user_id = new_id where user_id = p_user_id;
  update public.crisis_plan          set user_id = new_id where user_id = p_user_id;
  update public.settings             set user_id = new_id where user_id = p_user_id;
  update public.profiles             set user_id = new_id where user_id = p_user_id;
  update public.tags                 set user_id = new_id where user_id = p_user_id;

  -- Identity record (users mirrors auth.users): clear PII, keep the row
  -- so the auth account can continue. google_identity is PII -> null it.
  update public.users
     set google_identity = null,
         email = null,
         display_name = null
   where id = p_user_id;

  -- The auth identity itself: keep the account usable, but detach the
  -- google link so the next sign-in re-links (or a new account is used).
  -- (Auth-level cleanup of auth.identities is handled out of band.)

  return new_id;
end;
$$;