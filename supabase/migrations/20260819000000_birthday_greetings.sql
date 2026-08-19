-- ============================================================
-- Vesper — Migration: notifiche di buon compleanno
-- Dipende da: 20260604120000_fase1_schema.sql (profiles.birth_date),
--             20260607010000_gdpr_cron.sql (pattern pg_cron + pg_net),
--             20260817000000_fcm_tokens.sql / 20260606080000_push_subscriptions.sql
--
-- Un job pg_cron giornaliero invoca l'Edge Function `push-birthday`, che manda
-- una push a chi compie gli anni oggi. La data di nascita è facoltativa: chi non
-- l'ha inserita semplicemente non riceve nulla.
--
-- Fuso: usiamo Europe/Rome per decidere "oggi" (app italiana). Chi è nato il
-- 29/2 riceve gli auguri solo negli anni bisestili — caso limite accettato.
--
-- Auth: la funzione va deployata con "Verify JWT" = OFF, e il gateway pretende
-- comunque una chiave valida nell'header `apikey` per instradare (senza, torna 401
-- INVALID_CREDENTIALS). Il progetto usa il nuovo sistema di API key, quindi passiamo
-- la PUBLISHABLE key (`sb_publishable_…`), che è pubblica/non-segreta (le anon
-- legacy `eyJ…` sono rifiutate). La funzione internamente usa comunque la sua
-- service-role auto-iniettata per operare sul DB.
-- Non usiamo `alter database ... set app.*` perché su Supabase hosted il ruolo del
-- SQL Editor non ha il privilegio (ERROR 42501). Idem l'URL: pubblico, hardcoded.
-- ⚠️ Sostituisci <PUBLISHABLE_KEY> con la publishable key (Settings → API → API Keys)
-- prima di eseguire.
-- ============================================================

-- Anno in cui l'utente ha già ricevuto gli auguri: evita doppioni se il job
-- viene rieseguito nello stesso giorno.
alter table public.profiles
  add column if not exists birthday_greeted_year int;

comment on column public.profiles.birthday_greeted_year is
  'Ultimo anno in cui è stata inviata la notifica di compleanno. Anti-duplicato.';

-- Utenti che compiono gli anni oggi (fuso Europe/Rome) e non ancora salutati
-- quest'anno. SECURITY DEFINER: il job gira col service role, ma teniamo il
-- search_path fissato per sicurezza.
create or replace function public.birthday_user_ids()
returns table (id uuid, nickname text)
language sql
security definer
set search_path = public, pg_temp
as $$
  with today as (
    select (now() at time zone 'Europe/Rome')::date as d
  )
  select p.id, p.nickname
  from public.profiles p, today t
  where p.birth_date is not null
    and to_char(p.birth_date, 'MM-DD') = to_char(t.d, 'MM-DD')
    and (p.birthday_greeted_year is null
         or p.birthday_greeted_year <> extract(year from t.d)::int);
$$;

comment on function public.birthday_user_ids() is
  'Utenti con compleanno oggi (Europe/Rome) non ancora salutati quest''anno.';

-- Marca gli utenti come già salutati per l'anno corrente.
create or replace function public.mark_birthday_greeted(p_ids uuid[])
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.profiles
  set birthday_greeted_year = extract(year from (now() at time zone 'Europe/Rome'))::int
  where id = any(p_ids);
$$;

comment on function public.mark_birthday_greeted(uuid[]) is
  'Stampa l''anno corrente come "già salutato" sugli utenti passati.';

-- Solo il service_role (usato dall'Edge Function via SUPABASE_SERVICE_ROLE_KEY)
-- deve poter eseguire queste funzioni: non vanno esposte a utenti anon/authenticated.
-- NB: EXECUTE è governato da GRANT, non da RLS — dopo il revoke serve il grant
-- esplicito a service_role, altrimenti le RPC falliscono con "permission denied"
-- (stesso pattern di run_gdpr_cleanup, 20260607000000_decay_rpc.sql).
revoke execute on function public.birthday_user_ids() from public, anon, authenticated;
revoke execute on function public.mark_birthday_greeted(uuid[]) from public, anon, authenticated;
grant  execute on function public.birthday_user_ids()          to service_role;
grant  execute on function public.mark_birthday_greeted(uuid[]) to service_role;

-- Job pg_cron: ogni giorno alle 07:00 UTC (~08/09 Roma) invoca l'Edge Function.
-- Idempotente: rimuove il job precedente prima di ricrearlo.
do $$
begin
  perform cron.unschedule('vesper-birthday-push');
exception when others then null;
end;
$$;

select cron.schedule(
  'vesper-birthday-push',
  '0 7 * * *',
  $$
    select net.http_post(
      url     := 'https://ywkttzzkvlemtsuoceke.supabase.co/functions/v1/push-birthday',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey',       '<PUBLISHABLE_KEY>'
      ),
      body    := '{}'::jsonb
    );
  $$
);
