-- ============================================================
-- Vesper — Migration: riconciliazione policy di SELECT su profiles
-- Dipende da: 20260604120000_fase1_schema.sql (profiles, profiles_select_authenticated)
--             20260605020000_reputation.sql   (is_staff())
--
-- CONTESTO / MOTIVO
-- La migration iniziale (20260604120000_fase1_schema.sql) creava:
--     profiles_select_authenticated ... USING (true)
-- cioè lettura dell'INTERA tabella profiles a qualunque utente autenticato.
-- profiles contiene dati sensibili (birth_date, verification_video_path,
-- verification_rejection_reason, dm_filter, strato, city, flag show_*, ...):
-- con USING (true) il masking della view public_profiles sarebbe aggirabile
-- interrogando direttamente /rest/v1/profiles.
--
-- Sul progetto LIVE la policy era già stata corretta a mano (per-utente +
-- policy staff), ma quel hardening non esisteva nei file di migration: una
-- ricostruzione del DB dai soli file (branch Supabase, nuovo ambiente,
-- disaster recovery) avrebbe ripristinato lo stato insicuro USING (true).
-- Questa migration porta su disco lo stato sicuro già applicato sul live.
--
-- Effetto sul live: idempotente — lo stato risultante è identico a quello
-- attualmente applicato (drop + ricreazione delle stesse policy).
--
-- STATO RISULTANTE
--   profiles_select_authenticated : ogni utente legge SOLO il proprio profilo
--                                   (id = auth.uid()); i profili altrui passano
--                                   ESCLUSIVAMENTE dalla view public_profiles,
--                                   che applica il masking show_*.
--   profiles_select_staff         : lo staff (is_staff()) legge tutti i profili
--                                   per moderazione/verifica identità.
-- ============================================================

-- 1. Sostituisce la policy permissiva USING (true) con una per-utente.
drop policy if exists "profiles_select_authenticated" on public.profiles;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

-- 2. Policy dedicata allo staff: accesso completo per moderazione e verifica.
drop policy if exists "profiles_select_staff" on public.profiles;

create policy "profiles_select_staff"
  on public.profiles for select
  to authenticated
  using (public.is_staff());
