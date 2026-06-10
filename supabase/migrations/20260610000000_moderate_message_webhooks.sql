-- ============================================================
-- Vesper — Migration: Database Webhook per filtro AI (P38)
-- Trigger su INSERT in messages e dm_messages → Edge Function
-- moderate-message (verify_jwt: false, soft mode).
-- Equivalente a creare i webhook da Database → Webhooks nel
-- dashboard, ma versionato come migration.
-- ============================================================

create trigger moderate_message_on_messages_insert
after insert on public.messages
for each row
execute function supabase_functions.http_request(
  'https://ywkttzzkvlemtsuoceke.supabase.co/functions/v1/moderate-message',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);

create trigger moderate_message_on_dm_messages_insert
after insert on public.dm_messages
for each row
execute function supabase_functions.http_request(
  'https://ywkttzzkvlemtsuoceke.supabase.co/functions/v1/moderate-message',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);
