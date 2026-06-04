-- Seed: chatroom di lancio.
-- 1 globale (Foyer) + 3 tematiche: Wander, Pulse, Cult (vedi chatroom.md).
-- Le descrizioni vengono mostrate sotto al titolo nella UI.
insert into public.chatrooms (slug, name, kind, description) values
  ('foyer',  'Foyer',  'foyer',    'La chat principale: saluti, presentazioni, discussione libera.'),
  ('wander', 'Wander', 'tematica', 'Viaggi, gite ed eventi da vivere insieme.'),
  ('pulse',  'Pulse',  'tematica', 'Fitness, sport e vita in movimento.'),
  ('cult',   'Cult',   'tematica', 'Arte, cultura, libri, film e musica.')
on conflict (slug) do nothing;
