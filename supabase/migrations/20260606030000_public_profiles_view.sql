-- ============================================================
-- Vesper — Migration: public_profiles view + search_users RPC
-- Dipende da: 20260606000000_extend_profiles.sql
-- ============================================================

-- ------------------------------------------------------------
-- Helper: calcola il segno zodiacale da una data di nascita.
-- Usato sia nella view che nella RPC search_users.
-- ------------------------------------------------------------
create or replace function public.zodiac_from_date(d date)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when d is null then null
    when extract(month from d) = 1  and extract(day from d) <= 19 then 'capricorno'
    when extract(month from d) = 1                                then 'acquario'
    when extract(month from d) = 2  and extract(day from d) <= 18 then 'acquario'
    when extract(month from d) = 2                                then 'pesci'
    when extract(month from d) = 3  and extract(day from d) <= 20 then 'pesci'
    when extract(month from d) = 3                                then 'ariete'
    when extract(month from d) = 4  and extract(day from d) <= 19 then 'ariete'
    when extract(month from d) = 4                                then 'toro'
    when extract(month from d) = 5  and extract(day from d) <= 20 then 'toro'
    when extract(month from d) = 5                                then 'gemelli'
    when extract(month from d) = 6  and extract(day from d) <= 20 then 'gemelli'
    when extract(month from d) = 6                                then 'cancro'
    when extract(month from d) = 7  and extract(day from d) <= 22 then 'cancro'
    when extract(month from d) = 7                                then 'leone'
    when extract(month from d) = 8  and extract(day from d) <= 22 then 'leone'
    when extract(month from d) = 8                                then 'vergine'
    when extract(month from d) = 9  and extract(day from d) <= 22 then 'vergine'
    when extract(month from d) = 9                                then 'bilancia'
    when extract(month from d) = 10 and extract(day from d) <= 22 then 'bilancia'
    when extract(month from d) = 10                               then 'scorpione'
    when extract(month from d) = 11 and extract(day from d) <= 21 then 'scorpione'
    when extract(month from d) = 11                               then 'sagittario'
    when extract(month from d) = 12 and extract(day from d) <= 21 then 'sagittario'
    else 'capricorno'  -- 22-31 dicembre
  end
$$;

-- ------------------------------------------------------------
-- public_profiles
-- Vista read-only sui profili con masking dei campi basato sui flag show_*.
-- Accessibile da tutti gli utenti autenticati (serve per vedere il profilo
-- di chi scrive in chat, non solo chi è in ricerca).
-- is_self: flag per nascondere blocca/segnala/DM su sé stessa.
-- Nota: non espone strato, dm_filter, show_* — sono interni.
-- ------------------------------------------------------------
-- DROP necessario perché CREATE OR REPLACE VIEW non può cambiare nomi o ordine
-- delle colonne di una view esistente.
drop view if exists public.public_profiles cascade;

create view public.public_profiles
with (security_invoker = on)
as
select
  p.id,
  p.nickname,
  p.avatar_preset,
  p.accent_color,
  p.bio,
  p.interests,

  -- Età: solo se show_age
  case when p.show_age
    then extract(year from age(p.birth_date))::int
  end                                               as age,

  -- Data di nascita: solo se show_birth_date
  case when p.show_birth_date then p.birth_date end as birth_date,

  -- Identità: solo se show_identity
  case when p.show_identity then p.identity_category end as identity_category,

  -- Orientamento: solo se show_orientation
  case when p.show_orientation then p.orientations end as orientations,

  -- Città (3 campi insieme, tutti o nessuno)
  case when p.show_city then p.city          end as city,
  case when p.show_city then p.city_province end as city_province,
  case when p.show_city then p.city_region   end as city_region,

  -- Pronomi: solo se show_pronouns
  case when p.show_pronouns then p.pronouns end as pronouns,

  -- Intenti: solo se show_intents
  case when p.show_intents then p.intents end as intents,

  -- Stato relazionale: solo se show_relationship (2 campi insieme)
  case when p.show_relationship then p.relationship_status end as relationship_status,
  case when p.show_relationship then p.relationship_type   end as relationship_type,

  -- Stile di vita: ciascuno con il proprio flag
  case when p.show_diet     then p.diet     end as diet,
  case when p.show_religion then p.religion end as religion,
  case when p.show_politics then p.politics end as politics,
  case when p.show_smoking  then p.smoking  end as smoking,
  case when p.show_sport    then p.sport    end as sport,

  -- Zodiaco: solo se show_zodiac, calcolato da birth_date
  case when p.show_zodiac
    then public.zodiac_from_date(p.birth_date)
  end                                               as zodiac,

  -- Flag calcolato: l'utente sta guardando il proprio profilo
  (p.id = auth.uid())                               as is_self

