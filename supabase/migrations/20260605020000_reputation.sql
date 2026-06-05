-- ============================================================
-- Vesper — Migration: Sistema di reputazione (moderatori)
-- Dipende da: 20260604120000_fase1_schema.sql
-- Tabella: reputation_events
-- Visibile solo allo staff (admin/moderator). Mai agli utenti.
-- Vedi reputazione.md per la logica completa.
-- ============================================================

-- Helper: l'utente corrente ha ruolo admin o moderator
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('admin', 'moderator')
  );
$$;

revoke execute on function public.is_staff() from public, anon;
grant  execute on function public.is_staff() to authenticated;

-- reputation_events
-- Ogni riga è un evento confermato di moderazione (warning o mute).
-- Il punteggio corrente = somma dei pesi degli eventi ancora in vita (expires_at > now).
-- Gli eventi scaduti restano nello storico ~12 mesi per permettere ai moderatori
-- di vedere i pattern (reputazione.md §5.2); la pulizia GDPR è rimandata a un job schedulato.
create table public.reputation_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  event_type   text not null check (event_type in ('warning', 'mute_temp')),
  -- expires_at: warning = +3 mesi, mute = +6 mesi (reputazione.md §5.1)
  expires_at   timestamptz not null,
  status       text not null default 'active'
                 check (status in ('active', 'annulled_appeal')),
  moderator_id uuid references public.profiles(id) on delete set null,
  -- report_id è opzionale: presente se l'evento è collegato a una segnalazione specifica
  report_id    uuid,
  notes        text,
  created_at   timestamptz not null default now()
);

create index reputation_events_user_idx  on public.reputation_events (user_id, created_at desc);
create index reputation_events_active_idx on public.reputation_events (user_id, expires_at)
  where (status = 'active');

comment on table public.reputation_events is
  'Storico eventi di reputazione. Solo staff può leggere/scrivere. Mai visibile agli utenti. '
  'Vedi reputazione.md.';
comment on column public.reputation_events.expires_at is
  'Warning scade dopo 3 mesi, mute dopo 6 mesi. Dopo la scadenza esce dal punteggio ma '
  'resta nello storico fino a ~12 mesi.';

-- ============================================================
-- RLS
-- ============================================================
alter table public.reputation_events enable row level security;

-- Solo staff può leggere
create policy "rep_select_staff"
  on public.reputation_events for select
  to authenticated
  using (public.is_staff());

-- Solo staff può inserire
create policy "rep_insert_staff"
  on public.reputation_events for insert
  to authenticated
  with check (
    public.is_staff()
    and moderator_id = auth.uid()
  );

-- Solo admin può annullare un evento in appello (status → annulled_appeal)
create policy "rep_update_admin"
  on public.reputation_events for update
  to authenticated
  using  ((select public.is_staff()) and (select auth.uid() in (select user_id from public.user_roles where role = 'admin')))
  with check ((select public.is_staff()) and (select auth.uid() in (select user_id from public.user_roles where role = 'admin')));
