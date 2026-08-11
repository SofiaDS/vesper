-- Elenco delle richieste di garanzia in attesa, dal punto di vista del garante.
--
-- Perché una RPC e non una query dal client: il garante NON può leggere né
-- `vouch_requests` (le policy coprono solo la richiedente e lo staff) né
-- `profiles` della richiedente (leggibile solo da sé stessi o staff). Una query
-- con join dal browser tornerebbe quindi sempre vuota — ed è esattamente il
-- motivo per cui la lista non ha mai funzionato: la notifica partiva, ma il
-- garante non aveva modo di vedere la richiesta.
--
-- Stessa scelta già fatta per `request_vouch` (20260725180000): quando la
-- validazione ha bisogno di dati che la RLS nasconde di proposito, si va
-- server-side invece di allargare le policy.
--
-- La funzione non espone nulla di più di quanto serve alla schermata: solo il
-- nickname della richiedente e le date della richiesta, e solo per le richieste
-- di cui chi chiama è effettivamente garante.
create or replace function public.pending_vouch_requests()
returns table (
  request_id        uuid,
  new_user_nickname text,
  created_at        timestamptz,
  expires_at        timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, p.nickname, r.created_at, r.expires_at
  from public.vouch_confirmations c
  join public.vouch_requests r on r.id = c.request_id
  join public.profiles p       on p.id = r.new_user_id
  where c.guarantor_id = auth.uid()
    and c.status       = 'pending'
    and r.status       = 'pending'
    and r.expires_at   > now()
  order by r.expires_at;
$$;

comment on function public.pending_vouch_requests() is
  'Richieste di garanzia ancora aperte per il garante che chiama. Vedi permessi_e_strati.md §2.';

-- Coerente con l'audit del 21 lug 2026: le SECURITY DEFINER non restano
-- eseguibili da public/anon.
revoke execute on function public.pending_vouch_requests() from public, anon;
grant  execute on function public.pending_vouch_requests() to authenticated;
