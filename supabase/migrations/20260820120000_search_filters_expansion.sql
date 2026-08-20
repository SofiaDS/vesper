-- Estende search_users con i filtri che finora esistevano come scelta di
-- profilo ma non erano cercabili: stato relazionale, tipo di relazione,
-- lingue, figli, alimentazione, religione, orientamento politico, animali.
--
-- Ogni nuovo filtro è protetto dal rispettivo flag show_*, che è `not null
-- default false`: si diventa filtrabili solo dopo aver acceso deliberatamente
-- il toggle "Mostra nel profilo". Stesso schema dei filtri già esistenti.
--
-- Restano volutamente fuori pronomi e education_institute: sono solo testo
-- libero, senza una lista canonica da mostrare come chip, e sono identificanti
-- (filtrare per un singolo ateneo restringe a pochissime persone).
--
-- Il RETURNS TABLE non cambia; cambia la lista dei parametri, quindi serve
-- drop + create (un `create or replace` creerebbe un secondo overload e
-- renderebbe ambigue le chiamate). Firma vecchia verificata su pg_proc il
-- 20 ago 2026, non desunta dai file di migration.

drop function if exists public.search_users(text,integer,integer,text[],text,text[],text[],text[],text[],text[],text[],text[],text[],integer,integer);

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
  p_rel_statuses  text[]    default null,
  p_rel_types     text[]    default null,
  p_languages     text[]    default null,
  p_children      text[]    default null,
  p_diets         text[]    default null,
  p_religions     text[]    default null,
  p_politics      text[]    default null,
  p_has_pets      boolean   default null,
  p_limit         integer   default 10,
  p_offset        integer   default 0
)
returns table(
  id               uuid,
  nickname         text,
  avatar_preset    text,
  age              integer,
  city             text,
  city_region      text,
  interests        text[],
  common_interests text[],
  match_count      integer
)
language plpgsql
security definer
set search_path to ''
as $function$
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
    p.id, p.nickname, p.avatar_preset,
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
    -- Nuovi filtri (20 ago 2026)
    and (p_rel_statuses is null or (p.show_relationship and p.relationship_status = any(p_rel_statuses)))
    and (p_rel_types    is null or (p.show_relationship and p.relationship_type = any(p_rel_types)))
    and (p_languages    is null or (p.show_languages and p.languages && p_languages))
    and (p_children     is null or (p.show_children and p.children_status = any(p_children)))
    and (p_diets        is null or (p.show_diet and p.diet = any(p_diets)))
    and (p_religions    is null or (p.show_religion and p.religion = any(p_religions)))
    and (p_politics     is null or (p.show_politics and p.politics = any(p_politics)))
    and (p_has_pets     is null or (p.show_pets and p.has_pets = p_has_pets))
  order by match_count desc, p.created_at desc
  limit p_limit offset p_offset;
end;
$function$;

-- drop+create azzera i grant: va riassegnato l'execute con la nuova firma.
grant execute on function public.search_users(text,integer,integer,text[],text,text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],boolean,integer,integer) to authenticated;
