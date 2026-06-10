-- ============================================================
-- Vesper — Migration: campo "Formazione" nel profilo
-- Aggiunge titolo di studio (lista chiusa) + nome libero di
-- scuola/università/ente, col proprio flag show_education
-- (privacy by default, stesso pattern di 20260608030000).
-- Ricrea public_profiles e search_users per esporre/filtrare
-- il nuovo campo.
-- ============================================================

alter table public.profiles
  add column if not exists education_level text
    check (education_level in (
      'preferisco_non_specificare','licenza_media','diploma',
      'qualifica_professionale','its','laurea_triennale',
      'laurea_magistrale','master','dottorato','accademia',
      'autodidatta','altro'
    )),
  add column if not exists education_institute text
    check (education_institute is null or char_length(education_institute) <= 100);

alter table public.profiles
  add column if not exists show_education boolean not null default false;

comment on column public.profiles.education_level     is 'Titolo di studio (lista chiusa, vedi EDUCATION_OPTIONS).';
comment on column public.profiles.education_institute is 'Nome libero di scuola/università/ente, opzionale.';

-- Ricrea la view (drop+create: i nuovi campi vanno aggiunti alla select,
-- non esiste ALTER VIEW ADD COLUMN). Stessa definizione di
-- 20260608030000_profile_extra_fields.sql con le 2 colonne in più.
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

  case when p.show_education then p.education_level     end as education_level,
  case when p.show_education then p.education_institute end as education_institute,

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

-- search_users: aggiunge p_educations (filtro su titolo di studio).
-- Il nuovo parametro si inserisce prima di p_limit/p_offset, quindi cambia
-- la firma: drop esplicito della versione precedente per evitare overload.
drop function if exists public.search_users(text,integer,integer,text[],text,text[],text[],text[],text[],text[],text[],text[],integer,integer);

create or replace function public.search_users(
  p_nickname      text      default null,
  p_age_min       integer   default null,
  p_age_max       integer   default null,
  p_regions       text[]    default null,
  p_city          text      default null,
  p_identities    text[]    default null,
  p_orientations  text[]    default null,
  p_interests     text[]    default null,
  p_intents       text[]    default null,
  p_smoking       text[]    default null,
  p_sport         text[]    default null,
  p_zodiac        text[]    default null,
  p_educations    text[]    default null,
  p_limit         integer   default 10,
  p_offset        integer   default 0
)
returns table(
  id               uuid,
  nickname         text,
  avatar_preset    text,
  accent_color     text,
  age              integer,
  city             text,
  city_region      text,
  interests        text[],
  common_interests text[],
  match_count      integer
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_caller            uuid   := auth.uid();
  v_caller_interests  text[] := '{}';
  v_count_hour        int;
  v_count_day         int;
begin
  select count(*) into v_count_hour
  from public.search_log
  where user_id = v_caller and searched_at >= now() - interval '1 hour';
  if v_count_hour >= 20 then
    raise exception 'SEARCH_RATE_LIMIT_EXCEEDED'
      using hint = 'Hai effettuato troppe ricerche. Riprova tra qualche ora.';
  end if;

  select count(*) into v_count_day
  from public.search_log
  where user_id = v_caller and searched_at >= now() - interval '24 hours';
  if v_count_day >= 100 then
    raise exception 'SEARCH_RATE_LIMIT_EXCEEDED'
      using hint = 'Hai effettuato troppe ricerche oggi. Riprova domani.';
  end if;

  insert into public.search_log (user_id, queried_nickname)
  values (v_caller, p_nickname);

  select coalesce(pr.interests, '{}')
  into   v_caller_interests
  from   public.profiles pr
  where  pr.id = v_caller;

  return query
  select
    p.id, p.nickname, p.avatar_preset, p.accent_color,
    case when p.show_age  then extract(year from age(p.birth_date))::int end,
    case when p.show_city then p.city        end,
    case when p.show_city then p.city_region end,
    p.interests,
    array(select unnest(p.interests) intersect select unnest(v_caller_interests)),
    (select count(*)::int from (
       select unnest(p.interests) intersect select unnest(v_caller_interests)
     ) _t)
  from public.profiles p
  where
    p.is_searchable = true and p.id <> v_caller
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = v_caller and b.blocked_id = p.id)
         or (b.blocker_id = p.id    and b.blocked_id = v_caller)
    )
    and (p_nickname     is null or p.nickname ilike '%' || p_nickname || '%')
    and (p_age_min      is null or (p.show_age and extract(year from age(p.birth_date))::int >= p_age_min))
    and (p_age_max      is null or (p.show_age and extract(year from age(p.birth_date))::int <= p_age_max))
    and (p_regions      is null or (p.show_city and p.city_region = any(p_regions)))
    and (p_city         is null or (p.show_city and p.city ilike '%' || p_city || '%'))
    and (p_identities   is null or (p.show_identity and p.identity_category = any(p_identities)))
    and (p_orientations is null or (p.show_orientation and p.orientations && p_orientations))
    and (p_interests    is null or p.interests && p_interests)
    and (p_intents      is null or (p.show_intents and p.intents && p_intents))
    and (p_smoking      is null or (p.show_smoking and p.smoking = any(p_smoking)))
    and (p_sport        is null or (p.show_sport and p.sport = any(p_sport)))
    and (p_zodiac       is null or (p.show_zodiac and public.zodiac_from_date(p.birth_date) = any(p_zodiac)))
    and (p_educations   is null or (p.show_education and p.education_level = any(p_educations)))
  order by match_count desc, p.created_at desc
  limit p_limit offset p_offset;
end;
$$;

revoke execute on function public.search_users(text,integer,integer,text[],text,text[],text[],text[],text[],text[],text[],text[],text[],integer,integer) from public, anon;
grant  execute on function public.search_users(text,integer,integer,text[],text,text[],text[],text[],text[],text[],text[],text[],text[],integer,integer) to authenticated;
