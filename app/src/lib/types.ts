// Tipi e costanti allineati allo schema DB (profilo esteso).
// Vedi profilo_utente.md e i CHECK constraint sulla tabella `profiles`.
// Le etichette UI usano la schwa (ə) per un linguaggio gender-neutral.

export type IdentityCategory =
  | 'donna_cis'
  | 'donna_trans'
  | 'uomo_trans'
  | 'nonbinary'
  | 'genderqueer'
  | 'agender'
  | 'bigender'
  | 'altro'
  | 'preferisco_non_specificare'

export type Orientation =
  | 'lesbica'
  | 'bisessuale'
  | 'queer'
  | 'pan'
  | 'asessuale'
  | 'polisessuale'
  | 'demisessuale'
  | 'bicurious'
  | 'questioning'
  | 'non_etichettata'
  | 'altro'
  | 'preferisco_non_dire'

export type Intent =
  | 'amicizia'
  | 'dating'
  | 'relazione'
  | 'networking'
  | 'confronto'
  | 'solo_chattare'
  | 'monogamia'
  | 'poliamore'
  | 'mge'
  | 'relazione_aperta'
  | 'relazione_platonica'
  | 'altro' 
  | 'supporto'

export type RelationshipStatus = 'single' | 'in_relazione' | 'non_dico'

export type RelationshipType =
  | 'monogama'
  | 'poliamorosa'
  | 'aperta'
  | 'nme'
  | 'complicato'
  | 'preferisco_non_specificare'

export type Diet =
  | 'vegetariana'
  | 'vegana'
  | 'flexitariana'
  | 'onnivora'
  | 'onnivora_consapevole'
  | 'altro'

export type Religion =
  | 'cattolicesimo'
  | 'islam'
  | 'ebraismo'
  | 'buddismo'
  | 'induismo'
  | 'spiritualita'
  | 'ateismo'
  | 'agnosticismo'
  | 'altro'

export type Politics =
  | 'progressista'
  | 'conservatrice'
  | 'moderata'
  | 'libertaria'
  | 'anarchica'
  | 'socialista'
  | 'comunista'
  | 'altro'

export type Smoking = 'fuma' | 'no' | 'occasionalmente' | 'non_dico'

export type Sport = 'regolarmente' | 'saltuariamente' | 'no' | 'non_dico'

export type DmFilter = 'tutte' | 'citta' | 'intenti' | 'verificate'

export type Zodiac =
  | 'ariete'
  | 'toro'
  | 'gemelli'
  | 'cancro'
  | 'leone'
  | 'vergine'
  | 'bilancia'
  | 'scorpione'
  | 'sagittario'
  | 'capricorno'
  | 'acquario'
  | 'pesci'

export interface Profile {
  id: string
  nickname: string
  identity_category: IdentityCategory
  orientations: Orientation[]
  birth_date: string | null
  avatar_preset: string | null
  accent_color: string | null
  bio: string | null
  city: string | null
  city_province: string | null
  city_region: string | null
  // Campi profilo estesi.
  pronouns: string | null
  interests: string[]
  intents: Intent[]
  relationship_status: RelationshipStatus | null
  relationship_type: RelationshipType | null
  diet: Diet | null
  religion: Religion | null
  politics: Politics | null
  smoking: Smoking | null
  sport: Sport | null
  dm_filter: DmFilter
  // Derivato dal DB (generated column): sola lettura.
  zodiac: Zodiac | null
  // Flag di visibilita' per-campo.
  show_age: boolean
  show_birth_date: boolean
  show_identity: boolean
  show_orientation: boolean
  show_city: boolean
  show_pronouns: boolean
  show_intents: boolean
  show_relationship: boolean
  show_diet: boolean
  show_religion: boolean
  show_politics: boolean
  show_smoking: boolean
  show_sport: boolean
  show_zodiac: boolean
  show_online: boolean
  // Sistema/altro.
  strato: number
  is_searchable: boolean
  created_at: string
  updated_at: string
}

// Limiti allineati ai CHECK del DB.
export const BIO_MAX = 300
export const PRONOUNS_MAX = 40
export const MAX_INTERESTS = 4

