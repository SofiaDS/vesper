-- ============================================================
-- Vesper — Migration: nuovi campi profilo (gruppo C)
-- Aggiunge: opzione "non so ancora" a relationship_type, lingue
-- parlate, situazione figli, animali domestici (con dettaglio
-- libero) — ciascuno col proprio flag show_* (privacy by default,
-- stesso pattern di 20260606000000_extend_profiles.sql).
-- Ricrea public_profiles per esporre i nuovi campi mascherati.
-- ============================================================

-- "Non so ancora" come opzione di relationship_type (oltre alle esistenti)
alter table public.profiles
  drop constraint if exists profiles_relationship_type_check;

alter table public.profiles
  add constraint profiles_relationship_type_check
    check (relationship_type in (
      'monogama','poliamorosa','aperta','nme','complicato',
      'non_so_ancora','preferisco_non_specificare'
    ));

-- Lingue parlate (multi-selezione, lista chiusa "inclusiva")
alter table public.profiles
  add column if not exists languages text[] not null default '{}'::text[]
    check (languages <@ array[
      'italiano','inglese','francese','spagnolo','tedesco','portoghese',
      'arabo','cinese','russo','rumeno','hindi','lis','altro'
    ]::text[]);

-- Figli: situazione attuale o desiderio
alter table public.profiles
  add column if not exists children_status text
    check (children_status in (
      'ho_figli','non_ho_figli','vorrei_figli','non_vorrei_figli'
    ));

-- Animali domestici: sì/no + testo libero di specifica (solo se sì)
alter table public.profiles
  add column if not exists has_pets boolean,
  add column if not exists pets_detail text
    check (pets_detail is null or char_length(pets_detail) <= 140);

-- Visibilità dei nuovi campi (default false, coerente con gli altri campi opzionali)
alter table public.profiles
  add column if not exists show_languages boolean not null default false,
  add column if not exists show_children  boolean not null default false,
  add column if not exists show_pets      boolean not null default false;

comment on column public.profiles.languages      is 'Lingue parlate (lista chiusa, vedi LANGUAGE_OPTIONS).';
comment on column public.profiles.children_status is 'Situazione/desiderio riguardo ai figli (vedi CHILDREN_OPTIONS).';
comment on column public.profiles.has_pets       is 'Ha animali domestici: null = non specificato.';
comment on column public.profiles.pets_detail    is 'Specifica libera sugli animali domestici, mostrata solo se has_pets = true.';

-- Ricrea la view (drop+create: i nuovi campi vanno aggiunti alla select,
-- non esiste ALTER VIEW ADD COLUMN). Stessa definizione di
-- 20260606050000_fix_public_profiles_security.sql con le 3 colonne in più.
drop view if exists public.public_profiles cascade;

create view public.public_profiles as
select
  p.id,
  p.nickname,
  p.avatar_preset,
  p.accent_color,
  p.bio,
  p.interests,

  case when p.show_age
    then extract(year from age(p.birth_date))::int
  end                                               as age,

  case when p.show_birth_date then p.birth_date end as birth_date,

  case when p.show_identity then p.identity_category end as identity_category,

  case when p.show_orientation then p.orientations end as orientations,

  case when p.show_city then p.city          end as city,
  case when p.show_city then p.city_province end as city_province,
  case when p.show_city then p.city_region   end as city_region,

  case when p.show_pronouns then p.pronouns end as pronouns,

  case when p.show_intents then p.intents end as intents,

  case when p.show_relationship then p.relationship_status end as relationship_status,
  case when p.show_relationship then p.relationship_type   end as relationship_type,

  case when p.show_languages then p.languages       end as languages,
  case when p.show_children  then p.children_status end as children_status,
  case when p.show_pets      then p.has_pets         end as has_pets,
  case when p.show_pets      then p.pets_detail      end as pets_detail,

  case when p.show_diet     then p.diet     end as diet,
  case when p.show_religion then p.religion end as religion,
  case when p.show_politics then p.politics end as politics,
  case when p.show_smoking  then p.smoking  end as smoking,
  case when p.show_sport    then p.sport    end as sport,

  case when p.show_zodiac
    then public.zodiac_from_date(p.birth_date)
  end                                               as zodiac,

  (p.id = auth.uid())                               as is_self

from public.profiles p;

comment on view public.public_profiles is
  'Profili pubblici con masking dei campi basato sui flag show_*. '
  'Non espone strato, dm_filter, dati di moderazione. '
  'Gira come owner (no security_invoker) per bypassare l''RLS '
  'restrittiva della tabella profiles.';

grant select on public.public_profiles to authenticated;
