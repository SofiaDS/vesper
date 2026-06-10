// Costruzione condivisa delle righe di dettaglio e dei "key facts"
// mostrati da ProfileLayout — usata sia da ProfilePreview (il proprio
// profilo, dove i campi nascosti vanno passati come null in base ai
// flag show_*) sia da PublicProfileScreen (profilo altrui, già filtrato
// dalla view public_profiles). Estratto per evitare di duplicare la
// stessa lunga sequenza di "if (campo) rows.push(...)" nei due screen.

import {
  RELATIONSHIP_STATUS_OPTIONS,
  RELATIONSHIP_TYPE_OPTIONS,
  CHILDREN_OPTIONS,
  DIET_OPTIONS,
  RELIGION_OPTIONS,
  POLITICS_OPTIONS,
  EDUCATION_OPTIONS,
  INTENT_OPTIONS,
} from '../../constants/options'
import {
  IDENTITY_LABELS,
  ORIENTATION_LABELS,
  LANGUAGE_LABELS,
  SMOKING_LABELS,
  SPORT_LABELS,
  ZODIAC_LABELS,
} from '../../constants/labels'
import { labelOf, labelsOf } from '../../lib/profile/formatters'
import { ProfileRow } from './ProfileRow'
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
  Zodiac,
} from '../../types'

export interface ProfileFacts {
  pronouns: string | null
  city: string | null
  city_province: string | null
  city_region: string | null
  birth_date: string | null
  relationship_status: RelationshipStatus | null
  relationship_type: RelationshipType | null
  languages: Language[] | null
  interests: string[] | null
  children_status: ChildrenStatus | null
  has_pets: boolean | null
  pets_detail: string | null
  diet: Diet | null
  religion: Religion | null
  politics: Politics | null
  education_level: EducationLevel | null
  education_institute: string | null
  smoking: Smoking | null
  sport: Sport | null
  zodiac: Zodiac | null
  identity_category: IdentityCategory | null
  orientations: Orientation[] | null
  intents: Intent[] | null
  age: number | null
}

export function buildProfileRows(f: ProfileFacts): React.ReactNode[] {
  const rows: React.ReactNode[] = []

  if (f.pronouns)
    rows.push(<ProfileRow key="pron" label="Pronomi">{f.pronouns}</ProfileRow>)
  if (f.city)
    rows.push(
      <ProfileRow key="city" label="Città">
        {f.city}
        {f.city_province ? ` (${f.city_province})` : ''}
        {f.city_region ? `, ${f.city_region}` : ''}
      </ProfileRow>,
    )
  if (f.birth_date)
    rows.push(
      <ProfileRow key="bd" label="Data di nascita">
        {new Date(f.birth_date).toLocaleDateString('it-IT')}
      </ProfileRow>,
    )
  if (f.relationship_status)
    rows.push(
      <ProfileRow key="rel" label="Relazione">
        {labelOf(RELATIONSHIP_STATUS_OPTIONS, f.relationship_status)}
        {f.relationship_status === 'in_relazione' && f.relationship_type
          ? ` · ${labelOf(RELATIONSHIP_TYPE_OPTIONS, f.relationship_type)}`
          : ''}
      </ProfileRow>,
    )
  if (f.languages && f.languages.length > 0)
    rows.push(
      <ProfileRow key="lang" label="Lingue parlate">
        {f.languages.map((l) => LANGUAGE_LABELS[l]).join(', ')}
      </ProfileRow>,
    )
  if (f.interests && f.interests.length > 0)
    rows.push(<ProfileRow key="int" label="Interessi">{f.interests.join(', ')}</ProfileRow>)
  if (f.children_status)
    rows.push(<ProfileRow key="ch" label="Figli">{labelOf(CHILDREN_OPTIONS, f.children_status)}</ProfileRow>)
  if (f.has_pets != null)
    rows.push(
      <ProfileRow key="pets" label="Animali domestici">
        {f.has_pets ? (f.pets_detail ? `Sì — ${f.pets_detail}` : 'Sì') : 'No'}
      </ProfileRow>,
    )
  if (f.diet)
    rows.push(<ProfileRow key="diet" label="Alimentazione">{labelOf(DIET_OPTIONS, f.diet)}</ProfileRow>)
  if (f.religion)
    rows.push(<ProfileRow key="rel2" label="Religione & credo">{labelOf(RELIGION_OPTIONS, f.religion)}</ProfileRow>)
  if (f.politics)
    rows.push(<ProfileRow key="pol" label="Orientamento politico">{labelOf(POLITICS_OPTIONS, f.politics)}</ProfileRow>)
  if (f.education_level && f.education_level !== 'preferisco_non_specificare')
    rows.push(
      <ProfileRow key="edu" label="Formazione">
        {labelOf(EDUCATION_OPTIONS, f.education_level)}
        {f.education_institute ? ` — ${f.education_institute}` : ''}
      </ProfileRow>,
    )
  if (f.smoking)
    rows.push(<ProfileRow key="sm" label="Fumo">{SMOKING_LABELS[f.smoking]}</ProfileRow>)
  if (f.sport)
    rows.push(<ProfileRow key="sp" label="Attività fisica">{SPORT_LABELS[f.sport]}</ProfileRow>)
  if (f.zodiac)
    rows.push(<ProfileRow key="zo" label="Segno">{ZODIAC_LABELS[f.zodiac]}</ProfileRow>)

  return rows
}

export function buildKeyFacts(f: ProfileFacts): (string | null)[] {
  return [
    f.identity_category ? IDENTITY_LABELS[f.identity_category] : null,
    f.orientations && f.orientations.length > 0
      ? f.orientations.map((o) => ORIENTATION_LABELS[o]).join(', ')
      : null,
    f.intents && f.intents.length > 0 ? labelsOf(INTENT_OPTIONS, f.intents) : null,
    f.age != null ? `${f.age} anni` : null,
  ]
}
