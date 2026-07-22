-- Allinea dm_filter allo schwa usato nel client/UI.
-- Il constraint e il default erano rimasti su 'tutte' (vecchio spelling),
-- mentre il client (constants/options.ts, types/enums.ts DmFilter) invia 'tuttə'.
-- Risultato: PATCH profiles con dm_filter='tuttə' -> 23514 check violation -> 400.
-- Qui: droppo il constraint, migro i dati esistenti, cambio il default, ricreo il constraint.

alter table public.profiles
  drop constraint if exists profiles_dm_filter_check;

update public.profiles
  set dm_filter = 'tuttə'
  where dm_filter = 'tutte';

alter table public.profiles
  alter column dm_filter set default 'tuttə';

alter table public.profiles
  add constraint profiles_dm_filter_check
  check (dm_filter in ('tuttə','citta','intenti','verificatə'));
