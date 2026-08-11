-- Due cambi alla logica della garanzia, decisi l'11 agosto 2026.
--
-- 1) RIFIUTARE NON PENALIZZA PIÙ IL GARANTE.
--    La versione precedente incrementava `vouch_failed_count` di chi rifiutava.
--    Non è ciò che descrive permessi_e_strati.md §2: lì una "garanzia fallita" è
--    la persona garantita che viene poi bannata, ed esiste già `record_failed_vouch`
--    (solo staff) per registrarla. Penalizzare il rifiuto spinge a dire di sì per
--    non rimetterci, che è l'opposto di quello che il vouching deve fare.
--
-- 2) DUE GARANZIE VALGONO ANCHE COME VERIFICA D'IDENTITÀ.
--    Oltre allo Strato 2, la richiedente viene marcata `verification_status =
--    'approved'` e non le viene più chiesto il video. Scelta consapevole per la
--    fase pre-lancio, in cui si apre solo a persone fidate presentate da chi è
--    già dentro.
--
--    Eccezione: se un moderatore ha GIÀ rifiutato la verifica, la garanzia non
--    scavalca quella decisione — altrimenti due amiche basterebbero ad annullare
--    una scelta di moderazione. In quel caso resta 'rejected' e la persona può
--    ripresentare il video dalla schermata di verifica.
create or replace function public.respond_to_vouch(p_request_id uuid, p_confirmed boolean)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_req           public.vouch_requests%rowtype;
  v_all_confirmed boolean;
begin
  -- Verifica che il chiamante sia un garante di questa richiesta.
  if not exists (
    select 1 from public.vouch_confirmations
    where request_id = p_request_id and guarantor_id = auth.uid()
      and status = 'pending'
  ) then
    raise exception 'Richiesta non trovata o già risposta.';
  end if;

  select * into v_req from public.vouch_requests where id = p_request_id;

  if v_req.status <> 'pending' then
    raise exception 'La richiesta non è più in attesa (stato: %).', v_req.status;
  end if;

  if v_req.expires_at < now() then
    update public.vouch_requests set status = 'expired' where id = p_request_id;
    raise exception 'La richiesta di garanzia è scaduta.';
  end if;

  -- Aggiorna la conferma del garante corrente.
  update public.vouch_confirmations
  set status = case when p_confirmed then 'confirmed' else 'denied' end,
      responded_at = now()
  where request_id = p_request_id and guarantor_id = auth.uid();

  if p_confirmed then
    -- Controlla se tutti i garanti hanno confermato.
    select not exists (
      select 1 from public.vouch_confirmations
      where request_id = p_request_id and status <> 'confirmed'
    ) into v_all_confirmed;

    if v_all_confirmed then
      update public.vouch_requests set status = 'approved' where id = p_request_id;

      -- Salto dei 7 giorni iniziali di Strato 1.
      update public.profiles
      set strato = greatest(strato, 2::smallint)
      where id = v_req.new_user_id;

      -- Verifica assolta dalla garanzia. Stessi campi che tocca
      -- approve_verification, così il profilo resta in uno stato che il resto
      -- dell'app già conosce. Un rifiuto del moderatore non viene scavalcato.
      update public.profiles
      set verification_status           = 'approved',
          verification_decided_at       = now(),
          verification_rejection_reason = null
      where id = v_req.new_user_id
        and coalesce(verification_status, '') <> 'rejected';
    end if;
  else
    -- Nega la richiesta. Nessuna conseguenza per chi rifiuta (vedi nota 1).
    update public.vouch_requests set status = 'denied' where id = p_request_id;
  end if;
end;
$function$;

comment on function public.respond_to_vouch(uuid, boolean) is
  'Risposta di un garante. Con tutte le conferme: Strato 2 + verifica approvata (salvo rifiuto del moderatore). Il rifiuto non penalizza il garante.';
