-- ============================================================
-- Vesper — Migration: verifica identità selfie
-- Dipende da: 20260606000000_extend_profiles.sql
-- Aggiunge colonne di verifica su profiles, bucket storage,
-- e RPC per submit/approve/reject.
-- ============================================================

-- Colonne di verifica su profiles
alter table public.profiles
  add column if not exists verification_status text
    check (verification_status in ('pending', 'approved', 'rejected')),
  add column if not exists verification_video_path text,
  add column if not exists verification_rejection_reason text;

comment on column public.profiles.verification_status is
  'Stato verifica identità: null = non inviata, pending = in attesa, '
  'approved = approvata, rejected = rifiutata (può riprovare).';

-- ------------------------------------------------------------
-- Storage bucket: identity-verifications (privato)
-- Solo l'utente può caricare nella propria cartella.
-- Solo lo staff può leggere (per moderare).
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('identity-verifications', 'identity-verifications', false)
on conflict (id) do nothing;

drop policy if exists "verif_upload_self" on storage.objects;
create policy "verif_upload_self"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'identity-verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "verif_read_staff" on storage.objects;
create policy "verif_read_staff"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'identity-verifications'
    and public.is_staff()
  );

-- Permette all'utente di sovrascrivere il proprio video (retry)
drop policy if exists "verif_update_self" on storage.objects;
create policy "verif_update_self"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'identity-verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------
-- RPC submit_verification(p_video_path)
-- Chiamata dal client dopo l'upload. Imposta status = pending.
-- Blocca se già pending o approved.
-- ------------------------------------------------------------
create or replace function public.submit_verification(p_video_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_status text;
begin
  select verification_status into v_status
  from public.profiles where id = v_uid;

  if v_status = 'pending' then
    raise exception 'Verifica già in attesa di revisione.';
  end if;
  if v_status = 'approved' then
    raise exception 'Profilo già verificato.';
  end if;

  update public.profiles
  set verification_status           = 'pending',
      verification_video_path       = p_video_path,
      verification_rejection_reason = null
  where id = v_uid;
end;
$$;

-- ------------------------------------------------------------
-- RPC approve_verification / reject_verification
-- Usate dai moderatori dalla dashboard.
-- ------------------------------------------------------------
create or replace function public.approve_verification(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Permesso negato.';
  end if;
  update public.profiles
  set verification_status = 'approved',
      verification_rejection_reason = null
  where id = p_user_id;
end;
$$;

create or replace function public.reject_verification(
  p_user_id uuid,
  p_reason  text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Permesso negato.';
  end if;
  update public.profiles
  set verification_status           = 'rejected',
      verification_rejection_reason = p_reason
  where id = p_user_id;
end;
$$;

revoke execute on function public.submit_verification(text)        from public, anon;
revoke execute on function public.approve_verification(uuid)       from public, anon;
revoke execute on function public.reject_verification(uuid, text)  from public, anon;
grant  execute on function public.submit_verification(text)        to authenticated;
grant  execute on function public.approve_verification(uuid)       to authenticated;
grant  execute on function public.reject_verification(uuid, text)  to authenticated;
