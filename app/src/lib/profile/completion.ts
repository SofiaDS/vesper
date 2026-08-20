// Percentuale di completamento del profilo, mostrata dalla barra in cima
// all'editor (redesign 2F). È una funzione pura e senza dipendenze da React o
// da Supabase, così la logica del conteggio resta verificabile a parte e
// l'editor si limita a disegnarne il risultato.
//
// Il conteggio guarda i campi che l'utente può compilare *dall'editor*: il
// nickname non entra (è obbligatorio alla registrazione, sarebbe sempre pieno)
// e nemmeno i flag show_* o il segno zodiacale (derivato dalla data di
// nascita). Un campo con il valore "preferisco non specificare" conta come
// NON compilato: è la scelta di default di quelle liste, quindi contarlo
// gonfierebbe la percentuale di chi non ha toccato nulla.

import type {
  IdentityCategory,
  Orientation,
  Intent,
  RelationshipStatus,
  ChildrenStatus,
  Diet,
  Religion,
  Politics,
  EducationLevel,
  Smoking,
  Sport,
} from '../../types'

export interface CompletionInput {
  avatar_preset: string | null
  pronouns: string | null
  bio: string | null
  city: string | null
  birth_date: string | null
  identity_category: IdentityCategory | null
  orientations: readonly Orientation[] | null
  intents: readonly Intent[] | null
  relationship_status: RelationshipStatus | null
  languages: readonly string[] | null
  interests: readonly string[] | null
  children_status: ChildrenStatus | null
  has_pets: boolean | null
  diet: Diet | null
  religion: Religion | null
  politics: Politics | null
  education_level: EducationLevel | null
  smoking: Smoking | null
  sport: Sport | null
}

export interface ProfileCompletion {
  filled: number
  total: number
  /** Intero 0–100, arrotondato: è quello che finisce in aria-valuenow. */
  percent: number
}

function hasText(v: string | null): boolean {
  return typeof v === 'string' && v.trim().length > 0
}

function hasItems(v: readonly unknown[] | null): boolean {
  return Array.isArray(v) && v.length > 0
}

export function profileCompletion(p: CompletionInput): ProfileCompletion {
  const checks: boolean[] = [
    hasText(p.avatar_preset),
    hasText(p.pronouns),
    hasText(p.bio),
    hasText(p.city),
    hasText(p.birth_date),
    p.identity_category != null && p.identity_category !== 'preferisco_non_specificare',
    hasItems(p.orientations),
    hasItems(p.intents),
    p.relationship_status != null,
    hasItems(p.languages),
    hasItems(p.interests),
    p.children_status != null,
    p.has_pets != null,
    p.diet != null,
    p.religion != null,
    p.politics != null,
    p.education_level != null && p.education_level !== 'preferisco_non_specificare',
    p.smoking != null,
    p.sport != null,
  ]
  const total = checks.length
  const filled = checks.filter(Boolean).length
  return { filled, total, percent: Math.round((filled / total) * 100) }
}
