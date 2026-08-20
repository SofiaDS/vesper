// Costruzione condivisa di quello che il profilo pubblico mostra — usata sia
// da ProfilePreview (il proprio profilo, dove i campi nascosti vanno passati
// come null in base ai flag show_*) sia da PublicProfileScreen (profilo
// altrui, già filtrato dalla view public_profiles). Estratto per evitare di
// duplicare la stessa lunga sequenza di "if (campo)" nei due screen.
//
// Redesign 2B: le 14 righe etichetta/valore identiche sono sparite. Restano
// tre livelli di lettura, in ordine di importanza:
//   1. buildHeroLine   → "31 anni · Bologna", accanto all'avatar;
//   2. buildKeyFacts   → i tre fatti chiave con etichetta grande
//                        (Si presenta come / Cerca / Parla);
//   3. buildFactChips  → tutto il resto, come chip sotto «Mostra tutto (N)».
// Ogni funzione salta da sé i valori assenti, così chi chiama non deve
// ricontrollare nulla: se un blocco è vuoto non viene proprio disegnato.

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
  ZODIAC_LABELS,
} from '../../constants/labels'
import { labelOf, labelsOf } from '../../lib/profile/formatters'
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
  languages: string[] | null
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

export interface KeyFact {
  label: string
  value: string
}

// Sottotitolo dell'hero, accanto al nickname: le due informazioni che si
// leggono per prime in un profilo. Se mancano entrambe non si mostra la riga.
export function buildHeroLine(f: ProfileFacts): string | null {
  const parts = [
    f.age != null ? `${f.age} anni` : null,
    f.city ? `${f.city}${f.city_province ? ` (${f.city_province})` : ''}` : null,
  ].filter((p): p is string => Boolean(p))
  return parts.length > 0 ? parts.join(' · ') : null
}

// I tre fatti chiave del redesign 2B, ognuno con etichetta piccola sopra e
// valore grande sotto. Un blocco senza valore (nascosto per privacy o mai
// compilato) semplicemente non entra nell'elenco.
export function buildKeyFacts(f: ProfileFacts): KeyFact[] {
  const facts: KeyFact[] = []

  const presenta = [
    f.identity_category ? IDENTITY_LABELS[f.identity_category] : null,
    f.orientations && f.orientations.length > 0
      ? f.orientations.map((o) => ORIENTATION_LABELS[o]).join(' · ')
      : null,
    f.pronouns,
  ].filter((p): p is string => Boolean(p))
  if (presenta.length > 0) facts.push({ label: 'Si presenta come', value: presenta.join(' · ') })

  if (f.intents && f.intents.length > 0)
    facts.push({ label: 'Cerca', value: labelsOf(INTENT_OPTIONS, f.intents) })

  if (f.languages && f.languages.length > 0)
    facts.push({
      label: 'Parla',
      value: f.languages.map((l) => LANGUAGE_LABELS[l as Language] ?? l).join(', '),
    })

  return facts
}

export interface FactChipGroup {
  label: string
  chips: string[]
}

// Alcuni valori, da soli, non dicono di quale campo parlano: «altro» esiste
// per religione *e* per orientamento politico, e nel gruppo «Valori»
// finirebbero due chip «altro» identici. Quando il valore è uno di questi il
// chip si porta dietro il nome del campo; quando parla da sé («vegetariana»,
// «non fumo») l'etichetta del gruppo basta già e il prefisso sarebbe rumore.
const VALORI_GENERICI = new Set([
  'altro',
  'preferisco non dire',
  'preferisco non specificare',
  'non so ancora',
  'non etichettatə',
])

function chipOf(label: string, value: string): string {
  return VALORI_GENERICI.has(value.toLowerCase()) ? `${label}: ${value}` : value
}

// Tutto ciò che non è già nell'hero o nei tre fatti chiave, raggruppato per
// area sotto una micro-intestazione. È il raggruppamento a dare senso al
// singolo chip: «bilancia» sotto ASTROLOGIA o «un gatto» sotto STILE DI VITA
// si leggono da soli, mentre in un unico mucchio non si capiva di che campo
// fossero. Gli intenti non compaiono qui: sono già il fatto chiave «Cerca».
// Il totale dei chip è il "N" del bottone «Mostra tutto (N)».
export function buildFactChips(f: ProfileFacts): FactChipGroup[] {
  const groups: FactChipGroup[] = []
  const add = (label: string, chips: (string | null)[]) => {
    const kept = chips.filter((c): c is string => Boolean(c))
    if (kept.length > 0) groups.push({ label, chips: kept })
  }

  add('Relazioni & obiettivi', [
    f.relationship_status
      ? f.relationship_status === 'in_relazione' && f.relationship_type
        ? `${labelOf(RELATIONSHIP_STATUS_OPTIONS, f.relationship_status)} · ${labelOf(RELATIONSHIP_TYPE_OPTIONS, f.relationship_type)}`
        : chipOf('relazione', labelOf(RELATIONSHIP_STATUS_OPTIONS, f.relationship_status))
      : null,
  ])

  add('Formazione', [
    f.education_level && f.education_level !== 'preferisco_non_specificare'
      ? labelOf(EDUCATION_OPTIONS, f.education_level) +
        (f.education_institute ? ` — ${f.education_institute}` : '')
      : null,
  ])

  add('Stile di vita', [
    f.diet ? chipOf('alimentazione', labelOf(DIET_OPTIONS, f.diet)) : null,
    f.smoking ? SMOKING_LABELS[f.smoking] : null,
    // Le etichette di SPORT_LABELS ("regolare", "saltuaria") concordano con
    // «attività fisica» e da sole non si capirebbero: qui la parola c'è.
    f.sport ? SPORT_CHIPS[f.sport] : null,
    f.has_pets == null
      ? null
      : f.has_pets
        ? f.pets_detail || 'ha animali'
        : 'niente animali',
    f.children_status ? chipOf('figli', labelOf(CHILDREN_OPTIONS, f.children_status)) : null,
  ])

  add('Valori', [
    f.religion ? chipOf('religione', labelOf(RELIGION_OPTIONS, f.religion)) : null,
    f.politics ? chipOf('politica', labelOf(POLITICS_OPTIONS, f.politics)) : null,
  ])

  add('Interessi', f.interests ?? [])

  add('Astrologia', [f.zodiac ? ZODIAC_LABELS[f.zodiac] : null])

  add('Provenienza', [f.city_region])

  add('Data di nascita', [
    f.birth_date ? new Date(f.birth_date).toLocaleDateString('it-IT') : null,
  ])

  return groups
}

// Lo sport come chip a sé stante: "sport saltuario" invece di "saltuaria",
// che fuori dalla frase «attività fisica: …» non vuol dire niente.
const SPORT_CHIPS: Record<Sport, string> = {
  regolarmente: 'sport regolare',
  saltuariamente: 'sport saltuario',
  no: 'niente sport',
}

// Quanti chip in tutto: il numero mostrato in «Mostra tutto (N)».
export function countFactChips(groups: FactChipGroup[]): number {
  return groups.reduce((n, g) => n + g.chips.length, 0)
}
