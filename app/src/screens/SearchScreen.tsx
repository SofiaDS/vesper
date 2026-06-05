import { useEffect, useRef, useState } from 'react'
import {
  IDENTITY_OPTIONS,
  ORIENTATION_OPTIONS,
  INTENT_OPTIONS,
  SMOKING_OPTIONS,
  SPORT_OPTIONS,
  ZODIAC_LABELS,
  INTEREST_SUGGESTIONS,
  type Zodiac,
} from '../lib/types'
import {
  searchByNickname,
  searchByFilters,
  activeFilterCount,
  REGIONS,
  SEARCH_PAGE,
  SEARCH_MAX,
  type SearchResult,
  type SearchFilters,
} from '../lib/search'
import { glyphFor } from './ProfileScreen'

type Tab = 'nickname' | 'filtri'

// Debounce hook: ritarda l'esecuzione di una funzione fino a quando
// il valore non rimane stabile per il delay specificato.
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Chip multi-selezione riusabile.
function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={selected.includes(o.value) ? 'chip on' : 'chip'}
          onClick={() => onToggle(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Opzioni filtro (si escludono i valori "preferisco non dire/specificare").
const IDENTITY_F = IDENTITY_OPTIONS.filter(
  (o) => o.value !== 'preferisco_non_specificare',
)
const ORIENTATION_F = ORIENTATION_OPTIONS.filter(
  (o) => o.value !== 'preferisco_non_dire',
)
const SMOKING_F = SMOKING_OPTIONS.filter((o) => o.value !== 'non_dico')
const SPORT_F = SPORT_OPTIONS.filter((o) => o.value !== 'non_dico')
const ZODIAC_F = (Object.keys(ZODIAC_LABELS) as Zodiac[]).map((z) => ({
  value: z,
  label: ZODIAC_LABELS[z],
}))
const REGION_F = REGIONS.map((r) => ({ value: r, label: r }))
const INTEREST_F = INTEREST_SUGGESTIONS.map((i) => ({ value: i, label: i }))

function ResultCard({
  r,
  showAffinity,
  onOpen,
}: {
  r: SearchResult
  showAffinity: boolean
  onOpen: () => void
}) {
  const place = r.city || r.city_region
  return (
    <button type="button" className="search-card" onClick={onOpen}>
      <span
        className="search-ava"
        style={r.accent_color ? { background: r.accent_color } : undefined}
      >
        {glyphFor(r.avatar_preset, r.nickname)}
      </span>
      <span className="search-meta">
        <span className="search-nick">
          @{r.nickname}
          {r.age != null && <span className="search-age"> · {r.age}</span>}
        </span>
        {place && <span className="search-place">{place}</span>}
        {r.common_interests.length > 0 && (
          <span className="search-tags">
            {r.common_interests.slice(0, 3).map((t) => (
              <span key={t} className="search-tag">
                {t}
              </span>
            ))}
          </span>
        )}
      </span>
      {showAffinity && r.match_count > 0 && (
        <span className="search-aff">
          {r.match_count} {r.match_count === 1 ? 'cosa' : 'cose'} in comune
        </span>
      )}
    </button>
  )
}

export function SearchScreen({
  onBack,
  onOpenProfile,
}: {
  onBack: () => void
  onOpenProfile: (userId: string) => void
}) {
  const [tab, setTab] = useState<Tab>('nickname')

  // Stato nickname.
  const [nick, setNick] = useState('')
  const debouncedNick = useDebounce(nick, 500) // 500ms debounce

  // Stato filtri.
  const [filters, setFilters] = useState<SearchFilters>({})
  const [ageOn, setAgeOn] = useState(false)
  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(99)

  // Stato risultati.
  const [results, setResults] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  
  // Traccia se è in corso una ricerca manuale (Enter o tasto Cerca) per non
  // sovrascrivere i risultati durante il debounce.
  const manualSearchRef = useRef(false)

  function toggle(key: keyof SearchFilters, v: string) {
    setFilters((f) => {
      const cur = (f[key] as string[] | undefined) ?? []
      const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
      return { ...f, [key]: next }
    })
  }

  function builtFilters(): SearchFilters {
    return {
      ...filters,
      ageMin: ageOn ? ageMin : null,
      ageMax: ageOn ? ageMax : null,
    }
  }

  async function runNickname(q: string) {
    if (q.length < 2) {
      // Cancella risultati se la query è troppo corta.
      setResults([])
      setErr(null)
      setSearched(false)
      return
    }
    setErr(null)
    setLoading(true)
    setSearched(true)
    try {
      const rows = await searchByNickname(q, 0)
      setResults(rows)
      setHasMore(rows.length === SEARCH_PAGE)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ricerca non riuscita.')
    } finally {
      setLoading(false)
    }
  }

  // Esegui ricerca automatica quando il valore debounced cambia
  // (ma non se l'utente ha appena fatto una ricerca manuale).
  useEffect(() => {
    if (tab === 'nickname' && !manualSearchRef.current) {
      runNickname(debouncedNick)
    }
    manualSearchRef.current = false
  }, [debouncedNick, tab])

  async function runFilters() {
    const f = builtFilters()
    if (activeFilterCount(f) === 0) {
      setErr('Seleziona almeno un filtro.')
      return
    }
    setErr(null)
    setLoading(true)
    setSearched(true)
    try {
      const rows = await searchByFilters(f, 0)
      setResults(rows)
      setHasMore(rows.length === SEARCH_PAGE)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ricerca non riuscita.')
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (results.length >= SEARCH_MAX) return
    setLoading(true)
    try {
      const rows =
        tab === 'nickname'
          ? await searchByNickname(nick.trim(), results.length)
          : await searchByFilters(builtFilters(), results.length)
      const merged = [...results, ...rows]
      setResults(merged)
      setHasMore(rows.length === SEARCH_PAGE && merged.length < SEARCH_MAX)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ricerca non riuscita.')
    } finally {
      setLoading(false)
    }
  }

  function switchTab(t: Tab) {
    setTab(t)
    setResults([])
    setSearched(false)
    setErr(null)
    setHasMore(false)
  }

  function handleNicknameSubmit() {
    manualSearchRef.current = true
    runNickname(nick.trim())
  }

  return (
    <main className="app profile search-screen">
      <header className="rooms-header">
        <button type="button" className="link" onClick={onBack}>
          ‹ Indietro
        </button>
        <h1 className="rooms-brand">Esplora</h1>
        <span className="link-placeholder" />
      </header>

      <p className="search-intro">
        Qui trovi altre utenti che hanno scelto di essere cercabili. Non è
        un'app di dating: niente swipe, niente match. Vedi solo ciò che ognuna
        ha reso pubblico. Per essere trovata, attiva "sono cercabile" dal tuo
        profilo.
      </p>

      <div className="search-tabs">
        <button
          type="button"
          className={tab === 'nickname' ? 'seg on' : 'seg'}
          onClick={() => switchTab('nickname')}
        >
          Per nickname
        </button>
        <button
          type="button"
          className={tab === 'filtri' ? 'seg on' : 'seg'}
          onClick={() => switchTab('filtri')}
        >
          Per filtri
        </button>
      </div>

      {tab === 'nickname' ? (
        <div className="search-nick-form">
          <input
            type="text"
            className="search-input"
            placeholder="Cerca un nickname…"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNicknameSubmit()}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={handleNicknameSubmit}
            disabled={loading}
          >
            Cerca
          </button>
        </div>
      ) : (
        <div className="search-filters">
          <fieldset className="field">
            <legend>Età</legend>
            <label className="check">
              <input
                type="checkbox"
                checked={ageOn}
                onChange={(e) => setAgeOn(e.target.checked)}
              />
              <span>Filtra per età</span>
            </label>
            {ageOn && (
              <div className="age-range">
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={ageMin}
                  onChange={(e) =>
                    setAgeMin(Math.max(18, Number(e.target.value)))
                  }
                />
                <span>–</span>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={ageMax}
                  onChange={(e) =>
                    setAgeMax(Math.min(99, Number(e.target.value)))
                  }
                />
              </div>
            )}
          </fieldset>

          <fieldset className="field">
            <legend>Regione</legend>
            <ChipGroup
              options={REGION_F}
              selected={filters.regions ?? []}
              onToggle={(v) => toggle('regions', v)}
            />
          </fieldset>

          <fieldset className="field">
            <legend>Città</legend>
            <input
              type="text"
              className="search-input"
              placeholder="Es. Roma"
              value={filters.city ?? ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, city: e.target.value }))
              }
            />
          </fieldset>

          <fieldset className="field">
            <legend>Identità</legend>
            <ChipGroup
              options={IDENTITY_F}
              selected={filters.identities ?? []}
              onToggle={(v) => toggle('identities', v)}
            />
          </fieldset>

          <fieldset className="field">
            <legend>Orientamento</legend>
            <ChipGroup
              options={ORIENTATION_F}
              selected={filters.orientations ?? []}
              onToggle={(v) => toggle('orientations', v)}
            />
          </fieldset>

          <fieldset className="field">
            <legend>Interessi</legend>
            <ChipGroup
              options={INTEREST_F}
              selected={filters.interests ?? []}
              onToggle={(v) => toggle('interests', v)}
            />
          </fieldset>

          <fieldset className="field">
            <legend>Cerco</legend>
            <ChipGroup
              options={INTENT_OPTIONS}
              selected={filters.intents ?? []}
              onToggle={(v) => toggle('intents', v)}
            />
          </fieldset>

          <fieldset className="field">
            <legend>Fumo</legend>
            <ChipGroup
              options={SMOKING_F}
              selected={filters.smoking ?? []}
              onToggle={(v) => toggle('smoking', v)}
            />
          </fieldset>

          <fieldset className="field">
            <legend>Sport</legend>
            <ChipGroup
              options={SPORT_F}
              selected={filters.sport ?? []}
              onToggle={(v) => toggle('sport', v)}
            />
          </fieldset>

          <fieldset className="field">
            <legend>Segno zodiacale</legend>
            <ChipGroup
              options={ZODIAC_F}
              selected={filters.zodiac ?? []}
              onToggle={(v) => toggle('zodiac', v)}
            />
          </fieldset>

          <button
            type="button"
            className="btn-primary search-go"
            onClick={runFilters}
            disabled={loading}
          >
            Esplora
          </button>
        </div>
      )}

      {err && <p className="err">{err}</p>}

      {searched && (
        <div className="search-results">
          {loading && results.length === 0 ? (
            <p className="hint">Cerco…</p>
          ) : results.length === 0 ? (
            <p className="hint">
              Nessun risultato. Forse non ci sono utenti cercabili che
              corrispondono — prova a cambiare i filtri.
            </p>
          ) : (
            <>
              {results.map((r) => (
                <ResultCard
                  key={r.id}
                  r={r}
                  showAffinity={tab === 'filtri'}
                  onOpen={() => onOpenProfile(r.id)}
                />
              ))}
              {hasMore && (
                <button
                  type="button"
                  className="link search-more"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Carico…' : 'Carica altri'}
                </button>
              )}
              {results.length >= SEARCH_MAX && (
                <p className="hint">
                  Hai raggiunto il massimo dei risultati. Raffina i filtri per
                  trovare quello che cerchi.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </main>
  )
}
