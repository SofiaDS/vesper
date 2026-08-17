import type {
  IdentityCategory,
  Orientation,
  Intent,
  RelationshipStatus,
  RelationshipType,
  Language,
  ChildrenStatus,
  Diet,
  Religion,
  Politics,
  EducationLevel,
  Smoking,
  Sport,
  DmFilter,
} from '../types/enums'

// Etichette tutte in minuscolo, come in labels.ts (normalizzate l'11 ago 2026).
// Uniche eccezioni: acronimi (LIS, ITS, PhD) e nomi propri (Islam).
// ATTENZIONE: IDENTITY_OPTIONS/ORIENTATION_OPTIONS ripetono le stesse stringhe
// di IDENTITY_LABELS/ORIENTATION_LABELS in labels.ts — se ne cambi una, cambia
// anche l'altra, altrimenti il menu di scelta e il profilo mostrano parole
// diverse per lo stesso valore.

export const IDENTITY_OPTIONS: { value: IdentityCategory; label: string }[] = [
  { value: 'donna_cis', label: 'donna cis' },
  { value: 'donna_trans', label: 'donna trans' },
  { value: 'uomo_trans', label: 'uomo trans' },
  { value: 'nonbinary', label: 'non binary' },
  { value: 'genderqueer', label: 'genderqueer' },
  { value: 'agender', label: 'agender' },
  { value: 'bigender', label: 'bigender' },
  { value: 'intersex', label: 'intersex' },
  { value: 'altro', label: 'altro' },
  { value: 'preferisco_non_specificare', label: 'preferisco non specificare' },
]

export const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: 'lesbica', label: 'lesbica' },
  { value: 'bisessuale', label: 'bisessuale' },
  { value: 'queer', label: 'queer' },
  { value: 'pan', label: 'pan' },
  { value: 'asessuale', label: 'asessuale' },
  { value: 'polisessuale', label: 'polisessuale' },
  { value: 'demisessuale', label: 'demisessuale' },
  { value: 'bicurious', label: 'bi-curious' },
  { value: 'questioning', label: 'questioning' },
  { value: 'non_etichettata', label: 'non etichettatə' },
  { value: 'altro', label: 'altro' },
  { value: 'preferisco_non_dire', label: 'preferisco non dire' },
]

export const INTENT_OPTIONS: { value: Intent; label: string }[] = [
  { value: 'monogamia', label: 'relazione monogama' },
  { value: 'poliamore', label: 'relazione poliamorosa' },
  { value: 'mge', label: 'relazione non monogama etica' },
  { value: 'relazione_aperta', label: 'relazione aperta' },
  { value: 'relazione_platonica', label: 'relazione platonica' },
  { value: 'altro', label: 'altro' },
  { value: 'amicizia', label: 'amicizia' },
  { value: 'networking', label: 'networking' },
  { value: 'confronto', label: 'confronto' },
  { value: 'solo_chattare', label: 'solo chattare' },
  { value: 'supporto', label: 'supporto' },
]

export const RELATIONSHIP_STATUS_OPTIONS: {
  value: RelationshipStatus
  label: string
}[] = [
  { value: 'single', label: 'single' },
  { value: 'in_relazione', label: 'in una relazione' },
  { value: 'non_dico', label: 'preferisco non specificare' },
]

export const RELATIONSHIP_TYPE_OPTIONS: {
  value: RelationshipType
  label: string
}[] = [
  { value: 'monogama', label: 'monogama' },
  { value: 'poliamorosa', label: 'poliamorosa' },
  { value: 'aperta', label: 'aperta' },
  { value: 'nme', label: 'non monogamia etica' },
  { value: 'complicato', label: 'complicato' },
  { value: 'non_so_ancora', label: 'non so ancora' },
]

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'italiano', label: 'italiano' },
  { value: 'inglese', label: 'inglese' },
  { value: 'francese', label: 'francese' },
  { value: 'tedesco', label: 'tedesco' },
  { value: 'lis', label: 'lingua dei segni italiana (LIS)' },
]

