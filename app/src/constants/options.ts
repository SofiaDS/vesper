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

export const IDENTITY_OPTIONS: { value: IdentityCategory; label: string }[] = [
  { value: 'donna_cis', label: 'Donna cis' },
  { value: 'donna_trans', label: 'Donna trans' },
  { value: 'uomo_trans', label: 'Uomo trans' },
  { value: 'nonbinary', label: 'Non binary' },
  { value: 'genderqueer', label: 'Genderqueer' },
  { value: 'agender', label: 'Agender' },
  { value: 'bigender', label: 'Bigender' },
  { value: 'altro', label: 'Altro' },
  { value: 'preferisco_non_specificare', label: 'Preferisco non specificare' },
]

export const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: 'lesbica', label: 'Lesbica' },
  { value: 'bisessuale', label: 'Bisessuale' },
  { value: 'queer', label: 'Queer' },
  { value: 'pan', label: 'Pan' },
  { value: 'asessuale', label: 'Asessuale' },
  { value: 'polisessuale', label: 'Polisessuale' },
  { value: 'demisessuale', label: 'Demisessuale' },
  { value: 'bicurious', label: 'Bi-curious' },
  { value: 'questioning', label: 'Questioning' },
  { value: 'non_etichettata', label: 'Non etichettatə' },
  { value: 'altro', label: 'Altro' },
  { value: 'preferisco_non_dire', label: 'Preferisco non dire' },
]

export const INTENT_OPTIONS: { value: Intent; label: string }[] = [
  { value: 'monogamia', label: 'relazione monogama' },
  { value: 'poliamore', label: 'relazione poliamorosa' },
  { value: 'mge', label: 'relazione non monogama etica' },
  { value: 'relazione_aperta', label: 'relazione aperta' },
  { value: 'relazione_platonica', label: 'relazione platonica' },
  { value: 'altro', label: 'altro' },
  { value: 'amicizia', label: 'Amicizia' },
  { value: 'networking', label: 'Networking' },
  { value: 'confronto', label: 'Confronto' },
  { value: 'solo_chattare', label: 'Solo chattare' },
  { value: 'supporto', label: 'supporto' },
]

export const RELATIONSHIP_STATUS_OPTIONS: {
  value: RelationshipStatus
  label: string
}[] = [
  { value: 'single', label: 'Single' },
  { value: 'in_relazione', label: 'In una relazione' },
  { value: 'non_dico', label: 'Preferisco non specificare' },
]

export const RELATIONSHIP_TYPE_OPTIONS: {
  value: RelationshipType
  label: string
}[] = [
  { value: 'monogama', label: 'Monogama' },
  { value: 'poliamorosa', label: 'Poliamorosa' },
  { value: 'aperta', label: 'Aperta' },
  { value: 'nme', label: 'Non monogamia etica' },
  { value: 'complicato', label: 'Complicato' },
  { value: 'non_so_ancora', label: 'Non so ancora' },
]

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'italiano', label: 'Italiano' },
  { value: 'inglese', label: 'Inglese' },
  { value: 'francese', label: 'Francese' },
  { value: 'tedesco', label: 'Tedesco' },
  { value: 'lis', label: 'Lingua dei segni italiana (LIS)' },
]

export const CHILDREN_OPTIONS: { value: ChildrenStatus; label: string }[] = [
  { value: 'ho_figli', label: 'Ho figli' },
  { value: 'non_ho_figli', label: 'Non ho figli' },
  { value: 'vorrei_figli', label: 'Vorrei averne' },
  { value: 'non_vorrei_figli', label: 'Non ne vorrei' },
  { value: 'non_so', label: 'Non so ancora'}
]

export const DIET_OPTIONS: { value: Diet; label: string }[] = [
  { value: 'vegetariana', label: 'Vegetariana' },
  { value: 'vegana', label: 'Vegana' },
  { value: 'flexitariana', label: 'Flexitariana' },
  { value: 'onnivora', label: 'Onnivora' },
  { value: 'onnivora_consapevole', label: 'Onnivora consapevole' },
  { value: 'altro', label: 'Altro' },
]

export const RELIGION_OPTIONS: { value: Religion; label: string }[] = [
  { value: 'cattolicesimo', label: 'Cattolicesimo' },
  { value: 'islam', label: 'Islam' },
  { value: 'ebraismo', label: 'Ebraismo' },
  { value: 'buddismo', label: 'Buddismo' },
  { value: 'induismo', label: 'Induismo' },
  { value: 'spiritualita', label: 'Spiritualità personale' },
  { value: 'ateismo', label: 'Ateismo' },
  { value: 'agnosticismo', label: 'Agnosticismo' },
  { value: 'altro', label: 'Altro' },
]

export const POLITICS_OPTIONS: { value: Politics; label: string }[] = [
  { value: 'progressista', label: 'Progressista' },
  { value: 'conservatrice', label: 'Conservatore' },
  { value: 'moderata', label: 'Moderato' },
  { value: 'libertaria', label: 'Libertario' },
  { value: 'anarchica', label: 'Anarchico' },
  { value: 'socialista', label: 'Socialista' },
  { value: 'comunista', label: 'Comunista' },
  { value: 'altro', label: 'Altro' },
]

export const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: 'preferisco_non_specificare', label: 'Preferisco non specificare' },
  { value: 'licenza_media', label: 'Licenza di scuola secondaria di primo grado (Licenza media)' },
  { value: 'diploma', label: 'Diploma di istruzione secondaria di secondo grado' },
  { value: 'qualifica_professionale', label: 'Qualifica di formazione professionale' },
  { value: 'its', label: 'Diploma tecnico superiore (ITS)' },
  { value: 'laurea_triennale', label: 'Laurea triennale' },
  { value: 'laurea_magistrale', label: 'Laurea magistrale / Vecchio ordinamento' },
  { value: 'master', label: 'Master post-laurea' },
  { value: 'dottorato', label: 'Dottorato di ricerca (PhD)' },
  { value: 'accademia', label: 'Percorso di studi artistici / Accademia' },
  { value: 'autodidatta', label: 'Autodidatta / Formazione sul campo' },
  { value: 'altro', label: 'Altro' },
]

export const SMOKING_OPTIONS: { value: Smoking; label: string }[] = [
  { value: 'fuma', label: 'Fumo regolarmente' },
  { value: 'occasionalmente', label: 'Fumo occasionalmente' },
  { value: 'no', label: 'Non fumo' },
]

export const SPORT_OPTIONS: { value: Sport; label: string }[] = [
  { value: 'regolarmente', label: 'Regolare' },
  { value: 'saltuariamente', label: 'Saltuaria' },
  { value: 'no', label: 'No' },
]

export const DM_FILTER_OPTIONS: { value: DmFilter; label: string }[] = [
  { value: 'tuttə', label: 'tuttə' },
  { value: 'citta', label: 'Dalla mia città' },
  { value: 'intenti', label: 'Con i miei stessi intenti' },
  { value: 'verificatə', label: 'Solo verificatə' },
]