from public.profiles p;

comment on view public.public_profiles is
  'Profili pubblici con masking dei campi basato sui flag show_*. '
  'Non espone strato, dm_filter, dati di moderazione.';

-- ------------------------------------------------------------
-- search_users
-- RPC per la ricerca utenti (search.ts). Rispetta is_searchable,
-- esclude blocchi bidirezionali, applica i filtri passati.
-- Security definer per accedere alla tabella user_blocks senza
-- esporre la simmetria del blocco (chi ha bloccato chi).
-- ------------------------------------------------------------
create or replace function public.search_users(
  p_nickname     text    default null,
  p_age_min      int     default null,
  p_age_max      int     default null,
  p_regions      text[]  default null,
  p_city         text    default null,
  p_identities   text[]  default null,
  p_orientations text[]  default null,
  p_interests    text[]  default null,
  p_intents      text[]  default null,
  p_smoking      text[]  default null,
  p_sport        text[]  default null,
  p_zodiac       text[]  default null,
  p_limit        int     default 10,
  p_offset       int     default 0
)
returns table (
  id               uuid,
  nickname         text,
  avatar_preset    text,
  accent_color     text,
  age              int,
  city             text,
  city_region      text,
  interests        text[],
  common_interests text[],
  match_count      int
)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_caller   uuid    := auth.uid();
  v_caller_interests text[] := '{}';
begin
  -- Carica gli interessi del chiamante per calcolare common_interests
  select coalesce(interests, '{}')
  into   v_caller_interests
  from   public.profiles
  where  id = v_caller;

  return query
  select
    p.id,
    p.nickname,
    p.avatar_preset,
    p.accent_color,
    case when p.show_age then extract(year from age(p.birth_date))::int end as age,
    case when p.show_city then p.city         end as city,
    case when p.show_city then p.city_region  end as city_region,
    p.interests,
    -- Interessi in comune con chi cerca
    array(
      select unnest(p.interests)
      intersect
      select unnest(v_caller_interests)
    ) as common_interests,
    -- Conteggio per ordinamento
    (select count(*)::int from (
      select unnest(p.interests)
      intersect
      select unnest(v_caller_interests)
    ) _t) as match_count

  from public.profiles p
  where
    p.is_searchable = true
    and p.id <> v_caller
    -- Esclude blocchi in entrambe le direzioni
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = v_caller and b.blocked_id = p.id)
         or (b.blocker_id = p.id    and b.blocked_id = v_caller)
    )
    and (p_nickname    is null or p.nickname ilike '%' || p_nickname || '%')
    and (p_age_min     is null or (p.show_age and extract(year from age(p.birth_date))::int >= p_age_min))
    and (p_age_max     is null or (p.show_age and extract(year from age(p.birth_date))::int <= p_age_max))
    and (p_regions     is null or (p.show_city and p.city_region = any(p_regions)))
    and (p_city        is null or (p.show_city and p.city ilike '%' || p_city || '%'))
    and (p_identities  is null or (p.show_identity and p.identity_category = any(p_identities)))
    and (p_orientations is null or (p.show_orientation and p.orientations && p_orientations))
    and (p_interests   is null or p.interests && p_interests)
    and (p_intents     is null or (p.show_intents and p.intents && p_intents))
    and (p_smoking     is null or (p.show_smoking and p.smoking = any(p_smoking)))
    and (p_sport       is null or (p.show_sport and p.sport = any(p_sport)))
    and (p_zodiac      is null or (p.show_zodiac and public.zodiac_from_date(p.birth_date) = any(p_zodiac)))

  order by match_count desc, p.created_at desc
  limit  p_limit
  offset p_offset;
end;
$$;

revoke execute on function public.search_users from public, anon;
grant  execute on function public.search_users to authenticated;

revoke execute on function public.zodiac_from_date(date) from public, anon;
grant  execute on function public.zodiac_from_date(date) to authenticated;
