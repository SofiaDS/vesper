-- ============================================================
-- Vesper — Migration: RPC run_gdpr_cleanup
-- Chiamata dall'Edge Function decay-expired-events (schedulata).
-- Gestisce il cleanup GDPR lato DB (non tocca Storage).
-- Vedi gdpr_e_legale.md §2, reputazione.md §5.2.
-- ============================================================

-- RPC: run_gdpr_cleanup
-- 1. Elimina reputation_events creati più di 12 mesi fa
--    (storico moderazione: conservato ~12 mesi per poter vedere pattern,
--    poi rimosso — reputazione.md §5.2, gdpr_e_legale.md §2).
-- 2. Marca come 'expired' le vouch_requests pending scadute.
-- Ritorna jsonb con i conteggi per logging.
create or replace function public.run_gdpr_cleanup()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rep_deleted   int;
  v_vouch_expired int;
begin
  delete from public.reputation_events
  where created_at < now() - interval '12 months';
  get diagnostics v_rep_deleted = row_count;

  update public.vouch_requests
  set status = 'expired'
  where status = 'pending'
    and expires_at < now();
  get diagnostics v_vouch_expired = row_count;

  return jsonb_build_object(
    'reputation_events_deleted', v_rep_deleted,
    'vouch_requests_expired',    v_vouch_expired
  );
end;
$$;

-- Solo service_role (Edge Function schedulata). Mai client-side.
revoke execute on function public.run_gdpr_cleanup() from public, anon, authenticated;
grant  execute on function public.run_gdpr_cleanup() to service_role;
