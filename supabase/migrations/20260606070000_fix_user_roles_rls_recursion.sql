-- ============================================================
-- Vesper — Fix: infinite recursion in user_roles SELECT policy
-- La policy originale leggeva user_roles dentro la policy di
-- user_roles per controllare se l'utente era admin → loop infinito.
-- Fix: is_admin() security definer bypassa l'RLS sulla tabella.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

drop policy if exists "roles_select_admin" on public.user_roles;
create policy "roles_select_authenticated"
  on public.user_roles for select
  to authenticated
  using (
    user_id = auth.uid() or public.is_admin()
  );
