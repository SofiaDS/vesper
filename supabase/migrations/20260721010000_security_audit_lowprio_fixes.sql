-- ============================================================
-- Vesper — Migration: fix di sicurezza a bassa priorità
-- Chiude i finding rimasti dall'audit del 21 lug 2026.
--   (#1) search_path fissato su text_array_items_valid
--   (#2) revoke execute da public/anon su 3 SECURITY DEFINER function
--   (#4) escape dei metacaratteri regex sul nickname in room_unread_counts
-- Il finding #3 (HaveIBeenPwned) è solo un toggle nel Dashboard, nessun codice.
-- ============================================================

-- ------------------------------------------------------------
-- #1 — function_search_path_mutable su text_array_items_valid
-- Era l'unica funzione del progetto senza search_path fissato.
-- IMMUTABLE e non SECURITY DEFINER: rischio minimo, ma chiude il
-- warning dell'advisor. Non referenzia oggetti applicativi (solo
-- unnest/bool_and da pg_catalog), quindi search_path='' è sicuro.
-- ------------------------------------------------------------
create or replace function public.text_array_items_valid(items text[], max_len int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    (select bool_and(char_length(x) between 1 and max_len) from unnest(items) as x),
    true
  )
$$;

-- ------------------------------------------------------------
-- #2 — Difesa in profondità: nessuna di queste SECURITY DEFINER
-- function deve essere invocabile da `anon`. Hanno già controlli
-- interni su auth.uid()/is_staff(), ma le grant di default a PUBLIC
-- possono propagarsi ad anon: le revochiamo esplicitamente e
-- concediamo solo ad authenticated.
-- ------------------------------------------------------------
revoke execute on function public.respond_to_vouch(uuid, boolean) from public, anon;
grant  execute on function public.respond_to_vouch(uuid, boolean) to authenticated;

revoke execute on function public.record_failed_vouch(uuid) from public, anon;
grant  execute on function public.record_failed_vouch(uuid) to authenticated;

revoke execute on function public.is_dm_participant(uuid) from public, anon;
grant  execute on function public.is_dm_participant(uuid) to authenticated;

-- ------------------------------------------------------------
-- #4 — room_unread_counts: robustezza del rilevamento @menzioni.
-- Il nickname ha solo un CHECK di lunghezza (3-24), NON di set di
-- caratteri: metacaratteri regex ( ( [ \ . * + ecc. ) interpolati
-- direttamente potevano far fallire/rallentare la propria query di
-- conteggio (self-DoS). Ora il nickname viene escapato prima di
-- entrare nel pattern, così è trattato come testo letterale.
-- Unica differenza rispetto alla versione precedente.
-- ------------------------------------------------------------
create or replace function public.room_unread_counts()
returns table (chatroom_id uuid, unread int, has_mention boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select m.chatroom_id,
         count(*)::int as unread,
         bool_or(
           m.body ~* (
             '@'
             || regexp_replace(me.nickname, '([\.\^\$\*\+\?\(\)\[\]\{\}\|\\])', '\\\1', 'g')
             || '($|[^a-zA-Z0-9_])'
           )
         ) as has_mention
  from   public.chat_membership cm
  join   public.messages m on m.chatroom_id = cm.chatroom_id
  -- left join (non cross): se manca il profilo/nickname, me.nickname è NULL e
  -- si disattiva solo il rilevamento menzioni, non l'intero conteggio.
  left join lateral (
           select nickname from public.profiles where id = (select auth.uid())
         ) me on true
  left join public.read_markers rm
         on rm.user_id = (select auth.uid())
        and rm.scope = 'room'
        and rm.scope_id = cm.chatroom_id
  where  cm.user_id = (select auth.uid())
    and  m.sender_id <> (select auth.uid())
    and  m.created_at > coalesce(rm.last_read_at, '-infinity'::timestamptz)
  group by m.chatroom_id;
$$;

revoke execute on function public.room_unread_counts() from public, anon;
grant  execute on function public.room_unread_counts() to authenticated;
