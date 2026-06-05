-- ============================================================
-- Vesper — Migration: DM (messaggi privati 1:1)
-- Dipende da: 20260604120000_fase1_schema.sql
-- Tabelle: dm_conversations, dm_messages
-- Accessibile da Strato 2 in poi (permessi_e_strati.md §1).
-- ============================================================

-- dm_conversations
-- Copre sia la richiesta (pending) sia la chat attiva (accepted).
-- from_user_id = chi ha avviato la richiesta.
create table public.dm_conversations (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id   uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'accepted', 'rejected')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint dm_conversations_no_self check (from_user_id <> to_user_id)
);

comment on table public.dm_conversations is
  'Conversazioni DM 1:1. Lifecycle: pending → accepted/rejected. Accessibili da Strato 2.';

-- Impedisce conversazioni duplicate tra la stessa coppia (indipendentemente dalla direzione)
create unique index dm_conversations_pair_idx
  on public.dm_conversations (
    least(from_user_id, to_user_id),
    greatest(from_user_id, to_user_id)
  );

create trigger dm_conversations_set_updated_at
  before update on public.dm_conversations
  for each row execute function public.set_updated_at();

-- dm_messages
create table public.dm_messages (
  id              bigint generated always as identity primary key,
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);

create index dm_messages_conversation_idx
  on public.dm_messages (conversation_id, created_at);

comment on table public.dm_messages is 'Messaggi nelle conversazioni DM.';

alter publication supabase_realtime add table public.dm_messages;

-- ============================================================
-- RLS
-- ============================================================
alter table public.dm_conversations enable row level security;
alter table public.dm_messages       enable row level security;

-- Helper: l'utente corrente è uno dei due partecipanti alla conversazione
create or replace function public.is_dm_participant(p_conv_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.dm_conversations
    where id = p_conv_id
      and (from_user_id = auth.uid() or to_user_id = auth.uid())
  );
$$;

revoke execute on function public.is_dm_participant(uuid) from public;
grant  execute on function public.is_dm_participant(uuid) to authenticated;

-- dm_conversations — policies
-- SELECT: solo i partecipanti
create policy "dm_conv_select"
  on public.dm_conversations for select
  to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- INSERT: solo mittente autenticato con strato >= 2
create policy "dm_conv_insert"
  on public.dm_conversations for insert
  to authenticated
  with check (
    from_user_id = auth.uid()
    and (select strato from public.profiles where id = auth.uid()) >= 2
  );

-- UPDATE: solo la destinataria può accettare o rifiutare
create policy "dm_conv_update"
  on public.dm_conversations for update
  to authenticated
  using  (to_user_id = auth.uid())
  with check (to_user_id = auth.uid());

-- dm_messages — policies
-- SELECT: partecipanti alla conversazione
create policy "dm_msg_select"
  on public.dm_messages for select
  to authenticated
  using (public.is_dm_participant(conversation_id));

-- INSERT: partecipante + conversazione accepted + sender = auth.uid()
create policy "dm_msg_insert"
  on public.dm_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_dm_participant(conversation_id)
    and (select status from public.dm_conversations where id = conversation_id) = 'accepted'
  );
