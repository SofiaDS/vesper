// Ricerca utenti: wrapper sulla RPC server-side `search_users`.
// La RPC applica is_searchable, l'asimmetria del block e il masking dei campi
// privati; qui costruiamo solo i parametri e tipizziamo il risultato.
import { supabase } from './supabase'

export const SEARCH_PAGE = 10 // risultati per pagina
export const SEARCH_MAX = 50 // tetto massimo complessivo (vedi ricerca_utenti.md)

export interface SearchResult {
  id: string
  nickname: string
  avatar_preset: string | null
  accent_color: string | null
  age: number | null
  city: string | null
  city_region: string | null
  interests: string[]
  common_interests: string[]
  match_count: number
}

export interface SearchFilters {
  ageMin?: number | null
  ageMax?: number | null
  regions?: string[]
  city?: string | null
  identities?: string[]
  orientations?: string[]
  interests?: string[]
  intents?: string[]
  smoking?: string[]
  sport?: string[]
  zodiac?: string[]
}

function orNull<T>(arr: T[] | undefined): T[] | null {
  return arr && arr.length > 0 ? arr : null
}

// Numero di filtri attivi: utile per la UI ("N cose in comune" e validazione).
export function activeFilterCount(f: SearchFilters): number {
  let n = 0
  if (f.ageMin != null) n++
  n += orNull(f.regions) ? 1 : 0
  if (f.city && f.city.trim()) n++
  n += orNull(f.identities) ? 1 : 0
  n += orNull(f.orientations) ? 1 : 0
  n += orNull(f.interests) ? 1 : 0
  n += orNull(f.intents) ? 1 : 0
  n += orNull(f.smoking) ? 1 : 0
  n += orNull(f.sport) ? 1 : 0
  n += orNull(f.zodiac) ? 1 : 0
  return n
}

export async function searchByNickname(
  nickname: string,
  offset = 0,
): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc('search_users', {
    p_nickname: nickname,
    p_limit: SEARCH_PAGE,
    p_offset: offset,
  })
  if (error) throw error
  return (data as SearchResult[]) ?? []
}

export async function searchByFilters(
  f: SearchFilters,
  offset = 0,
): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc('search_users', {
    p_age_min: f.ageMin ?? null,
    p_age_max: f.ageMax ?? null,
    p_regions: orNull(f.regions),
    p_city: f.city?.trim() || null,
    p_identities: orNull(f.identities),
    p_orientations: orNull(f.orientations),
    p_interests: orNull(f.interests),
    p_intents: orNull(f.intents),
    p_smoking: orNull(f.smoking),
    p_sport: orNull(f.sport),
    p_zodiac: orNull(f.zodiac),
    p_limit: SEARCH_PAGE,
    p_offset: offset,
  })
  if (error) throw error
  return (data as SearchResult[]) ?? []
}

// Regioni italiane (formato identico ai valori in `comuni.regione`).
export const REGIONS: string[] = [
  'Abruzzo',
  'Basilicata',
  'Calabria',
  'Campania',
  'Emilia-Romagna',
  'Friuli-Venezia Giulia',
  'Lazio',
  'Liguria',
  'Lombardia',
  'Marche',
  'Molise',
  'Piemonte',
  'Puglia',
  'Sardegna',
  'Sicilia',
  'Toscana',
  'Trentino-Alto Adige/Südtirol',
  'Umbria',
  "Valle d'Aosta/Vallée d'Aoste",
  'Veneto',
]
