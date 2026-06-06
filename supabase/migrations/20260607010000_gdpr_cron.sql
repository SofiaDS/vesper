-- ============================================================
-- Vesper — Migration: pg_cron per cleanup GDPR mensile
-- Richiede: pg_cron abilitato (default su Supabase).
-- Dipende da: 20260607000000_decay_rpc.sql
--
-- Due job separati:
--   1. vesper-gdpr-db      — chiama run_gdpr_cleanup() direttamente (DB puro)
--   2. vesper-gdpr-storage — invoca l'Edge Function via pg_net per cleanup Storage
--
-- Applica questa migration normalmente. Poi, nel SQL Editor, esegui una volta:
--   alter database postgres set app.edge_fn_url =
--     'https://<ref>.supabase.co/functions/v1/decay-expired-events';
--   alter database postgres set app.service_role_key = '<service-role-key>';
-- (ref e service_role_key: Project Settings → API nel dashboard)
-- ============================================================

-- Idempotente: rimuove eventuali job precedenti prima di ricrearli.
do $$
begin
  perform cron.unschedule('vesper-gdpr-db');
exception when others then null;
end;
$$;

do $$
begin
  perform cron.unschedule('vesper-gdpr-storage');
exception when others then null;
end;
$$;

-- Job 1: cleanup DB — chiama run_gdpr_cleanup() direttamente, nessun token necessario.
-- pg_cron usa il ruolo postgres (superuser): può chiamare qualunque funzione.
select cron.schedule(
  'vesper-gdpr-db',
  '0 3 1 * *',
  'select public.run_gdpr_cleanup()'
);

-- Job 2: cleanup Storage — invoca l'Edge Function via HTTP (pg_net).
-- Richiede pg_net abilitato (default su Supabase) e le variabili app.* impostate sopra.
select cron.schedule(
  'vesper-gdpr-storage',
  '30 3 1 * *',
  $$
    select net.http_post(
      url     := current_setting('app.edge_fn_url'),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := '{}'::jsonb
    );
  $$
);
