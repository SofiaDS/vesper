-- Sblocca la cancellazione dell'account.
--
-- Il trigger chat_membership_no_leave_foyer impedisce di abbandonare la Foyer,
-- ed è giusto: è la stanza comune, l'utente non deve poterne uscire.
-- Il guardiano però non distingueva l'uscita volontaria dalla sparizione
-- dell'intero account, e bloccava anche la seconda:
--
--   DELETE auth.users -> cascade profiles -> cascade chat_membership
--     -> prevent_foyer_leave() -> raise -> rollback dell'intera transazione
--
-- Siccome join_foyer_on_profile() iscrive ogni nuovo profilo alla Foyer, la
-- condizione valeva per la totalità degli utenti: nessun account era
-- cancellabile. L'edge function delete-account riceveva un errore dall'API
-- admin di GoTrue e restituiva 500.
--
-- Discriminante: quando la riga di chat_membership arriva qui per effetto
-- della cascata, la riga padre in profiles è già stata eliminata nella stessa
-- transazione (la cascata di una FK è un trigger AFTER sul padre). Se il
-- profilo non esiste più, non siamo di fronte a un abbandono volontario ma a
-- un account che sta sparendo: la membership deve seguirlo.
--
-- Resta invariato il caso da proteggere: utente vivo che prova a lasciare la
-- Foyer -> il profilo esiste -> eccezione come prima.
create or replace function public.prevent_foyer_leave()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  room_kind text;
begin
  if not exists (select 1 from public.profiles where id = old.user_id) then
    return old;
  end if;

  select kind into room_kind from public.chatrooms where id = old.chatroom_id;
  if room_kind = 'foyer' then
    raise exception 'La Foyer non puo essere abbandonata';
  end if;
  return old;
end;
$function$;
