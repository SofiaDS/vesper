-- Riallinea i CHECK di public.profiles alle liste di app/src/constants/options.ts.
--
-- Perché una migration nuova e non una correzione di 20260606000000_extend_profiles:
-- quel file usa `add column if not exists ... check (...)`. Le colonne
-- intents/orientations esistevano già quando è stato applicato, quindi l'intera
-- clausola — CHECK compreso — è stata saltata. Il file contiene la lista lunga
-- di intents fin dal commit originale del 6 giu 2026, ma il DB non l'ha mai
-- presa: il repo diceva una cosa e il DB ne aveva un'altra da due mesi e mezzo.
-- Qui si usa drop constraint + add constraint, che si applica sempre.
--
-- Verificato il 20 ago 2026 (3 profili in tutto): 0 righe usano i valori
-- rimossi (dating, relazione, pansessuale, preferisco_non_specificare su
-- relationship_type, non_dico su smoking/sport). Nessuna migrazione dati.

-- 1) intents — BUG LIVE. Il CHECK in produzione ammetteva solo
--    ['amicizia','dating','relazione','networking','confronto','solo_chattare'],
--    quindi 7 delle 11 opzioni di "Cosa cerchi" (monogamia, poliamore, mge,
--    relazione_aperta, relazione_platonica, supporto, altro) facevano fallire
--    il salvataggio del profilo con un errore 23514. Rimossi nello stesso
--    passaggio i legacy 'dating' e 'relazione', che la UI non ha mai offerto.
alter table public.profiles drop constraint if exists profiles_intents_check;
alter table public.profiles add constraint profiles_intents_check check (
  intents <@ array[
    'monogamia','poliamore','mge','relazione_aperta','relazione_platonica',
    'amicizia','networking','confronto','solo_chattare','supporto','altro'
  ]::text[]
);

-- 2) orientations — via 'pansessuale', che non compare né in
--    ORIENTATION_OPTIONS né in alcun file del repo: residuo di una colonna
--    creata fuori da git. La UI usa 'pan'.
alter table public.profiles drop constraint if exists profiles_orientations_check;
alter table public.profiles add constraint profiles_orientations_check check (
  orientations <@ array[
    'lesbica','bisessuale','queer','pan','asessuale','polisessuale',
    'demisessuale','bicurious','questioning','non_etichettata',
    'altro','preferisco_non_dire'
  ]::text[]
);

-- 3) relationship_type — via 'preferisco_non_specificare': mai offerto da
--    RELATIONSHIP_TYPE_OPTIONS ed è ridondante, la stessa intenzione si
--    esprime già con relationship_status = 'non_dico'.
alter table public.profiles drop constraint if exists profiles_relationship_type_check;
alter table public.profiles add constraint profiles_relationship_type_check check (
  relationship_type is null or relationship_type = any (array[
    'monogama','poliamorosa','aperta','nme','complicato','non_so_ancora'
  ]::text[])
);

-- 4) smoking / sport — via 'non_dico': mai offerto dal form profilo. Il campo
--    lasciato vuoto insieme al flag show_smoking/show_sport copre già
--    "preferisco non dire", esattamente come per dieta, religione, politica
--    e figli, che infatti non hanno un valore di opt-out esplicito.
alter table public.profiles drop constraint if exists profiles_smoking_check;
alter table public.profiles add constraint profiles_smoking_check check (
  smoking is null or smoking = any (array['fuma','no','occasionalmente']::text[])
);

alter table public.profiles drop constraint if exists profiles_sport_check;
alter table public.profiles add constraint profiles_sport_check check (
  sport is null or sport = any (array['regolarmente','saltuariamente','no']::text[])
);
