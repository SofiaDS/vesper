-- ============================================================
-- Vesper — Migration: cancellazione conversazione DM
-- Permette a uno dei due partecipanti di cancellare una conversazione DM
-- (es. quando blocca l'altra persona e sceglie di cancellare anche la
-- chat). dm_messages ha "on delete cascade" su conversation_id, quindi
-- la cancellazione rimuove anche i messaggi per entrambe le parti.
-- ============================================================

create policy "dm_conv_delete"
  on public.dm_conversations for delete
  to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());
