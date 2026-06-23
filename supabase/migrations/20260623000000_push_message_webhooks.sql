-- ============================================================
-- Vesper — Migration: Database Webhook per notifiche push chat/DM
-- Trigger su INSERT in messages → push-on-chatroom, e in
-- dm_messages → push-on-dm (entrambe verify_jwt: false).
-- Equivalente a creare i webhook da Database → Webhooks nel
-- dashboard, ma versionato come migration (stesso pattern di
-- 20260610000000_moderate_message_webhooks.sql).
--
-- Perché serviva: le edge function push-on-chatroom/push-on-dm
-- esistevano ed erano deployate, ma nessun trigger le invocava
-- → i messaggi in chat e i DM non generavano notifiche, mentre
-- segnalazioni e vouch (i cui webhook erano già configurati) sì.
--
-- Nota: questi trigger sono indipendenti da moderate-message;
-- la notifica parte all'INSERT del messaggio. push-on-chatroom
-- auto-filtra il foyer (nessuna iscrizione → nessun destinatario).
-- ============================================================

create trigger push_on_messages_insert
after insert on public.messages
for each row
execute function supabase_functions.http_request(
  'https://ywkttzzkvlemtsuoceke.supabase.co/functions/v1/push-on-chatroom',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);

create trigger push_on_dm_messages_insert
after insert on public.dm_messages
for each row
execute function supabase_functions.http_request(
  'https://ywkttzzkvlemtsuoceke.supabase.co/functions/v1/push-on-dm',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);
