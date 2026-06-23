-- ============================================================
-- Vesper — Migration: RPC per archiviare i flag AI (falso positivo)
-- Dipende da: 20260608020000_ai_flag_columns.sql, 20260605020000_reputation.sql
--
-- BUG FIX: né messages né dm_messages avevano una policy FOR UPDATE,
-- quindi l'UPDATE diretto di ai_flag_archived dal pannello admin veniva
-- silenziosamente bloccato da RLS (0 righe aggiornate, nessun errore).
-- Usiamo una RPC SECURITY DEFINER che verifica is_staff() e tocca solo
-- la colonna ai_flag_archived (evita di concedere update sul body).
-- ============================================================

create or replace function public.archive_ai_flag(
  p_id     bigint,
  p_source text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_source = 'chatroom' then
    update public.messages
      set ai_flag_archived = true
      where id = p_id and flagged_by_ai = true;
  elsif p_source = 'dm' then
    update public.dm_messages
      set ai_flag_archived = true
      where id = p_id and flagged_by_ai = true;
  else
    raise exception 'invalid source: %', p_source using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.archive_ai_flag(bigint, text) from public, anon;
grant  execute on function public.archive_ai_flag(bigint, text) to authenticated;
