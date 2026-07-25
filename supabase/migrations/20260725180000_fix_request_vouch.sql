-- ============================================================
-- Vesper — Fix: la richiesta di garanzia non ha mai funzionato
--
-- Sintomo: in onboarding entrambi i nickname risultavano inesistenti,
-- qualunque cosa si scrivesse.
--
-- Tre cause distinte, tutte lato client:
--   1. requestVouch() leggeva `strato` e `vouch_failed_count` da
--      public_profiles, che per scelta NON espone quelle colonne. PostgREST
--      rispondeva 400 e il client ignorava `error`, quindi `data` era null e
--      si finiva sempre sul ramo "utente non trovata".
--   2. Anche con la lookup funzionante, l'INSERT in vouch_confirmations
--      sarebbe stato bloccato: la tabella ha RLS attiva e solo policy SELECT,
--      nessuna INSERT.
--   3. Il match sul nickname era esatto e non ripuliva la "@" che il
--      placeholder del form induceva a scrivere.
--
-- Fix: una sola RPC security definer che valida e crea tutto server-side.
-- Così `strato` resta fuori dalla vista pubblica, l'insert non ha bisogno di
-- una policy che aprirebbe vouch_confirmations alla scrittura dal client, e la
-- normalizzazione del nickname sta in un posto solo.
--
-- Gli INSERT restano veri INSERT, quindi il Database Webhook che invia la push
-- ai garanti (push-on-vouch) continua a scattare come prima.
-- Dipende da: 20260606050000_vouching.sql
-- ============================================================

create or replace function public.request_vouch(p_nicknames text[])
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller        uuid := auth.uid();
  v_caller_strato smallint;
  v_ids           uuid[] := '{}';
  v_nick          text;
  v_clean         text;
  v_g             record;
  v_req_id        uuid;
begin
  if v_caller is null then
    raise exception 'Devi aver effettuato l''accesso.';
  end if;

  -- Esattamente 2 garanti: è la regola di permessi_e_strati.md §2, non un
  -- limite tecnico. respond_to_vouch promuove quando TUTTE le conferme sono
  -- 'confirmed', quindi funzionerebbe con qualsiasi numero.
  if coalesce(array_length(p_nicknames, 1), 0) <> 2 then
    raise exception 'Servono i nickname di 2 garanti.';
  end if;

  select strato into v_caller_strato
    from public.profiles where id = v_caller;
  if not found then
    raise exception 'Profilo non trovato. Completa prima la registrazione.';
  end if;
  if v_caller_strato >= 2 then
    raise exception 'Sei già allo Strato 2 o oltre: la garanzia non ti serve.';
  end if;

  -- Una sola richiesta viva per utente, altrimenti si potrebbero spammare i
  -- garanti di notifiche push.
  if exists (
    select 1 from public.vouch_requests
     where new_user_id = v_caller
       and status = 'pending'
       and expires_at > now()
  ) then
    raise exception 'Hai già una richiesta di garanzia in corso.';
  end if;

  foreach v_nick in array p_nicknames loop
    -- Toglie la "@" iniziale (il form la induce) e rende il confronto
    -- insensibile alle maiuscole: chi scrive "@Poppi" intende "poppi".
    v_clean := lower(btrim(ltrim(btrim(v_nick), '@')));
    if v_clean = '' then
      raise exception 'Inserisci il nickname di entrambe le garanti.';
    end if;

    select p.id, p.strato, p.vouch_failed_count
      into v_g
      from public.profiles p
     where lower(p.nickname) = v_clean;

    if not found then
      raise exception 'Non esiste nessuna utente con il nickname "%".', v_clean;
    end if;
    if v_g.id = v_caller then
      raise exception 'Non puoi nominare te stessa come garante.';
    end if;
    if v_g.id = any(v_ids) then
      raise exception 'Le due garanti devono essere persone diverse.';
    end if;
    if v_g.strato < 3 then
      raise exception '@% non ha ancora raggiunto lo Strato 3 e non può fare da garante.', v_clean;
    end if;
    if v_g.vouch_failed_count >= 3 then
      raise exception '@% ha esaurito il privilegio di garanzia.', v_clean;
    end if;

    v_ids := v_ids || v_g.id;
  end loop;

  insert into public.vouch_requests (new_user_id)
  values (v_caller)
  returning id into v_req_id;

  insert into public.vouch_confirmations (request_id, guarantor_id)
  select v_req_id, g from unnest(v_ids) as g;

  return v_req_id;
end;
$$;

comment on function public.request_vouch(text[]) is
  'Crea una richiesta di garanzia per la utente chiamante. Valida i nickname '
  'dei garanti (esistenza, Strato 3, privilegio non esaurito, distinti, non sé '
  'stessa) senza esporre `strato` al client. Vedi permessi_e_strati.md §2.';

revoke all on function public.request_vouch(text[]) from public;
revoke all on function public.request_vouch(text[]) from anon;
grant execute on function public.request_vouch(text[]) to authenticated;
