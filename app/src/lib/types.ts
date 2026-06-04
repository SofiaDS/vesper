// Tipi e costanti allineati allo schema DB (Fase 1).
// Vedi profilo_utente.md e i CHECK constraint sulla tabella `profiles`.

export type IdentityCategory =
  | 'donna_cis'
  | 'donna_trans'
  | 'uomo_trans'
  | 'nonbinary_afab'

export type Orientation =
  | 'lesbica'
  | 'bisessuale'
  | 'queer'
  | 'pan'
  | 'questioning'

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
  strato: number
  is_searchable: boolean
  created_at: string
  updated_at: string
}

// Etichette in italiano per la UI di onboarding.
export const IDENTITY_OPTIONS: { value: IdentityCategory; label: string }[] = [
  { value: 'donna_cis', label: 'Donna cis' },
  { value: 'donna_trans', label: 'Donna trans' },
  { value: 'uomo_trans', label: 'Uomo trans' },
  { value: 'nonbinary_afab', label: 'Non-binary AFAB' },
]

export const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: 'lesbica', label: 'Lesbica' },
  { value: 'bisessuale', label: 'Bisessuale' },
  { value: 'queer', label: 'Queer' },
  { value: 'pan', label: 'Pan' },
  { value: 'questioning', label: 'Questioning' },
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
