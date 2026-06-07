-- ============================================================
-- Vesper — Migration: rate limiting ricerca + search_log
-- P20: 20 ricerche/ora, 100/giorno (ricerca_utenti.md §8)
-- P21: search_log per anti-stalking nickname (retention 30gg)
-- ============================================================

create table if not exists public.search_log (
  id               bigint generated always as identity primary key,
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  queried_nickname text,
  searched_at      timestamptz not null default now()
);

create index search_log_user_time_idx
  on public.search_log (user_id, searched_at);

create index search_log_nick_idx
  on public.search_log (user_id, lower(queried_nickname), searched_at)
  where queried_nickname is not null;

comment on table public.search_log is
  'Log ricerche utenti: rate limiting (20/h, 100/d) e anti-stalking nickname. Retention 30gg.';

alter table public.search_log enable row level security;

create policy "search_log_select_staff" on public.search_log
  for select to authenticated
  using ((select public.is_staff()));

-- search_users: ora VOLATILE (logging + rate limit write)
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
  order by match_count desc, p.created_at desc
  limit p_limit offset p_offset;
end;
$$;

revoke execute on function public.search_users(text,integer,integer,text[],text,text[],text[],text[],text[],text[],text[],text[],integer,integer) from public, anon;
grant  execute on function public.search_users(text,integer,integer,text[],text,text[],text[],text[],text[],text[],text[],text[],integer,integer) to authenticated;

create or replace function public.count_nickname_searches(p_nickname text)
returns int
language sql
security definer
set search_path = ''
stable
as $$
  select count(*)::int
  from public.search_log
  where user_id = auth.uid()
    and lower(queried_nickname) = lower(p_nickname)
    and searched_at >= now() - interval '7 days';
$$;

revoke execute on function public.count_nickname_searches(text) from public, anon;
grant  execute on function public.count_nickname_searches(text) to authenticated;

-- Estende run_gdpr_cleanup con cleanup search_log > 30 giorni
create or replace function public.run_gdpr_cleanup()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rep_deleted      int;
  v_vouch_expired    int;
  v_messages_deleted int;
  v_search_deleted   int;
begin
  delete from public.reputation_events where created_at < now() - interval '12 months';
  get diagnostics v_rep_deleted = row_count;

  update public.vouch_requests set status = 'expired'
  where status = 'pending' and expires_at < now();
  get diagnostics v_vouch_expired = row_count;

  delete from public.messages where created_at < now() - interval '24 months';
  get diagnostics v_messages_deleted = row_count;

  delete from public.search_log where searched_at < now() - interval '30 days';
  get diagnostics v_search_deleted = row_count;

  return jsonb_build_object(
    'reputation_events_deleted', v_rep_deleted,
    'vouch_requests_expired',    v_vouch_expired,
    'chatroom_messages_deleted', v_messages_deleted,
    'search_log_deleted',        v_search_deleted
  );
end;
$$;

revoke execute on function public.run_gdpr_cleanup() from public, anon, authenticated;
grant  execute on function public.run_gdpr_cleanup() to service_role;
