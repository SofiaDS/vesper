-- ============================================================
-- Vesper — Migration: revisione requisiti avanzamento di strato
-- Dipende da: 20260605000000_strati_message_count.sql, 20260605020000_reputation.sql
--
-- Cambiamenti (vedi discussione su tab "Messaggi" non visibile a Strato 1):
--   - Strato 1 -> 2: 48h (era 7gg) dall'iscrizione, >=15 messaggi (era 20)
--   - Strato 2 -> 3: invariato (30gg, >=100 messaggi)
--   - Il check "0 report actioned" (permanente, senza recupero) viene
--     sostituito da un check sul punteggio di reputazione (>= -1), che
--     decade naturalmente dopo 3/6 mesi (vedi reputazione.md) e quindi
--     permette il recupero automatico.
--   - Nuova RPC check_my_layer_eligibility(): equivalente "dry run" di
--     promote_my_layer, usata dal client per mostrare lo stato di
--     avanzamento senza esporre il punteggio di reputazione (che resta
--     invisibile agli utenti).
-- ============================================================

-- Helper: punteggio di reputazione corrente del chiamante (somma pesi eventi attivi non scaduti).
-- Pesi: warning = -1, mute_temp = -3 (vedi reputazione.md §4.2 e lib/reputation/index.ts).
create or replace function public.my_reputation_score()
returns int
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(sum(
    case event_type
      when 'warning'   then -1
      when 'mute_temp' then -3
      else 0
    end
  ), 0)
  from public.reputation_events
  where user_id = auth.uid()
    and status = 'active'
    and expires_at > now();
$$;

revoke execute on function public.my_reputation_score() from public, anon;
grant  execute on function public.my_reputation_score() to authenticated;

-- RPC promote_my_layer(): nuove soglie + gate di reputazione (vedi sopra).
create or replace function public.promote_my_layer()
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid    := auth.uid();
  v_strato     smallint;
  v_hours      numeric;
  v_messages   int;
  v_rep        int;
  v_req_hours  numeric;
  v_req_msgs   int;
  v_new_strato smallint;
begin
  select strato,
         extract(epoch from (now() - created_at)) / 3600.0,
         message_count
  into   v_strato, v_hours, v_messages
  from   public.profiles
  where  id = v_uid;

  if not found then return null; end if;
  if v_strato >= 3 then return v_strato; end if;

  v_rep := public.my_reputation_score();

  if v_strato = 1 then
    v_req_hours := 48;       -- 48h
    v_req_msgs  := 15;
  else
    v_req_hours := 30 * 24;  -- 30gg
    v_req_msgs  := 100;
  end if;

  v_new_strato := v_strato;
  if v_hours >= v_req_hours and v_messages >= v_req_msgs and v_rep >= -1 then
    v_new_strato := v_strato + 1;
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

-- RPC check_my_layer_eligibility(): "dry run" per il frontend (ProfileEditor).
-- Non espone il punteggio di reputazione, solo se è (o no) sotto la soglia.
create or replace function public.check_my_layer_eligibility()
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_uid       uuid := auth.uid();
  v_strato    smallint;
  v_hours     numeric;
  v_messages  int;
  v_rep       int;
  v_req_hours numeric;
  v_req_msgs  int;
begin
  select strato,
         extract(epoch from (now() - created_at)) / 3600.0,
         message_count
  into   v_strato, v_hours, v_messages
  from   public.profiles
  where  id = v_uid;

  if not found then return null; end if;

  if v_strato >= 3 then
    return jsonb_build_object(
      'currentLayer', v_strato,
      'nextLayer', null,
      'eligible', false,
      'missingHours', 0,
      'missingMessages', 0,
      'reputationOk', true
    );
  end if;

  v_rep := public.my_reputation_score();

  if v_strato = 1 then
    v_req_hours := 48;
    v_req_msgs  := 15;
  else
    v_req_hours := 30 * 24;
    v_req_msgs  := 100;
  end if;

  return jsonb_build_object(
    'currentLayer', v_strato,
    'nextLayer', v_strato + 1,
    'missingHours', greatest(0, ceil(v_req_hours - v_hours)),
    'missingMessages', greatest(0, v_req_msgs - v_messages),
    'reputationOk', v_rep >= -1,
    'eligible', (v_hours >= v_req_hours and v_messages >= v_req_msgs and v_rep >= -1)
  );
end;
$$;

revoke execute on function public.check_my_layer_eligibility() from public, anon;
grant  execute on function public.check_my_layer_eligibility() to authenticated;
