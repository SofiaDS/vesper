-- ============================================================
-- Vesper — Migration: colonne flagged_by_ai per moderazione AI
-- P39: prepara il campo per il filtro AI (OpenAI Moderation API).
-- La logica di flagging arriverà con P38 (Edge Function).
-- ============================================================

alter table public.messages
  add column if not exists flagged_by_ai      boolean not null default false,
  add column if not exists ai_flag_archived   boolean not null default false;

alter table public.dm_messages
  add column if not exists flagged_by_ai      boolean not null default false,
  add column if not exists ai_flag_archived   boolean not null default false;

comment on column public.messages.flagged_by_ai    is 'Segnalato dal filtro AI (soft mode). Visibile solo ai moderatori.';
comment on column public.messages.ai_flag_archived is 'Il moderatore ha archiviato il flag come falso positivo.';
comment on column public.dm_messages.flagged_by_ai    is 'Segnalato dal filtro AI (soft mode).';
comment on column public.dm_messages.ai_flag_archived is 'Archiviato come falso positivo dal moderatore.';

create index if not exists messages_ai_flag_idx
  on public.messages (created_at desc)
  where flagged_by_ai = true and ai_flag_archived = false;

create index if not exists dm_messages_ai_flag_idx
  on public.dm_messages (created_at desc)
  where flagged_by_ai = true and ai_flag_archived = false;
