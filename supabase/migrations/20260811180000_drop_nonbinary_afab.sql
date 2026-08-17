-- Rimuove 'nonbinary_afab' dalle categorie di identità ammesse (11 ago 2026).
--
-- Era rimasto solo nel vincolo del database: la UI ha sostituito da tempo la
-- voce "Persona non-binary AFAB" con "Non binary" generico, quindi nessuno
-- poteva più selezionarlo. Verificato prima di applicare: 0 profili su 3 lo
-- usavano, quindi la ri-validazione del CHECK non ha righe da rifiutare.
--
-- Resta aperto un punto di policy che questa migration NON risolve:
-- `utenti_e_identita.md` sezione 2 punto 3 prevede ancora un disclaimer
-- specifico "per FTM e non-binary AFAB", che ora si riferisce a una categoria
-- non più selezionabile.
alter table public.profiles
  drop constraint if exists profiles_identity_category_check;

alter table public.profiles
  add constraint profiles_identity_category_check
  check (identity_category = any (array[
    'donna_cis',
    'donna_trans',
    'uomo_trans',
    'nonbinary',
    'genderqueer',
    'agender',
    'bigender',
    'intersex',
    'altro',
    'preferisco_non_specificare'
  ]::text[]));