export const CHILDREN_OPTIONS: { value: ChildrenStatus; label: string }[] = [
  { value: 'ho_figli', label: 'ho figli' },
  { value: 'non_ho_figli', label: 'non ho figli' },
  { value: 'vorrei_figli', label: 'vorrei averne' },
  { value: 'non_vorrei_figli', label: 'non ne vorrei' },
  { value: 'non_so', label: 'non so ancora' },
]

export const DIET_OPTIONS: { value: Diet; label: string }[] = [
  { value: 'vegetariana', label: 'vegetariana' },
  { value: 'vegana', label: 'vegana' },
  { value: 'flexitariana', label: 'flexitariana' },
  { value: 'onnivora', label: 'onnivora' },
  { value: 'onnivora_consapevole', label: 'onnivora consapevole' },
  { value: 'altro', label: 'altro' },
]

export const RELIGION_OPTIONS: { value: Religion; label: string }[] = [
  { value: 'cattolicesimo', label: 'cattolicesimo' },
  // "Islam" resta maiuscolo: è un nome proprio, non un sostantivo comune come
  // gli altri della lista (cattolicesimo, ebraismo, buddismo…).
  { value: 'islam', label: 'Islam' },
  { value: 'ebraismo', label: 'ebraismo' },
  { value: 'buddismo', label: 'buddismo' },
  { value: 'induismo', label: 'induismo' },
  { value: 'spiritualita', label: 'spiritualità personale' },
  { value: 'ateismo', label: 'ateismo' },
  { value: 'agnosticismo', label: 'agnosticismo' },
  { value: 'altro', label: 'altro' },
]

export const POLITICS_OPTIONS: { value: Politics; label: string }[] = [
  { value: 'progressista', label: 'progressista' },
  { value: 'conservatrice', label: 'conservatore' },
  { value: 'moderata', label: 'moderato' },
  { value: 'libertaria', label: 'libertario' },
  { value: 'anarchica', label: 'anarchico' },
  { value: 'socialista', label: 'socialista' },
  { value: 'comunista', label: 'comunista' },
  { value: 'altro', label: 'altro' },
]

export const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: 'preferisco_non_specificare', label: 'preferisco non specificare' },
  { value: 'licenza_media', label: 'licenza di scuola secondaria di primo grado (licenza media)' },
  { value: 'diploma', label: 'diploma di istruzione secondaria di secondo grado' },
  { value: 'qualifica_professionale', label: 'qualifica di formazione professionale' },
  { value: 'its', label: 'diploma tecnico superiore (ITS)' },
  { value: 'laurea_triennale', label: 'laurea triennale' },
  { value: 'laurea_magistrale', label: 'laurea magistrale / vecchio ordinamento' },
  { value: 'master', label: 'master post-laurea' },
  { value: 'dottorato', label: 'dottorato di ricerca (PhD)' },
  { value: 'accademia', label: 'percorso di studi artistici / accademia' },
  { value: 'autodidatta', label: 'autodidatta / formazione sul campo' },
  { value: 'altro', label: 'altro' },
]

export const SMOKING_OPTIONS: { value: Smoking; label: string }[] = [
  { value: 'fuma', label: 'fumo regolarmente' },
  { value: 'occasionalmente', label: 'fumo occasionalmente' },
  { value: 'no', label: 'non fumo' },
]

export const SPORT_OPTIONS: { value: Sport; label: string }[] = [
  { value: 'regolarmente', label: 'regolare' },
  { value: 'saltuariamente', label: 'saltuaria' },
  { value: 'no', label: 'no' },
]

export const DM_FILTER_OPTIONS: { value: DmFilter; label: string }[] = [
  { value: 'tuttə', label: 'tuttə' },
  { value: 'citta', label: 'dalla mia città' },
  { value: 'intenti', label: 'con i miei stessi intenti' },
  { value: 'verificatə', label: 'solo verificatə' },
]