// --- Etichette in italiano per la UI (gender-neutral con schwa) ---

// Etichette complete (incluse quelle legacy) per la sola visualizzazione.
export const IDENTITY_LABELS: Record<IdentityCategory, string> = {
  donna_cis: 'Donna cis',
  donna_trans: 'Donna trans',
  uomo_trans: 'Uomo trans',
  nonbinary: 'Non binary',
  genderqueer: 'Genderqueer',
  agender: 'Agender',
  bigender: 'Bigender',
  altro: 'Altro',
  preferisco_non_specificare: 'Preferisco non specificare',
}

// Opzioni selezionabili (spec profilo definitivo).
export const IDENTITY_OPTIONS: { value: IdentityCategory; label: string }[] = [
  { value: 'donna_cis', label: 'Donna cis' },
  { value: 'donna_trans', label: 'Donna trans' },
  { value: 'uomo_trans', label: 'Uomo trans' },
  { value: 'nonbinary', label: 'Non binarie' },
  { value: 'genderqueer', label: 'Genderqueer' },
  { value: 'agender', label: 'Agender' },
  { value: 'bigender', label: 'Bigender' },
  { value: 'altro', label: 'Altro' },
  { value: 'preferisco_non_specificare', label: 'Preferisco non specificare' },
]

export const ORIENTATION_LABELS: Record<Orientation, string> = {
  lesbica: 'Lesbica',
  bisessuale: 'Bisessuale',
  queer: 'Queer',
  pan: 'Pan',
  asessuale: 'Asessuale',
  polisessuale: 'Polisessuale',
  demisessuale: 'Demisessuale',
  bicurious: 'Bi-curious',
  questioning: 'Questioning',
  non_etichettata: 'Non etichettatə',
  altro: 'Altro',
  preferisco_non_dire: 'Preferisco non dire',
}

export const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: 'lesbica', label: 'Lesbica' },
  { value: 'bisessuale', label: 'Bisessuale' },
  { value: 'queer', label: 'Queer'},
  { value: 'pan', label: 'Pan' },
  { value: 'asessuale', label: 'Asessuale' },
  { value: 'polisessuale', label: 'Polisessuale' },
  { value: 'demisessuale', label: 'Demisessuale' },
  { value: 'bicurious', label: 'Bi-curious' },
  { value: 'questioning', label: 'Questioning' },
  { value: 'non_etichettata', label: 'Non etichettatə' },
  { value: 'altro', label: 'Altro' },
  { value: 'preferisco_non_dire', label: 'Preferisco non dire'},
]

export const INTENT_OPTIONS: { value: Intent; label: string }[] = [
  { value: 'monogamia', label: 'relazione monogama'},
  { value: 'poliamore', label: 'relazione poliamorosa'},
  { value: 'mge', label: 'relazione non monogama etica'},
  { value: 'relazione_aperta', label: 'relazione aperta'},
  { value: 'relazione_platonica', label: 'relazione platonica'},
  { value: 'altro', label: 'altro'}, 
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
]

export const DIET_OPTIONS: { value: Diet; label: string }[] = [
  { value: 'vegetariana', label: 'Vegetarianə' },
  { value: 'vegana', label: 'Veganə' },
  { value: 'flexitariana', label: 'Flexitarianə' },
  { value: 'onnivora', label: 'Onnivorə' },
  { value: 'onnivora_consapevole', label: 'Onnivorə consapevole' },
  { value: 'altro', label: 'Altro' },
]

export const RELIGION_OPTIONS: { value: Religion; label: string }[] = [
  { value: 'cattolicesimo', label: 'Cattolicesimə' },
  { value: 'islam', label: 'Islam' },
  { value: 'ebraismo', label: 'Ebraismə' },
  { value: 'buddismo', label: 'Buddismə' },
  { value: 'induismo', label: 'Induismə' },
  { value: 'spiritualita', label: 'Spiritualità personale' },
  { value: 'ateismo', label: 'Ateə' },
  { value: 'agnosticismo', label: 'Agnosticə' },
  { value: 'altro', label: 'Altro' },
]

