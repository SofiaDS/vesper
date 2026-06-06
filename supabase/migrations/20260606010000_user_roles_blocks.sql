-- ============================================================
-- Vesper — Migration: user_roles, user_blocks, grant/revoke_role
-- Dipende da: 20260604120000_fase1_schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- user_roles
-- Ruoli staff: 'admin' (fondatori) e 'moderator' (volontari).
-- Vedi moderazione.md §1-2.
-- ------------------------------------------------------------
create table if not exists public.user_roles (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null check (role in ('admin', 'moderator')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

comment on table public.user_roles is
  'Ruoli staff (admin/moderator). Gestito solo tramite RPC grant_role/revoke_role.';

alter table public.user_roles enable row level security;

-- Solo admin può leggere la lista dei ruoli (usata da ModeratorManagement)
create policy "roles_select_admin"
  on public.user_roles for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles r2
      where r2.user_id = auth.uid() and r2.role = 'admin'
    )
  );

-- INSERT e DELETE solo via RPC grant_role/revoke_role (security definer)

-- ------------------------------------------------------------
-- user_blocks
-- Block one-directional: blocker non vede più i messaggi di blocked.
-- La persona bloccata non sa di esserlo (blocks.ts, block.md).
-- ------------------------------------------------------------
create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_no_self check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);

comment on table public.user_blocks is
  'Block one-directional. Il bloccato non lo sa. Vedi block.md.';

alter table public.user_blocks enable row level security;

-- Ogni utente vede e gestisce solo i propri blocchi
create policy "blocks_select_self"
  on public.user_blocks for select
  to authenticated
  using (blocker_id = auth.uid());

create policy "blocks_insert_self"
  on public.user_blocks for insert
  to authenticated
  with check (blocker_id = auth.uid());

create policy "blocks_delete_self"
  on public.user_blocks for delete
  to authenticated
  using (blocker_id = auth.uid());

-- ------------------------------------------------------------
-- RPC: grant_role / revoke_role
-- Usate da ModeratorManagement (admin.ts). Solo admin può chiamarle.
-- ------------------------------------------------------------
create or replace function public.grant_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Permesso negato: solo admin può assegnare ruoli.';
  end if;
  if p_role not in ('admin', 'moderator') then
    raise exception 'Ruolo non valido: %', p_role;
  end if;
  insert into public.user_roles (user_id, role)
  values (p_user, p_role)
  on conflict do nothing;
end;
$$;

create or replace function public.revoke_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Permesso negato: solo admin può revocare ruoli.';
  end if;
  -- Non si può revocare il proprio ruolo admin
  if p_user = auth.uid() and p_role = 'admin' then
    raise exception 'Non puoi revocare il tuo ruolo admin.';
  end if;
  delete from public.user_roles
  where user_id = p_user and role = p_role;
end;
$$;

revoke execute on function public.grant_role(uuid, text) from public, anon;
revoke execute on function public.revoke_role(uuid, text) from public, anon;
grant  execute on function public.grant_role(uuid, text) to authenticated;
grant  execute on function public.revoke_role(uuid, text) to authenticated;
