-- ============================================================
-- Vesper — Migration: Strati di permessi — contatore messaggi
-- Dipende da: 20260604120000_fase1_schema.sql
-- Aggiunge:
--   - profiles.message_count  (contatore incrementale via trigger)
--   - trigger messages_count_on_insert
--   - RPC promote_my_layer()  (chiamata dal client dopo ogni messaggio)
-- ============================================================

-- 1. Colonna message_count
alter table public.profiles
  add column message_count int not null default 0;

comment on column public.profiles.message_count is
  'Messaggi scritti in chatroom. Incrementato da trigger su messages. '
  'Soglie per promozione: Strato 2 ≥20, Strato 3 ≥100 (permessi_e_strati.md §1).';

-- 2. Backfill dai messaggi esistenti (sicuro su tabella vuota = no-op)
update public.profiles p
set message_count = (
  select count(*) from public.messages m where m.sender_id = p.id
);

-- 3. Trigger: incrementa message_count ad ogni insert in messages
create or replace function public.increment_message_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set    message_count = message_count + 1
  where  id = new.sender_id;
  return new;
end;
$$;

create trigger messages_count_on_insert
  after insert on public.messages
  for each row execute function public.increment_message_count();

-- Trigger function: nessuno la invoca via RPC
revoke execute on function public.increment_message_count() from public, anon, authenticated;

-- 4. RPC promote_my_layer()
--    Verifica se il chiamante (auth.uid()) soddisfa i requisiti per lo strato
--    successivo e aggiorna profiles.strato se sì.
--    Restituisce lo strato corrente (nuovo o invariato).
--
--    Requisiti (permessi_e_strati.md §1, soglie provvisorie da calibrare a 3 mesi):
--      Strato 1 → 2: ≥7 giorni dalla verifica, ≥20 messaggi, 0 report confermati
--      Strato 2 → 3: ≥30 giorni dalla verifica, ≥100 messaggi, 0 report confermati
--
--    "Report confermato" = reports.status = 'actioned' (moderatore ha preso azione).
--    Se la tabella reports è vuota la count() restituisce 0 senza errori.
create or replace function public.promote_my_layer()
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid    := auth.uid();
  v_strato     smallint;
  v_days       numeric;
  v_messages   int;
  v_actioned   int;
  v_new_strato smallint;
begin
  select strato,
         extract(epoch from (now() - created_at)) / 86400.0,
         message_count
  into   v_strato, v_days, v_messages
  from   public.profiles
  where  id = v_uid;

  if not found then return null; end if;
  if v_strato >= 3 then return v_strato; end if;

  select count(*) into v_actioned
  from   public.reports
  where  target_user_id = v_uid
    and  status = 'actioned';

  v_new_strato := v_strato;

  if (v_strato = 1 and v_days >= 7 and v_messages >= 20 and v_actioned = 0) then
    v_new_strato := 2;
  elsif (v_strato = 2 and v_days >= 30 and v_messages >= 100 and v_actioned = 0) then
    v_new_strato := 3;
  end if;

  if v_new_strato <> v_strato then
    update public.profiles
    set    strato = v_new_strato
    where  id = v_uid;
  end if;

  return v_new_strato;
end;
$$;

revoke execute on function public.promote_my_layer() from public, anon;
grant  execute on function public.promote_my_layer() to authenticated;