export const POLITICS_OPTIONS: { value: Politics; label: string }[] = [
  { value: 'progressista', label: 'Progressistə' },
  { value: 'conservatrice', label: 'Conservatorə' },
  { value: 'moderata', label: 'Moderatə' },
  { value: 'libertaria', label: 'Libertariə' },
  { value: 'anarchica', label: 'Anarchicə' },
  { value: 'socialista', label: 'Socialista' },
  { value: 'comunista', label: 'Comunista' },
  { value: 'altro', label: 'Altro' },
]

export const SMOKING_OPTIONS: { value: Smoking; label: string }[] = [
  { value: 'fuma', label: 'Fumo regolarmente' },
  { value: 'occasionalmente', label: 'Fumo occasionalmente' },
  { value: 'no', label: 'Non fumo' },
]

export const SMOKING_LABELS: Record<Smoking, string> = {
  fuma: 'Fumo regolarmente',
  occasionalmente: 'Fumo occasionalmente',
  no: 'Non fumo',
  non_dico: 'Preferisco non dire',
}

export const SPORT_OPTIONS: { value: Sport; label: string }[] = [
  { value: 'regolarmente', label: 'Regolare' },
  { value: 'saltuariamente', label: 'Saltuaria' },
  { value: 'no', label: 'No' },
]

export const SPORT_LABELS: Record<Sport, string> = {
  regolarmente: 'Regolare',
  saltuariamente: 'Saltuaria',
  no: 'No',
  non_dico: 'Preferisco non dire',
}

export const DM_FILTER_OPTIONS: { value: DmFilter; label: string }[] = [
  { value: 'tutte', label: 'Tutte' },
  { value: 'citta', label: 'Dalla mia città' },
  { value: 'intenti', label: 'Con i miei stessi intenti' },
  { value: 'verificate', label: 'Solo verificate' },
]

export const ZODIAC_LABELS: Record<Zodiac, string> = {
  ariete: 'Ariete',
  toro: 'Toro',
  gemelli: 'Gemelli',
  cancro: 'Cancro',
  leone: 'Leone',
  vergine: 'Vergine',
  bilancia: 'Bilancia',
  scorpione: 'Scorpione',
  sagittario: 'Sagittario',
  capricorno: 'Capricorno',
  acquario: 'Acquario',
  pesci: 'Pesci',
}

// Interessi raggruppati per categoria (max MAX_INTERESTS selezionati in totale).
// I valori sono memorizzati in minuscolo; ogni categoria consente anche un
// valore libero tramite "Altro (specifica)".
export interface InterestCategory {
  label: string
  options: string[]
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    label: 'Tecnologia & Gaming',
    options: ['videogiochi', 'programmazione', 'hardware', 'intelligenza artificiale'],
  },
  {
    label: 'Tempo Libero & Natura',
    options: ['escursionismo', 'viaggi', 'giardinaggio', 'animali'],
  },
  {
    label: 'Cultura & Spettacolo',
    options: ['cinema', 'serie tv', 'musica', 'arte'],
  },
  {
    label: 'Sport & Benessere',
    options: ['yoga', 'palestra', 'ciclismo', 'meditazione'],
  },
  {
    label: 'Gastronomia',
    options: ['cucina locale', 'cucina etnica', 'sperimentazione culinaria', 'aperitivi'],
  },
  {
    label: 'Stile di Vita',
    options: ['volontariato', 'minimalismo', 'sostenibilità', 'fai-da-te'],
  },
]

// Elenco piatto di tutti gli interessi suggeriti (per ricerca/filtri).
export const INTEREST_SUGGESTIONS: string[] = INTEREST_CATEGORIES.flatMap(
  (c) => c.options,
)

// Slug della chatroom globale a cui si fa auto-join dopo l'onboarding.
export const FOYER_SLUG = 'foyer'

// --- Chatroom ---
export type RoomKind = 'foyer' | 'tematica'

export interface Chatroom {
  id: string
  slug: string
  name: string
  description: string | null
  kind: RoomKind
}

// Numero massimo di stanze tematiche a cui un utente puo' unirsi
// (enforced anche dal trigger DB enforce_membership_cap).
export const MAX_TEMATICHE = 3
