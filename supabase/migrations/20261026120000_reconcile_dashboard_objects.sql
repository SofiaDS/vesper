-- ============================================================
-- Riallineamento repo ↔ prod (26 ott 2026)
--
-- Questi oggetti esistono sul progetto prod (ywkttzzkvlemtsuoceke) perché
-- sono stati creati dalla dashboard / SQL Editor, ma non erano in nessuna
-- migration. Senza questo file un database nuovo (es. vesper-dev) costruito
-- dalle migration non sarebbe uguale a prod.
--
-- Il file è idempotente: su prod non cambia nulla (definizioni identiche),
-- su un database nuovo crea ciò che manca. Contenuto copiato dal catalogo
-- di prod e verificato con un confronto per hash.
--
-- NON contiene i trigger dei webhook (push-on-*, moderate-message): portano
-- l'header x-webhook-secret e vanno creati a mano su ogni progetto
-- (vedi RILASCI.md). Non contiene dati: la tabella comuni va popolata a parte.
-- ============================================================

-- Funzioni
create or replace function public.compute_zodiac(d date)
 returns text
 language sql
 immutable
 set search_path to ''
as $function$
  select case
    when d is null then null
    when (extract(month from d)=3 and extract(day from d)>=21) or (extract(month from d)=4 and extract(day from d)<=19) then 'ariete'
    when (extract(month from d)=4 and extract(day from d)>=20) or (extract(month from d)=5 and extract(day from d)<=20) then 'toro'
    when (extract(month from d)=5 and extract(day from d)>=21) or (extract(month from d)=6 and extract(day from d)<=20) then 'gemelli'
    when (extract(month from d)=6 and extract(day from d)>=21) or (extract(month from d)=7 and extract(day from d)<=22) then 'cancro'
    when (extract(month from d)=7 and extract(day from d)>=23) or (extract(month from d)=8 and extract(day from d)<=22) then 'leone'
    when (extract(month from d)=8 and extract(day from d)>=23) or (extract(month from d)=9 and extract(day from d)<=22) then 'vergine'
    when (extract(month from d)=9 and extract(day from d)>=23) or (extract(month from d)=10 and extract(day from d)<=22) then 'bilancia'
    when (extract(month from d)=10 and extract(day from d)>=23) or (extract(month from d)=11 and extract(day from d)<=21) then 'scorpione'
    when (extract(month from d)=11 and extract(day from d)>=22) or (extract(month from d)=12 and extract(day from d)<=21) then 'sagittario'
    when (extract(month from d)=12 and extract(day from d)>=22) or (extract(month from d)=1 and extract(day from d)<=19) then 'capricorno'
    when (extract(month from d)=1 and extract(day from d)>=20) or (extract(month from d)=2 and extract(day from d)<=18) then 'acquario'
    else 'pesci'
  end
$function$;

create or replace function public.enforce_photo_cap()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
  if (select count(*) from public.profile_photos where user_id = new.user_id) >= 4 then
    raise exception 'Massimo 4 foto per profilo';
  end if;
  return new;
end $function$;

create or replace function public.lock_photo_status()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
  if auth.uid() is not null and not public.is_staff()
     and new.status is distinct from old.status then
    new.status := old.status;
  end if;
  return new;
end $function$;

-- Colonne e default come su prod
alter table public.profiles alter column show_age set default true;
alter table public.profiles alter column show_online set default false;
alter table public.profiles alter column show_identity set default false;
alter table public.profiles alter column show_orientation set default false;
alter table public.profiles add column if not exists zodiac text generated always as (public.compute_zodiac(birth_date)) stored;
alter table public.profile_photos alter column sort_order type smallint;
alter table public.user_roles add column if not exists granted_by uuid;

