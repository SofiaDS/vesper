-- ============================================================
-- Vesper — Migration: vouching (sistema di garanzia tra utenti)
-- Disponibile da Strato 3. Permette a nuove utenti di saltare i
-- 7 giorni iniziali (→ Strato 2) con 2 garanti confermati.
-- Vedi permessi_e_strati.md §2-3.
-- Dipende da: 20260606000000_extend_profiles.sql
-- ============================================================

-- ------------------------------------------------------------
-- vouch_requests: una richiesta per nuova utente
-- ------------------------------------------------------------
create table if not exists public.vouch_requests (
  id           uuid        primary key default gen_random_uuid(),
  new_user_id  uuid        not null references public.profiles(id) on delete cascade,
  status       text        not null default 'pending'
               check (status in ('pending', 'approved', 'denied', 'expired')),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '48 hours')
);

comment on table public.vouch_requests is
  'Richieste di garanzia: una per nuova utente. Scadono dopo 48 ore se non completate.';

-- ------------------------------------------------------------
-- vouch_confirmations: una riga per ogni garante (max 2)
-- ------------------------------------------------------------
create table if not exists public.vouch_confirmations (
  request_id   uuid not null references public.vouch_requests(id) on delete cascade,
  guarantor_id uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'confirmed', 'denied')),
  responded_at timestamptz,
  primary key  (request_id, guarantor_id)
);

comment on table public.vouch_confirmations is
  'Risposta di ogni garante a una vouch_request.';

-- ------------------------------------------------------------
-- Contatore garanzie fallite su profiles
-- Raggiunto MAX_FAILED_VOUCHES (3) → privilegio perso definitivamente.
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists vouch_failed_count smallint not null default 0;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.vouch_requests    enable row level security;
alter table public.vouch_confirmations enable row level security;

-- La nuova utente può creare e leggere la propria richiesta.
create policy "vouch_req_insert_self" on public.vouch_requests
  for insert to authenticated
  with check (new_user_id = auth.uid());

create policy "vouch_req_select_self" on public.vouch_requests
  for select to authenticated
  using (new_user_id = auth.uid());

-- I garanti vedono e rispondono alle proprie conferme.
create policy "vouch_conf_select_guarantor" on public.vouch_confirmations
  for select to authenticated
  using (guarantor_id = auth.uid());

-- Staff: visibilità totale per supervisione.
create policy "vouch_req_select_staff" on public.vouch_requests
  for select to authenticated
  using ((select public.is_staff()));

create policy "vouch_conf_select_staff" on public.vouch_confirmations
  for select to authenticated
  using ((select public.is_staff()));

-- ------------------------------------------------------------
-- RPC: respond_to_vouch
-- Chiamata dal garante per confermare o negare.
-- Effetti collaterali gestiti server-side:
--   • confirm: se tutti i garanti confermano → approva + strato 2
--   • deny: marca richiesta come negata + incrementa vouch_failed_count
-- ------------------------------------------------------------
create or replace function public.respond_to_vouch(
  p_request_id uuid,
  p_confirmed  boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req        public.vouch_requests%rowtype;
  v_new_status text;
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
      -- La nuova utente salta al Strato 2 (bypassa i 7 giorni iniziali).
      update public.profiles set strato = 2
      where id = v_req.new_user_id and strato < 2;
    end if;
  else
    -- Nega la richiesta e registra il fallimento sul garante.
    update public.vouch_requests set status = 'denied' where id = p_request_id;
    update public.profiles
    set vouch_failed_count = vouch_failed_count + 1
    where id = auth.uid();
  end if;
end;
$$;

-- ------------------------------------------------------------
-- RPC: record_failed_vouch — solo staff, per casi manuali
-- (es. garanzia risultata falsa dopo revisione)
-- ------------------------------------------------------------
create or replace function public.record_failed_vouch(p_guarantor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_staff()) then
    raise exception 'Permesso negato.';
  end if;
  update public.profiles
  set vouch_failed_count = vouch_failed_count + 1
  where id = p_guarantor_id;
end;
$$;
