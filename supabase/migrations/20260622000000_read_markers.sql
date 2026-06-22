-- ============================================================
-- Vesper — Migration: stato "ultima lettura" (badge non letti)
-- Dipende da: 20260604120000_fase1_schema.sql (messages, chat_membership,
--             is_member), 20260605010000_dm.sql (dm_messages, dm_conversations)
--
-- Abilita i badge "non letti"/"@menzione" per stanze (Step 4) e DM (Step 5):
--   - read_markers: per ogni utente e conversazione (stanza o DM) tiene il
--     timestamp dell'ultima lettura. Una sola riga per (user, scope, scope_id).
--   - mark_read(scope, scope_id): upsert "ho letto fino ad adesso".
--   - room_unread_counts() / dm_unread_counts(): conteggi non letti del
--     chiamante, calcolati confrontando i messaggi con il proprio read_marker.
--
-- Nessuna nuova colonna su tabelle esistenti; nessun dato sensibile esposto:
-- le RPC sono security definer ma filtrano sempre su auth.uid().
-- ============================================================

-- 1. Tabella read_markers
create table public.read_markers (
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  scope        text        not null check (scope in ('room', 'dm')),
  scope_id     uuid        not null,
  last_read_at timestamptz not null default now(),
  primary key (user_id, scope, scope_id)
);

comment on table public.read_markers is
  'Ultima lettura per utente e conversazione (scope=room→chatroom_id, scope=dm→conversation_id). Base dei badge non letti.';

alter table public.read_markers enable row level security;

-- RLS: ognuna gestisce solo le proprie righe.
create policy "read_markers_select_self"
  on public.read_markers for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "read_markers_insert_self"
  on public.read_markers for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "read_markers_update_self"
  on public.read_markers for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "read_markers_delete_self"
  on public.read_markers for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- 1b. Seed automatico entrando in una stanza: si parte "tutto letto", così i
--     non letti contano solo i messaggi successivi all'ingresso e non l'intera
--     storia della stanza (importante per la foyer ad alto traffico, a cui ci
--     si iscrive automaticamente al signup via profiles_join_foyer).
create or replace function public.seed_room_read_marker()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.read_markers (user_id, scope, scope_id, last_read_at)
  values (new.user_id, 'room', new.chatroom_id, now())
  on conflict (user_id, scope, scope_id) do nothing;
  return new;
end;
$$;

create trigger chat_membership_seed_read_marker
  after insert on public.chat_membership
  for each row execute function public.seed_room_read_marker();

-- Trigger function: nessuno la invoca via RPC.
revoke execute on function public.seed_room_read_marker() from public, anon, authenticated;

-- 2. RPC mark_read(scope, scope_id): segna "letto fino ad adesso".
--    Upsert atomico sulla PK; non si può scrivere per conto di altri perché
--    user_id è forzato ad auth.uid().
create or replace function public.mark_read(p_scope text, p_scope_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.read_markers (user_id, scope, scope_id, last_read_at)
  values ((select auth.uid()), p_scope, p_scope_id, now())
  on conflict (user_id, scope, scope_id)
  do update set last_read_at = excluded.last_read_at;
$$;

revoke execute on function public.mark_read(text, uuid) from public, anon;
grant  execute on function public.mark_read(text, uuid) to authenticated;

-- 3. RPC room_unread_counts(): per ogni stanza di cui il chiamante è membro,
--    quanti messaggi (non suoi) sono arrivati dopo l'ultima lettura e se
--    almeno uno lo menziona (@nickname). Le stanze senza non letti non
--    compaiono nel risultato (il client le tratta come 0).
--    La menzione usa la stessa logica del client (MentionText): "@nick" non
--    seguito da un altro carattere di parola. I nickname sono [a-zA-Z0-9_]
--    quindi sono sicuri da interpolare in una regex.
create or replace function public.room_unread_counts()
returns table (chatroom_id uuid, unread int, has_mention boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select m.chatroom_id,
         count(*)::int as unread,
         bool_or(m.body ~* ('@' || me.nickname || '($|[^a-zA-Z0-9_])')) as has_mention
  from   public.chat_membership cm
  join   public.messages m on m.chatroom_id = cm.chatroom_id
  -- left join (non cross): se manca il profilo/nickname, me.nickname è NULL e
  -- si disattiva solo il rilevamento menzioni, non l'intero conteggio.
  left join lateral (
           select nickname from public.profiles where id = (select auth.uid())
         ) me on true
  left join public.read_markers rm
         on rm.user_id = (select auth.uid())
        and rm.scope = 'room'
        and rm.scope_id = cm.chatroom_id
  where  cm.user_id = (select auth.uid())
    and  m.sender_id <> (select auth.uid())
    and  m.created_at > coalesce(rm.last_read_at, '-infinity'::timestamptz)
  group by m.chatroom_id;
$$;

revoke execute on function public.room_unread_counts() from public, anon;
grant  execute on function public.room_unread_counts() to authenticated;

-- 4. RPC dm_unread_counts(): per ogni conversazione DM accettata del chiamante,
--    quanti messaggi (non suoi) sono arrivati dopo l'ultima lettura.
create or replace function public.dm_unread_counts()
returns table (conversation_id uuid, unread int)
language sql
stable
security definer
set search_path = ''
as $$
  select dm.conversation_id,
         count(*)::int as unread
  from   public.dm_messages dm
  join   public.dm_conversations c on c.id = dm.conversation_id
  left join public.read_markers rm
         on rm.user_id = (select auth.uid())
        and rm.scope = 'dm'
        and rm.scope_id = dm.conversation_id
  where  (c.from_user_id = (select auth.uid()) or c.to_user_id = (select auth.uid()))
    and  c.status = 'accepted'
    and  dm.sender_id <> (select auth.uid())
    and  dm.created_at > coalesce(rm.last_read_at, '-infinity'::timestamptz)
  group by dm.conversation_id;
$$;

revoke execute on function public.dm_unread_counts() from public, anon;
grant  execute on function public.dm_unread_counts() to authenticated;

-- 5. Backfill: utenti e conversazioni già esistenti partono "tutto letto" al
--    momento del rollout, così nessuna vede badge enormi sulla storia pregressa
--    (specie nella foyer). Da qui in poi i nuovi marker arrivano dal trigger
--    (stanze) e da mark_read (quando apri/esci da una chat o un DM).
insert into public.read_markers (user_id, scope, scope_id, last_read_at)
select cm.user_id, 'room', cm.chatroom_id, now()
from   public.chat_membership cm
on conflict (user_id, scope, scope_id) do nothing;

insert into public.read_markers (user_id, scope, scope_id, last_read_at)
select p.uid, 'dm', c.id, now()
from   public.dm_conversations c
cross join lateral (values (c.from_user_id), (c.to_user_id)) as p(uid)
where  c.status = 'accepted'
on conflict (user_id, scope, scope_id) do nothing;
