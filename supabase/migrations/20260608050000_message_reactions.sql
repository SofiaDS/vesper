-- ============================================================
-- Vesper — Migration: emoji reaction sui messaggi
-- Aggiunge message_reactions (chat di gruppo) e dm_message_reactions
-- (messaggi privati). chatroom_id/conversation_id sono denormalizzati
-- dal messaggio reagito per riusare le funzioni is_member/is_dm_participant
-- nelle policy e per filtrare i canali realtime, esattamente come già
-- avviene per messages/dm_messages.
-- replica identity full: il payload "old" del realtime DELETE deve
-- contenere message_id/user_id/emoji per poter rimuovere la reazione
-- lato client senza un round-trip aggiuntivo.
-- ============================================================

create table public.message_reactions (
  id          bigint generated always as identity primary key,
  message_id  bigint not null references public.messages(id) on delete cascade,
  chatroom_id uuid not null references public.chatrooms(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  emoji       text not null check (char_length(emoji) between 1 and 8),
  created_at  timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index message_reactions_message_idx  on public.message_reactions (message_id);
create index message_reactions_chatroom_idx on public.message_reactions (chatroom_id);

comment on table public.message_reactions is 'Reazioni emoji ai messaggi delle chat di gruppo.';

alter table public.message_reactions replica identity full;
alter table public.message_reactions enable row level security;
alter publication supabase_realtime add table public.message_reactions;

create policy "message_reactions_select_member"
  on public.message_reactions for select
  to authenticated
  using (public.is_member(chatroom_id));

create policy "message_reactions_insert_self"
  on public.message_reactions for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_member(chatroom_id)
    and chatroom_id = (select m.chatroom_id from public.messages m where m.id = message_id)
  );

create policy "message_reactions_delete_self"
  on public.message_reactions for delete
  to authenticated
  using (user_id = (select auth.uid()));


create table public.dm_message_reactions (
  id              bigint generated always as identity primary key,
  message_id      bigint not null references public.dm_messages(id) on delete cascade,
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  emoji           text not null check (char_length(emoji) between 1 and 8),
  created_at      timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index dm_message_reactions_message_idx      on public.dm_message_reactions (message_id);
create index dm_message_reactions_conversation_idx on public.dm_message_reactions (conversation_id);

comment on table public.dm_message_reactions is 'Reazioni emoji ai messaggi privati (DM).';

alter table public.dm_message_reactions replica identity full;
alter table public.dm_message_reactions enable row level security;
alter publication supabase_realtime add table public.dm_message_reactions;

create policy "dm_message_reactions_select_participant"
  on public.dm_message_reactions for select
  to authenticated
  using (public.is_dm_participant(conversation_id));

create policy "dm_message_reactions_insert_self"
  on public.dm_message_reactions for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_dm_participant(conversation_id)
    and conversation_id = (select dm.conversation_id from public.dm_messages dm where dm.id = message_id)
  );

create policy "dm_message_reactions_delete_self"
  on public.dm_message_reactions for delete
  to authenticated
  using (user_id = (select auth.uid()));
