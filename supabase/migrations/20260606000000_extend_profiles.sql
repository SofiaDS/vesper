-- ============================================================
-- Vesper — Migration: colonne mancanti su profiles
-- Dipende da: 20260604120000_fase1_schema.sql
-- Aggiunge le colonne presenti nel tipo Profile (core.ts) ma assenti
-- nella migration iniziale. Usa ADD COLUMN IF NOT EXISTS per essere
-- idempotente su DB già aggiornati.
-- ============================================================

-- Città strutturata (da tabella comuni)
alter table public.profiles
  add column if not exists city_province text,
  add column if not exists city_region   text;

-- Campi opzionali del profilo
alter table public.profiles
  add column if not exists pronouns text
    check (pronouns is null or char_length(pronouns) <= 50);

alter table public.profiles
  add column if not exists interests text[] not null default '{}'::text[];

alter table public.profiles
  add column if not exists intents text[] not null default '{}'::text[]
    check (intents <@ array[
      'amicizia','dating','relazione','networking','confronto','solo_chattare',
      'monogamia','poliamore','mge','relazione_aperta','relazione_platonica',
      'altro','supporto'
    ]::text[]);

alter table public.profiles
  add column if not exists relationship_status text
    check (relationship_status in ('single','in_relazione','non_dico'));

alter table public.profiles
  add column if not exists relationship_type text
    check (relationship_type in (
      'monogama','poliamorosa','aperta','nme','complicato','preferisco_non_specificare'
    ));

alter table public.profiles
  add column if not exists diet text
    check (diet in (
      'vegetariana','vegana','flexitariana','onnivora','onnivora_consapevole','altro'
    ));

alter table public.profiles
  add column if not exists religion text
    check (religion in (
      'cattolicesimo','islam','ebraismo','buddismo','induismo',
      'spiritualita','ateismo','agnosticismo','altro'
    ));

alter table public.profiles
  add column if not exists politics text
    check (politics in (
      'progressista','conservatrice','moderata','libertaria',
      'anarchica','socialista','comunista','altro'
    ));

alter table public.profiles
  add column if not exists smoking text
    check (smoking in ('fuma','no','occasionalmente','non_dico'));

alter table public.profiles
  add column if not exists sport text
    check (sport in ('regolarmente','saltuariamente','no','non_dico'));

-- Filtro DM in ricezione (permessi_e_strati.md §1.1)
alter table public.profiles
  add column if not exists dm_filter text not null default 'tutte'
    check (dm_filter in ('tutte','citta','intenti','verificatə'));

-- Visibilità dei campi: ogni show_* controlla se il campo appare in public_profiles.
-- Defaults: show_identity e show_orientation = true (campi centrali della piattaforma);
-- tutti gli altri = false (privacy by default).
alter table public.profiles
  add column if not exists show_age          boolean not null default false,
  add column if not exists show_birth_date   boolean not null default false,
  add column if not exists show_identity     boolean not null default true,
  add column if not exists show_orientation  boolean not null default true,
  add column if not exists show_city         boolean not null default false,
  add column if not exists show_pronouns     boolean not null default true,
  add column if not exists show_intents      boolean not null default false,
  add column if not exists show_relationship boolean not null default false,
  add column if not exists show_diet         boolean not null default false,
  add column if not exists show_religion     boolean not null default false,
  add column if not exists show_politics     boolean not null default false,
  add column if not exists show_smoking      boolean not null default false,
  add column if not exists show_sport        boolean not null default false,
  add column if not exists show_zodiac       boolean not null default false,
  add column if not exists show_online       boolean not null default true;

comment on column public.profiles.dm_filter      is 'Chi può inviarmi richieste DM (permessi_e_strati.md §1.1).';
comment on column public.profiles.show_identity  is 'Mostra identità di genere in public_profiles.';
comment on column public.profiles.show_online    is 'Mostra indicatore presenza online (futuro).';
