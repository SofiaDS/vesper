-- ============================================================
-- Vesper — Migration: fcm_tokens (notifiche push native via FCM)
-- Dipende da: 20260604120000_fase1_schema.sql (profiles)
--
-- L'app nativa (Capacitor/Android) registra un token FCM per device. A
-- differenza del Web Push (push_subscriptions, endpoint+chiavi del browser),
-- FCM usa un singolo token opaco. Le notifiche native passano da Google Play
-- Services, indipendenti da Chrome.
--
-- Il token è UNICO per install/device: la unique è su `token` (non su
-- user_id+token). Se lo stesso device viene usato da un altro account, l'upsert
-- riassegna il token all'utente corrente, così una notifica non finisce mai
-- all'utente sbagliato dopo un cambio di login.
-- ============================================================

create table if not exists public.fcm_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  token      text not null,
  platform   text not null default 'android',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fcm_tokens_token_unique unique (token)
);

create index if not exists fcm_tokens_user_idx on public.fcm_tokens (user_id);

comment on table public.fcm_tokens is
  'Token FCM per notifiche push native (app Capacitor). Un token per device, riassegnato all''utente corrente all''upsert.';

-- Tiene aggiornato updated_at ad ogni upsert dello stesso token.
create or replace function public.fcm_tokens_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists fcm_tokens_touch on public.fcm_tokens;
create trigger fcm_tokens_touch
  before update on public.fcm_tokens
  for each row execute function public.fcm_tokens_touch_updated_at();

alter table public.fcm_tokens enable row level security;

-- Ogni utente gestisce solo i propri token.
-- (service_role bypassa RLS: l'Edge Function legge tutti i token per inviare.)
drop policy if exists "fcm_tokens_self" on public.fcm_tokens;
create policy "fcm_tokens_self"
  on public.fcm_tokens
  for all
  to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
