-- ============================================================
-- Vesper — Migration Fase 1: schema iniziale MVP
-- Tabelle: profiles, chatrooms, chat_membership, messages
-- Allineato a: profilo_utente.md, chatroom.md, permessi_e_strati.md,
--              utenti_e_identita.md, stack_tecnico.md (punto 10)
-- ============================================================

-- ------------------------------------------------------------
-- Funzioni di utilita'
-- ------------------------------------------------------------

-- Aggiorna updated_at ad ogni UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 1. PROFILES
-- Un profilo per ogni utente di auth.users. L'app crea/completa
-- il profilo al termine dell'onboarding. Avatar-only in v1.
-- ------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  nickname          text not null unique
                      check (char_length(nickname) between 3 and 24),
  identity_category text not null
                      check (identity_category in
                        ('donna_cis','donna_trans','uomo_trans','nonbinary_afab')),
  orientations      text[] not null default '{}'::text[]
                      check (orientations <@
                        array['lesbica','bisessuale','queer','pan','questioning']::text[]),
  birth_date        date,
  avatar_preset     text,
  accent_color      text,
  bio               text check (bio is null or char_length(bio) <= 300),
  city              text,
  strato            smallint not null default 1
                      check (strato between 1 and 3),
  is_searchable     boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.profiles is 'Profilo utente (avatar-only in v1). Vedi profilo_utente.md.';
comment on column public.profiles.is_searchable is 'Opt-in alla ricerca utenti. Default false = privacy by default (ricerca_utenti.md).';
comment on column public.profiles.strato is 'Strato di permessi 1..3 (permessi_e_strati.md). Gestito dal backend, non dal client.';
comment on column public.profiles.birth_date is 'Vincolo 18+ applicato lato app/onboarding (minori_e_eta.md), non via CHECK.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2. CHATROOMS
-- 1 Foyer (obbligatoria, non abbandonabile) + chat tematiche.
-- ------------------------------------------------------------
create table public.chatrooms (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  kind        text not null check (kind in ('foyer','tematica')),
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create unique index chatrooms_single_foyer
  on public.chatrooms (kind) where (kind = 'foyer');

comment on table public.chatrooms is 'Stanze di chat: 1 Foyer + tematiche. Vedi chatroom.md.';

-- ------------------------------------------------------------
-- 3. CHAT_MEMBERSHIP
-- Tetto: 1 Foyer (auto) + max 3 tematiche. Vedi stack_tecnico.md p.10.
-- ------------------------------------------------------------
create table public.chat_membership (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  chatroom_id uuid not null references public.chatrooms (id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (user_id, chatroom_id)
);

create index chat_membership_chatroom_idx on public.chat_membership (chatroom_id);

comment on table public.chat_membership is 'Appartenenza utente<->chatroom. Tetto 1 Foyer + max 3 tematiche.';

create or replace function public.enforce_membership_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  room_kind text;
  tematica_count int;
begin
  select kind into room_kind from public.chatrooms where id = new.chatroom_id;
  if room_kind = 'tematica' then
    select count(*) into tematica_count
    from public.chat_membership m
    join public.chatrooms c on c.id = m.chatroom_id
    where m.user_id = new.user_id and c.kind = 'tematica';
    if tematica_count >= 3 then
      raise exception 'Limite di 3 chat tematiche raggiunto';
    end if;
  end if;
  return new;
end;
$$;

create trigger chat_membership_cap
  before insert on public.chat_membership
  for each row execute function public.enforce_membership_cap();

create or replace function public.prevent_foyer_leave()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  room_kind text;
begin
  select kind into room_kind from public.chatrooms where id = old.chatroom_id;
  if room_kind = 'foyer' then
    raise exception 'La Foyer non puo essere abbandonata';
  end if;
  return old;
end;
$$;

create trigger chat_membership_no_leave_foyer
  before delete on public.chat_membership
  for each row execute function public.prevent_foyer_leave();

create or replace function public.join_foyer_on_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  foyer_id uuid;
begin
  select id into foyer_id from public.chatrooms where kind = 'foyer' limit 1;
  if foyer_id is not null then
    insert into public.chat_membership (user_id, chatroom_id)
    values (new.id, foyer_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger profiles_join_foyer
  after insert on public.profiles
  for each row execute function public.join_foyer_on_profile();

-- ------------------------------------------------------------
-- 4. MESSAGES
-- ------------------------------------------------------------
create table public.messages (
  id          bigint generated always as identity primary key,
  chatroom_id uuid not null references public.chatrooms (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index messages_chatroom_created_idx
  on public.messages (chatroom_id, created_at);

comment on table public.messages is 'Messaggi di chat. Filtraggio per block list rinviato (block.md sez.6).';

alter publication supabase_realtime add table public.messages;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.chatrooms       enable row level security;
alter table public.chat_membership enable row level security;
alter table public.messages        enable row level security;

create or replace function public.is_member(p_chatroom uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.chat_membership
    where user_id = auth.uid() and chatroom_id = p_chatroom
  );
$$;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated using (true);

create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated with check (id = (select auth.uid()));

create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "chatrooms_select_active"
  on public.chatrooms for select
  to authenticated using (is_active);

create policy "membership_select_self"
  on public.chat_membership for select
  to authenticated using (user_id = (select auth.uid()));

create policy "membership_insert_self"
  on public.chat_membership for insert
  to authenticated with check (user_id = (select auth.uid()));

create policy "membership_delete_self"
  on public.chat_membership for delete
  to authenticated using (user_id = (select auth.uid()));

create policy "messages_select_member"
  on public.messages for select
  to authenticated using (public.is_member(chatroom_id));

create policy "messages_insert_member_self"
  on public.messages for insert
  to authenticated with check (
    sender_id = (select auth.uid()) and public.is_member(chatroom_id)
  );
