-- ============================================================
-- Vesper — Migration: verification_decided_at su profiles
-- Aggiunge un timestamp preciso per la decisione di verifica,
-- necessario per la retention esatta a 30 giorni dei video
-- biometrici (gdpr_e_legale.md §2 — cleanup via Edge Function).
-- Dipende da: 20260606040000_verification.sql
-- ============================================================

alter table public.profiles
  add column if not exists verification_decided_at timestamptz;

comment on column public.profiles.verification_decided_at is
  'Timestamp della decisione di verifica (approved o rejected). '
  'Usato dall''Edge Function decay-expired-events per la retention '
  'esatta a 30 giorni del video biometrico (gdpr_e_legale.md §2).';

-- Aggiorna approve_verification per registrare la data di decisione.
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
  set verification_status           = 'approved',
      verification_decided_at       = now(),
      verification_rejection_reason = null
  where id = p_user_id;
end;
$$;

-- Aggiorna reject_verification per registrare la data di decisione.
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
      verification_decided_at       = now(),
      verification_rejection_reason = p_reason
  where id = p_user_id;
end;
$$;

revoke execute on function public.approve_verification(uuid)       from public, anon;
revoke execute on function public.reject_verification(uuid, text)  from public, anon;
grant  execute on function public.approve_verification(uuid)       to authenticated;
grant  execute on function public.reject_verification(uuid, text)  to authenticated;
