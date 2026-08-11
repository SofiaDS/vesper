-- Aggiunge 'intersex' alle categorie di identità selezionabili (11 ago 2026).
--
-- Nota di merito: intersex è una caratteristica sessuale, non un'identità di
-- genere, e `identity_category` è a scelta singola — quindi chi la seleziona
-- rinuncia a dichiarare il proprio genere. Scelta consapevole per ora; se in
-- futuro diventasse un campo di profilo separato (con il suo `show_`, come
-- pronouns o languages), il valore va migrato lì.
--
-- `nonbinary_afab` resta nell'elenco anche se la UI non lo propone più
-- (IDENTITY_OPTIONS non lo contiene): toglierlo dal CHECK romperebbe eventuali
-- profili già salvati con quel valore.
alter table public.profiles
  drop constraint if exists profiles_identity_category_check;

alter table public.profiles
  add constraint profiles_identity_category_check
  check (identity_category = any (array[
    'donna_cis',
    'donna_trans',
    'uomo_trans',
    'nonbinary_afab',
    'nonbinary',
    'genderqueer',
    'agender',
    'bigender',
    'intersex',
    'altro',
    'preferisco_non_specificare'
  ]::text[]));
