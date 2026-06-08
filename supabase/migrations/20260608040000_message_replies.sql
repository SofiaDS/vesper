-- ============================================================
-- Vesper — Migration: risposta a un messaggio (gruppo D)
-- Aggiunge reply_to_id a messages e dm_messages per permettere
-- di "citare" un messaggio precedente quando si risponde.
-- on delete set null: se il messaggio originale viene eliminato,
-- la citazione si svuota ma la risposta resta.
-- ============================================================

alter table public.messages
  add column if not exists reply_to_id bigint references public.messages(id) on delete set null;

alter table public.dm_messages
  add column if not exists reply_to_id bigint references public.dm_messages(id) on delete set null;

comment on column public.messages.reply_to_id is 'Messaggio citato in risposta (stessa chatroom), null se non è una risposta.';
comment on column public.dm_messages.reply_to_id is 'Messaggio citato in risposta (stessa conversazione), null se non è una risposta.';
