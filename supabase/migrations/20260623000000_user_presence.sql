-- ============================================================
-- Vesper — Migration: presenza online (approccio last_seen, scalabile)
-- Dipende da: 20260604120000_fase1_schema.sql (profiles),
--             20260606000000_extend_profiles.sql (profiles.show_online)
--
-- Indicatore "online" per i DM (Step 5) senza Realtime Presence (che non scala:
-- broadcast O(N²)). Ogni client fa un "heartbeat" periodico che aggiorna il
-- proprio last_seen; gli altri vedono "online" se il last_seen è recente E se
-- l'utente ha show_online = true.
--
-- PRIVACY: last_seen sta in una tabella separata (NON su profiles, che è
-- leggibile da chiunque via "profiles_select_authenticated USING (true)").
-- La riga è leggibile solo dalla diretta interessata; la presenza altrui passa
-- ESCLUSIVAMENTE dalla RPC users_online(), che filtra su show_online e non
-- restituisce mai il timestamp grezzo. Così l'attività di chi nasconde la
-- presenza non trapela, e gli altri ottengono solo un booleano (online sì/no).
-- ============================================================

-- 1. Tabella user_presence
create table public.user_presence (
  user_id      uuid        primary key references public.profiles(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

comment on table public.user_presence is
  'Heartbeat di presenza (last_seen) per utente. Letta dagli altri solo via users_online(), che applica show_online.';

alter table public.user_presence enable row level security;

-- RLS: ognuna vede/scrive solo la propria riga. La presenza altrui NON è
-- leggibile direttamente: si ottiene solo dalla RPC users_online (definer).
create policy "user_presence_select_self"
  on public.user_presence for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "user_presence_insert_self"
  on public.user_presence for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_presence_update_self"
  on public.user_presence for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 2. RPC touch_last_seen(): heartbeat del chiamante ("sono attiva adesso").
--    Chiamata dal client a intervalli mentre la scheda è in primo piano.
create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.user_presence (user_id, last_seen_at)
  values ((select auth.uid()), now())
  on conflict (user_id) do update set last_seen_at = now();
$$;

revoke execute on function public.touch_last_seen() from public, anon;
grant  execute on function public.touch_last_seen() to authenticated;

-- 3. RPC users_online(ids): fra gli id richiesti, restituisce solo quelli
--    ONLINE (last_seen entro la soglia) E con show_online = true. Non espone
--    il timestamp: solo l'elenco "online". Soglia 150s = tollera un heartbeat
--    saltato con cadenza client ~60s.
create or replace function public.users_online(p_ids uuid[])
returns table (user_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select up.user_id
  from   public.user_presence up
  join   public.profiles p on p.id = up.user_id
  where  up.user_id = any(p_ids)
    and  p.show_online = true
    and  up.last_seen_at > now() - interval '150 seconds';
$$;

revoke execute on function public.users_online(uuid[]) from public, anon;
grant  execute on function public.users_online(uuid[]) to authenticated;
