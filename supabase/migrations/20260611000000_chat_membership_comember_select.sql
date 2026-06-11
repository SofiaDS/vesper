-- ============================================================
-- Vesper — Migration: visibilità co-membri di chat_membership
-- La policy "membership_select_self" limita la SELECT alla sola riga
-- dell'utente corrente, quindi getRoomMembers() (usata per le menzioni
-- "@nickname" in chat) non vedeva mai gli altri membri della stanza.
-- Aggiunge una policy che permette di vedere le righe di chat_membership
-- delle stanze di cui si è anche membri (is_member è security definer,
-- quindi nessuna ricorsione RLS).
-- ============================================================

create policy "membership_select_comember"
  on public.chat_membership for select
  to authenticated
  using (public.is_member(chatroom_id));
