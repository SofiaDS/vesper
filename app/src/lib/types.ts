// Tipi e costanti allineati allo schema DB (Fase 1 + campi profilo completi).
// Vedi profilo_utente.md e i CHECK constraint sulla tabella `profiles`.

export type IdentityCategory =
  | 'donna_cis'
  | 'donna_trans'
  | 'uomo_trans'
  | 'nonbinary_afab'
  | 'preferisco_non_specificare'

export type Orientation =
  | 'lesbica'
  | 'bisessuale'
  | 'queer'
  | 'pan'
  | 'questioning'
  | 'preferisco_non_dire'

export type Intent =
  | 'amicizia'
  | 'dating'
  | 'relazione'
  | 'networking'
  | 'confronto'
  | 'solo_chattare'

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
export const MAX_INTERESTS = 5

// --- Etichette in italiano per la UI ---

export const IDENTITY_OPTIONS: { value: IdentityCategory; label: string }[] = [
  { value: 'donna_cis', label: 'Donna cis' },
  { value: 'donna_trans', label: 'Donna trans' },
  { value: 'uomo_trans', label: 'Uomo trans' },
  { value: 'nonbinary_afab', label: 'Non-binary AFAB' },
  { value: 'preferisco_non_specificare', label: 'Preferisco non specificare' },
]

export const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: 'lesbica', label: 'Lesbica' },
  { value: 'bisessuale', label: 'Bisessuale' },
  { value: 'queer', label: 'Queer' },
  { value: 'pan', label: 'Pan' },
  { value: 'questioning', label: 'Questioning' },
  { value: 'preferisco_non_dire', label: 'Preferisco non dire' },
]

export const INTENT_OPTIONS: { value: Intent; label: string }[] = [
  { value: 'amicizia', label: 'Amicizia' },
  { value: 'dating', label: 'Dating' },
  { value: 'relazione', label: 'Relazione' },
  { value: 'networking', label: 'Networking' },
  { value: 'confronto', label: 'Confronto' },
  { value: 'solo_chattare', label: 'Solo chattare' },
]

export const SMOKING_OPTIONS: { value: Smoking; label: string }[] = [
  { value: 'fuma', label: 'Fumo' },
  { value: 'no', label: 'Non fumo' },
  { value: 'occasionalmente', label: 'Occasionalmente' },
  { value: 'non_dico', label: 'Preferisco non dire' },
]

export const SPORT_OPTIONS: { value: Sport; label: string }[] = [
  { value: 'regolarmente', label: 'Sì, regolarmente' },
  { value: 'saltuariamente', label: 'Saltuariamente' },
  { value: 'no', label: 'No' },
  { value: 'non_dico', label: 'Preferisco non dire' },
]

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

// Tag interessi suggeriti (l'utente puo' anche aggiungerne di liberi).
// Memorizzati in minuscolo.
export const INTEREST_SUGGESTIONS: string[] = [
  'musica',
  'libri',
  'cinema',
  'serie tv',
  'arte',
  'viaggi',
  'cucina',
  'natura',
  'fotografia',
  'videogiochi',
  'attivismo',
  'animali',
  'teatro',
  'tecnologia',
  'yoga',
  'scrittura',
  'fumetti',
  'moda',
]

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
