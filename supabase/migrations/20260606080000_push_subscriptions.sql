-- ============================================================
-- Vesper — Migration: push_subscriptions (Web Push Notifications)
-- Dipende da: 20260604120000_fase1_schema.sql
-- Ogni utente può avere più sottoscrizioni (device diversi).
-- (user_id, endpoint) è unique: stesso browser = stessa sottoscrizione.
-- ============================================================

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth_key   text not null,
  created_at timestamptz not null default now(),
  constraint push_subs_unique unique (user_id, endpoint)
);

create index if not exists push_subs_user_idx on public.push_subscriptions (user_id);

comment on table public.push_subscriptions is
  'Sottoscrizioni Web Push per dispositivo. Endpoint = URL univoco del browser.';

alter table public.push_subscriptions enable row level security;

-- Ogni utente gestisce solo le proprie sottoscrizioni
drop policy if exists "push_subs_self" on public.push_subscriptions;
create policy "push_subs_self"
  on public.push_subscriptions
  for all
  to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Solo service_role può leggere le sottoscrizioni per inviarle (Edge Function)
-- → la policy "push_subs_self" non blocca service_role (bypassa RLS)
