-- ============================================================
-- Vesper — Migration: lingue parlate personalizzate
-- Permette di aggiungere lingue non presenti nella lista
-- predefinita (LANGUAGE_OPTIONS), come già avviene per gli
-- interessi (profiles.interests, testo libero senza check).
-- ============================================================

alter table public.profiles
  drop constraint if exists profiles_languages_check;

-- Le CHECK constraint non possono contenere subquery: la validazione
-- per-elemento delle voci libere è incapsulata in questa funzione helper.
create or replace function public.text_array_items_valid(items text[], max_len int)
returns boolean
language sql
immutable
as $$
  select coalesce(
    (select bool_and(char_length(x) between 1 and max_len) from unnest(items) as x),
    true
  )
$$;

-- Vincoli "di buon senso" sulle voci libere: non vuote, lunghezza
-- contenuta (coerente con LANGUAGE_MAX_LEN lato client) e numero
-- massimo di lingue selezionabili (coerente con MAX_LANGUAGES).
alter table public.profiles
  add constraint profiles_languages_check
    check (
      cardinality(languages) <= 8
      and public.text_array_items_valid(languages, 30)
    );

comment on column public.profiles.languages is
  'Lingue parlate: opzioni predefinite (vedi LANGUAGE_OPTIONS) più voci libere aggiunte dall''utente.';