-- Vincoli come su prod (le FK puntano ad auth.users, non a profiles)
alter table public.user_blocks drop constraint if exists user_blocks_no_self;
alter table public.user_blocks drop constraint if exists no_self_block;
alter table public.user_blocks add constraint no_self_block check ((blocker_id <> blocked_id));
alter table public.profile_photos drop constraint if exists profile_photos_user_id_fkey;
alter table public.profile_photos add constraint profile_photos_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.profiles drop constraint if exists profiles_diet_check;
alter table public.profiles add constraint profiles_diet_check check (((diet is null) or (diet = any (array['vegetariana'::text, 'vegana'::text, 'flexitariana'::text, 'onnivora'::text, 'onnivora_consapevole'::text, 'altro'::text]))));
alter table public.profiles drop constraint if exists profiles_interests_check;
alter table public.profiles add constraint profiles_interests_check check (((array_length(interests, 1) is null) or (array_length(interests, 1) <= 4)));
alter table public.profiles drop constraint if exists profiles_politics_check;
alter table public.profiles add constraint profiles_politics_check check (((politics is null) or (politics = any (array['progressista'::text, 'conservatrice'::text, 'moderata'::text, 'libertaria'::text, 'anarchica'::text, 'socialista'::text, 'comunista'::text, 'altro'::text]))));
alter table public.profiles drop constraint if exists profiles_pronouns_check;
alter table public.profiles add constraint profiles_pronouns_check check (((pronouns is null) or (char_length(pronouns) <= 40)));
alter table public.profiles drop constraint if exists profiles_relationship_status_check;
alter table public.profiles add constraint profiles_relationship_status_check check (((relationship_status is null) or (relationship_status = any (array['single'::text, 'in_relazione'::text, 'non_dico'::text]))));
alter table public.profiles drop constraint if exists profiles_religion_check;
alter table public.profiles add constraint profiles_religion_check check (((religion is null) or (religion = any (array['cattolicesimo'::text, 'islam'::text, 'ebraismo'::text, 'buddismo'::text, 'induismo'::text, 'spiritualita'::text, 'ateismo'::text, 'agnosticismo'::text, 'altro'::text]))));
alter table public.reports drop constraint if exists reports_reporter_id_fkey;
alter table public.reports add constraint reports_reporter_id_fkey foreign key (reporter_id) references auth.users(id) on delete set null;
alter table public.reports drop constraint if exists reports_resolved_by_fkey;
alter table public.reports add constraint reports_resolved_by_fkey foreign key (resolved_by) references auth.users(id) on delete set null;
alter table public.reports drop constraint if exists reports_target_user_id_fkey;
alter table public.reports add constraint reports_target_user_id_fkey foreign key (target_user_id) references auth.users(id) on delete set null;
alter table public.user_blocks drop constraint if exists user_blocks_blocked_id_fkey;
alter table public.user_blocks add constraint user_blocks_blocked_id_fkey foreign key (blocked_id) references auth.users(id) on delete cascade;
alter table public.user_blocks drop constraint if exists user_blocks_blocker_id_fkey;
alter table public.user_blocks add constraint user_blocks_blocker_id_fkey foreign key (blocker_id) references auth.users(id) on delete cascade;
alter table public.user_roles drop constraint if exists user_roles_granted_by_fkey;
alter table public.user_roles add constraint user_roles_granted_by_fkey foreign key (granted_by) references auth.users(id) on delete set null;
alter table public.user_roles drop constraint if exists user_roles_user_id_fkey;
alter table public.user_roles add constraint user_roles_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

-- Comuni (autocompletamento città nel profilo). Dati ISTAT: 7904 righe, non incluse qui.
create table if not exists public.comuni (
  id        serial primary key,
  nome      text not null,
  sigla     text not null,
  provincia text not null,
  regione   text not null,
  ricerca   text not null
);
alter table public.comuni enable row level security;
drop policy if exists comuni_select_authenticated on public.comuni;
create policy comuni_select_authenticated on public.comuni for select to authenticated using (true);
create index if not exists comuni_ricerca_prefix_idx on public.comuni using btree (ricerca text_pattern_ops);
create index if not exists comuni_nome_idx on public.comuni using btree (nome);

-- Indici
drop index if exists public.profile_photos_user_idx;
create index profile_photos_user_idx on public.profile_photos using btree (user_id);
create unique index if not exists profile_photos_one_primary on public.profile_photos using btree (user_id) where is_primary;
create index if not exists user_blocks_blocker_idx on public.user_blocks using btree (blocker_id);

