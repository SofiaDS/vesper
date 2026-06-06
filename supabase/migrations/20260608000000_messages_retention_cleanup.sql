-- ============================================================
-- Vesper — Migration: retention messaggi chatroom
-- Estende run_gdpr_cleanup con cancellazione messaggi chatroom
-- più vecchi di 24 mesi (space management, non GDPR-obbligatorio).
-- I dm_messages NON sono toccati: la decisione su anonimizzazione
-- vs cancellazione è da definire con consulente legale (gdpr_e_legale.md §2).
-- Dipende da: 20260607000000_decay_rpc.sql
-- ============================================================

-- Retention per i soli messaggi chatroom (tabella messages).
-- Valore conservativo: 24 mesi. Modificabile qui senza altre conseguenze.
create or replace function public.run_gdpr_cleanup()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rep_deleted      int;
  v_vouch_expired    int;
  v_messages_deleted int;
begin
  -- 1. Elimina reputation_events creati più di 12 mesi fa.
  delete from public.reputation_events
  where created_at < now() - interval '12 months';
  get diagnostics v_rep_deleted = row_count;

  -- 2. Marca come 'expired' le vouch_requests pending scadute.
  update public.vouch_requests
  set status = 'expired'
  where status = 'pending'
    and expires_at < now();
  get diagnostics v_vouch_expired = row_count;

  -- 3. Elimina messaggi chatroom più vecchi di 24 mesi.
  --    I dm_messages sono esclusi: conservazione da decidere con consulente.
  delete from public.messages
  where created_at < now() - interval '24 months';
  get diagnostics v_messages_deleted = row_count;

  return jsonb_build_object(
    'reputation_events_deleted', v_rep_deleted,
    'vouch_requests_expired',    v_vouch_expired,
    'chatroom_messages_deleted', v_messages_deleted
  );
end;
$$;

-- Solo service_role (Edge Function schedulata). Mai client-side.
revoke execute on function public.run_gdpr_cleanup() from public, anon, authenticated;
grant  execute on function public.run_gdpr_cleanup() to service_role;
