-- ============================================================
-- Vesper — Migration: profile_photos, reports
-- Dipende da: 20260604120000_fase1_schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- profile_photos
-- Foto profilo con moderazione: nascono 'pending', diventano
-- visibili agli altri solo da 'approved'. Vedi photos.ts.
-- ------------------------------------------------------------
create table if not exists public.profile_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  is_primary   boolean not null default false,
  sort_order   int not null default 0,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now()
);

create index if not exists profile_photos_user_idx
  on public.profile_photos (user_id, is_primary desc, sort_order asc);

comment on table public.profile_photos is
  'Foto profilo. Status pending → approvate dai moderatori prima di essere visibili.';

alter table public.profile_photos enable row level security;

-- Foto proprie: sempre visibili a sé stessa
create policy "photos_select_own"
  on public.profile_photos for select
  to authenticated
  using (user_id = auth.uid());

-- Foto altrui: solo quelle approvate
create policy "photos_select_approved"
  on public.profile_photos for select
  to authenticated
  using (status = 'approved');

-- Upload: solo per sé stessa
create policy "photos_insert_self"
  on public.profile_photos for insert
  to authenticated
  with check (user_id = auth.uid());

-- Eliminazione: solo proprie
create policy "photos_delete_self"
  on public.profile_photos for delete
  to authenticated
  using (user_id = auth.uid());

-- Aggiornamento is_primary/sort_order: solo proprie; aggiornamento status: solo staff
create policy "photos_update_self"
  on public.profile_photos for update
  to authenticated
  using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());

-- ------------------------------------------------------------
-- reports
-- Segnalazioni utente. La persona segnalata non vede chi la ha segnalata.
-- Vedi moderazione.md §3-4.
-- ------------------------------------------------------------
create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid references public.profiles(id) on delete set null,
  target_type       text not null check (target_type in ('user', 'message', 'photo')),
  target_user_id    uuid references public.profiles(id) on delete set null,
  target_message_id bigint references public.messages(id) on delete set null,
  target_photo_id   uuid references public.profile_photos(id) on delete set null,
  reason            text,
  status            text not null default 'open'
                      check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  resolution_note   text,
  resolved_by       uuid references public.profiles(id) on delete set null,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists reports_status_idx    on public.reports (status, created_at desc);
create index if not exists reports_target_user_idx on public.reports (target_user_id);

comment on table public.reports is
  'Segnalazioni. Il reporter_id è nascosto alla persona segnalata via RLS.';
comment on column public.reports.status is
  'open → in gestione; reviewed → rivista senza azione; '
  'actioned → azione presa; dismissed → archiviata (nessuna violazione).';

alter table public.reports enable row level security;

-- Chiunque può creare una segnalazione (per sé stessa come reporter)
create policy "reports_insert_self"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- Solo staff può leggere le segnalazioni
create policy "reports_select_staff"
  on public.reports for select
  to authenticated
  using (public.is_staff());

-- Solo staff può aggiornare (risolvere) le segnalazioni
create policy "reports_update_staff"
  on public.reports for update
  to authenticated
  using  (public.is_staff())
  with check (public.is_staff());