-- Policy presenti su prod oltre a quelle delle migration precedenti
drop policy if exists profile_photos_delete on public.profile_photos;
create policy profile_photos_delete on public.profile_photos for delete to authenticated using ((user_id = (select auth.uid())));
drop policy if exists profile_photos_insert on public.profile_photos;
create policy profile_photos_insert on public.profile_photos for insert to authenticated with check (((user_id = (select auth.uid())) and (status = 'pending'::text)));
drop policy if exists profile_photos_select on public.profile_photos;
create policy profile_photos_select on public.profile_photos for select to authenticated using (((user_id = (select auth.uid())) or (status = 'approved'::text)));
drop policy if exists profile_photos_staff_select on public.profile_photos;
create policy profile_photos_staff_select on public.profile_photos for select to authenticated using (public.is_staff());
drop policy if exists profile_photos_staff_update on public.profile_photos;
create policy profile_photos_staff_update on public.profile_photos for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists profile_photos_update on public.profile_photos;
create policy profile_photos_update on public.profile_photos for update to authenticated using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert to authenticated with check ((reporter_id = (select auth.uid())));
drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports for select to authenticated using (((reporter_id = (select auth.uid())) or public.is_staff()));
drop policy if exists reports_update on public.reports;
create policy reports_update on public.reports for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists user_blocks_delete on public.user_blocks;
create policy user_blocks_delete on public.user_blocks for delete to authenticated using ((blocker_id = auth.uid()));
drop policy if exists user_blocks_insert on public.user_blocks;
create policy user_blocks_insert on public.user_blocks for insert to authenticated with check ((blocker_id = auth.uid()));
drop policy if exists user_blocks_select on public.user_blocks;
create policy user_blocks_select on public.user_blocks for select to authenticated using ((blocker_id = auth.uid()));
drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles for select to authenticated using (((user_id = (select auth.uid())) or public.is_admin()));

-- Trigger foto
drop trigger if exists trg_enforce_photo_cap on public.profile_photos;
create trigger trg_enforce_photo_cap before insert on public.profile_photos for each row execute function public.enforce_photo_cap();
drop trigger if exists trg_lock_photo_status on public.profile_photos;
create trigger trg_lock_photo_status before update on public.profile_photos for each row execute function public.lock_photo_status();

-- Bucket foto profilo + policy storage
insert into storage.buckets (id, name, public) values ('profile-photos', 'profile-photos', false)
on conflict (id) do nothing;
drop policy if exists profile_photos_obj_delete on storage.objects;
create policy profile_photos_obj_delete on storage.objects for delete to authenticated using (((bucket_id = 'profile-photos'::text) and ((storage.foldername(name))[1] = ((select auth.uid()))::text)));
drop policy if exists profile_photos_obj_insert on storage.objects;
create policy profile_photos_obj_insert on storage.objects for insert to authenticated with check (((bucket_id = 'profile-photos'::text) and ((storage.foldername(name))[1] = ((select auth.uid()))::text)));
drop policy if exists profile_photos_obj_select on storage.objects;
create policy profile_photos_obj_select on storage.objects for select to authenticated using (((bucket_id = 'profile-photos'::text) and (((storage.foldername(name))[1] = ((select auth.uid()))::text) or (exists (select 1 from public.profile_photos pp where ((pp.storage_path = objects.name) and (pp.status = 'approved'::text)))))));
drop policy if exists profile_photos_obj_staff_select on storage.objects;
create policy profile_photos_obj_staff_select on storage.objects for select to authenticated using (((bucket_id = 'profile-photos'::text) and public.is_staff()));
drop policy if exists profile_photos_obj_update on storage.objects;
create policy profile_photos_obj_update on storage.objects for update to authenticated using (((bucket_id = 'profile-photos'::text) and ((storage.foldername(name))[1] = ((select auth.uid()))::text)));

-- Permessi come su prod
revoke execute on function public.is_member(uuid) from anon;
