-- ============================================================
-- Trigger dei webhook (push + moderazione) — modello per un progetto Supabase.
--
-- Non è una migration: contiene un secret, che non va mai in git.
-- Uso (una volta per progetto, dallo SQL Editor del progetto giusto):
--   1. Dashboard → Database → Webhooks → "Enable" (crea supabase_functions).
--   2. Sostituisci <REF> con il ref del progetto e <WEBHOOK_SECRET> con il
--      valore del secret WEBHOOK_SECRET impostato nelle Edge Function Secrets
--      di QUEL progetto.
--   3. Esegui. Su prod esistono già: non rieseguirlo lì.
--
-- Struttura copiata dai trigger attivi su prod (26 ott 2026).
-- ============================================================

drop trigger if exists "push-on-chatroom" on public.messages;
create trigger "push-on-chatroom" after insert on public.messages for each row
  execute function supabase_functions.http_request('https://<REF>.supabase.co/functions/v1/push-on-chatroom', 'POST',
    '{"Content-type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}', '{}', '5000');

drop trigger if exists moderate_message_on_messages_insert on public.messages;
create trigger moderate_message_on_messages_insert after insert on public.messages for each row
  execute function supabase_functions.http_request('https://<REF>.supabase.co/functions/v1/moderate-message', 'POST',
    '{"Content-type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}', '{}', '5000');

drop trigger if exists "push-on-dm" on public.dm_messages;
create trigger "push-on-dm" after insert on public.dm_messages for each row
  execute function supabase_functions.http_request('https://<REF>.supabase.co/functions/v1/push-on-dm', 'POST',
    '{"Content-type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}', '{}', '5000');

drop trigger if exists moderate_message_on_dm_messages_insert on public.dm_messages;
create trigger moderate_message_on_dm_messages_insert after insert on public.dm_messages for each row
  execute function supabase_functions.http_request('https://<REF>.supabase.co/functions/v1/moderate-message', 'POST',
    '{"Content-type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}', '{}', '5000');

drop trigger if exists "push-on-verification" on public.profiles;
create trigger "push-on-verification" after update on public.profiles for each row
  execute function supabase_functions.http_request('https://<REF>.supabase.co/functions/v1/push-on-verification', 'POST',
    '{"Content-type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}', '{}', '5000');

drop trigger if exists "push-on-report" on public.reports;
create trigger "push-on-report" after update on public.reports for each row
  execute function supabase_functions.http_request('https://<REF>.supabase.co/functions/v1/push-on-report', 'POST',
    '{"Content-type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}', '{}', '5000');

drop trigger if exists "push-on-vouch" on public.vouch_confirmations;
create trigger "push-on-vouch" after insert on public.vouch_confirmations for each row
  execute function supabase_functions.http_request('https://<REF>.supabase.co/functions/v1/push-on-vouch', 'POST',
    '{"Content-type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}', '{}', '5000');
