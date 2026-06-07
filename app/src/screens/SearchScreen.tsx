import { useEffect, useRef, useState, useMemo } from 'react'
import { AppHeader } from '../components/AppHeader'
import {
  IDENTITY_OPTIONS,
  ORIENTATION_OPTIONS,
  INTENT_OPTIONS,
  SMOKING_OPTIONS,
  SPORT_OPTIONS,
} from '../constants/options'
import { ZODIAC_LABELS } from '../constants/labels'
import { INTEREST_SUGGESTIONS } from '../constants/limits'
import { REGIONS } from '../constants/regions'
import {
  searchByNickname,
  searchByFilters,
  checkNicknameSearchWarning,
  activeFilterCount,
  SEARCH_PAGE,
  SEARCH_MAX,
  type SearchFilters,
} from '../lib/search'
import { useDebounce } from '../hooks/useDebounce'
import { ChipGroup } from '../components/ChipGroup'
import { SkeletonCard } from '../components/SkeletonCard'
import { UserCard } from '../components/UserCard'
import type { Zodiac } from '../types'

type Tab = 'nickname' | 'filtri'

const STORAGE_KEY        = 'vesper_search_filters'
const HISTORY_KEY        = 'vesper_search_history'
const ONBOARDING_KEY     = 'vesper_search_seen'
const HISTORY_MAX        = 5
const HISTORY_TTL_DAYS   = 30

interface StoredSearchState {
  tab: Tab
  nick: string
  filters: SearchFilters
  ageOn: boolean
  ageMin: number
  ageMax: number
}

interface SavedSearch {
  id: string
  label: string
  tab: Tab
  nick: string
  filters: SearchFilters
  ageOn: boolean
  ageMin: number
  ageMax: number
  savedAt: number
}

function loadHistory(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const cutoff = Date.now() - HISTORY_TTL_DAYS * 86_400_000
    return (JSON.parse(raw) as SavedSearch[]).filter((s) => s.savedAt > cutoff)
  } catch { return [] }
}

function saveHistory(h: SavedSearch[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, HISTORY_MAX))) } catch {}
}

export function SearchScreen({
  onBack,
  onOpenProfile,
}: {
  onBack: () => void
  onOpenProfile: (userId: string) => void
}) {
  const [tab, setTab] = useState<Tab>('nickname')
  const [nick, setNick] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [ageOn, setAgeOn] = useState(false)
  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(99)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const state: StoredSearchState = JSON.parse(stored)
        setTab(state.tab ?? 'nickname')
        setNick(state.nick ?? '')
        setFilters(state.filters ?? {})
        setAgeOn(state.ageOn ?? false)
        setAgeMin(state.ageMin ?? 18)
        setAgeMax(state.ageMax ?? 99)
      }
    } catch (e) {
      console.error('Errore nel caricamento dei filtri salvati:', e)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tab, nick, filters, ageOn, ageMin, ageMax }))
    } catch (e) {
      console.error('Errore nel salvataggio dei filtri:', e)
    }
  }, [tab, nick, filters, ageOn, ageMin, ageMax])

  const debouncedNick = useDebounce(nick, 500)

  const [results, setResults] = useState<Awaited<ReturnType<typeof searchByNickname>>>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [softWarning, setSoftWarning] = useState<string | null>(null)
  const [history, setHistory] = useState<SavedSearch[]>(loadHistory)
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDING_KEY))
  const manualSearchRef = useRef(false)

  const IDENTITY_F = useMemo(
    () => IDENTITY_OPTIONS.filter((o) => o.value !== 'preferisco_non_specificare'),
    [],
  )
  const ORIENTATION_F = useMemo(
    () => ORIENTATION_OPTIONS.filter((o) => o.value !== 'preferisco_non_dire'),
    [],
  )
  const SMOKING_F = useMemo(
    () => SMOKING_OPTIONS.filter((o) => o.value !== 'non_dico'),
    [],
  )
  const SPORT_F = useMemo(
    () => SPORT_OPTIONS.filter((o) => o.value !== 'non_dico'),
    [],
  )
  const ZODIAC_F = useMemo(
    () => (Object.keys(ZODIAC_LABELS) as Zodiac[]).map((z) => ({ value: z, label: ZODIAC_LABELS[z] })),
    [],
  )
  const REGION_F = useMemo(() => REGIONS.map((r) => ({ value: r, label: r })), [])
  const INTEREST_F = useMemo(() => INTEREST_SUGGESTIONS.map((i) => ({ value: i, label: i })), [])
  const INTENT_F = useMemo(() => INTENT_OPTIONS, [])

  function toggle(key: keyof SearchFilters, v: string) {
    setFilters((f) => {
      const cur = (f[key] as string[] | undefined) ?? []
      const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
      return { ...f, [key]: next }
    })
  }

  function builtFilters(): SearchFilters {
    return { ...filters, ageMin: ageOn ? ageMin : null, ageMax: ageOn ? ageMax : null }
  }

  function pushHistory(entry: Omit<SavedSearch, 'id' | 'savedAt'> & { label: string }) {
    setHistory((prev) => {
      const next = [{ ...entry, id: crypto.randomUUID(), savedAt: Date.now() }, ...prev]
        .slice(0, HISTORY_MAX)
      saveHistory(next)
      return next
    })
  }

  function deleteHistory(id: string) {
    setHistory((prev) => { const next = prev.filter((s) => s.id !== id); saveHistory(next); return next })
  }

  function restoreHistory(s: SavedSearch) {
    setTab(s.tab); setNick(s.nick); setFilters(s.filters)
    setAgeOn(s.ageOn); setAgeMin(s.ageMin); setAgeMax(s.ageMax)
    setResults([]); setSearched(false); setErr(null); setSoftWarning(null)
  }

  function dismissOnboarding() {
    try { localStorage.setItem(ONBOARDING_KEY, '1') } catch {}
    setShowOnboarding(false)
  }

  async function runNickname(q: string) {
    if (q.length < 2) {
      setResults([]); setErr(null); setSearched(false); setSoftWarning(null)
      return
    }
    setErr(null); setSoftWarning(null); setLoading(true); setSearched(true)
    try {
      const rows = await searchByNickname(q, 0)
      setResults(rows)
      setHasMore(rows.length === SEARCH_PAGE)
      if (rows.length === 0) {
        const warn = await checkNicknameSearchWarning(q)
        if (warn) setSoftWarning('Non stiamo trovando questa persona. Forse non ha attivato la ricercabilità o ha cambiato nickname.')
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ricerca non riuscita.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'nickname' && !manualSearchRef.current) {
      runNickname(debouncedNick)
    }
    manualSearchRef.current = false
  }, [debouncedNick, tab])

  async function runFilters() {
    const f = builtFilters()
    if (activeFilterCount(f) === 0) { setErr('Seleziona almeno un filtro.'); return }
    setErr(null); setSoftWarning(null); setLoading(true); setSearched(true)
    try {
      const rows = await searchByFilters(f, 0)
      setResults(rows)
      setHasMore(rows.length === SEARCH_PAGE)
      pushHistory({ tab: 'filtri', label: `Filtri (${activeFilterCount(f)} attivi)`, nick: '', filters: f, ageOn, ageMin, ageMax })
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
    setTab(t); setResults([]); setSearched(false); setErr(null); setSoftWarning(null); setHasMore(false)
  }

  function handleNicknameSubmit() {
    const q = nick.trim()
    manualSearchRef.current = true
    if (q.length >= 2) pushHistory({ tab: 'nickname', label: `@${q}`, nick: q, filters: {}, ageOn: false, ageMin: 18, ageMax: 99 })
    runNickname(q)
  }

  return (
    <main className="app profile search-screen">
      <AppHeader onBack={onBack} title="Cerca" />

      {showOnboarding && (
        <div className="search-onboarding card">
          <p>
            <strong>Benvenuta in in Ricerca.</strong> Qui trovi utenti che hanno scelto di
            essere cercabili. Non è un'app di dating: niente swipe, niente match.
            Vedi solo ciò che ognuna ha reso pubblico nel suo profilo.
          </p>
          <p className="muted">
            Per essere trovata, attiva <em>Sono cercabile</em> nelle impostazioni del tuo
            profilo.
          </p>
          <button type="button" className="btn-primary btn-sm" onClick={dismissOnboarding}>
            Capito
          </button>
        </div>
      )}

      {!showOnboarding && history.length > 0 && !searched && (
        <div className="search-history">
          <p className="search-history-title muted">Ricerche recenti</p>
          {history.map((s) => (
            <div key={s.id} className="search-history-row">
              <button type="button" className="search-history-item link" onClick={() => restoreHistory(s)}>
                {s.label}
              </button>
              <button type="button" className="search-history-del link muted" onClick={() => deleteHistory(s.id)} aria-label="Rimuovi">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

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
              <input type="checkbox" checked={ageOn} onChange={(e) => setAgeOn(e.target.checked)} />
              <span>Filtra per età</span>
            </label>
            {ageOn && (
              <div className="age-range">
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={ageMin}
                  onChange={(e) => setAgeMin(Math.max(18, Number(e.target.value)))}
                />
                <span>–</span>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={ageMax}
                  onChange={(e) => setAgeMax(Math.min(99, Number(e.target.value)))}
                />
              </div>
            )}
          </fieldset>

          <fieldset className="field">
            <legend>Regione</legend>
            <ChipGroup options={REGION_F} selected={filters.regions ?? []} onToggle={(v) => toggle('regions', v)} />
          </fieldset>

          <fieldset className="field">
            <legend>Città</legend>
            <input
              type="text"
              className="search-input"
              placeholder="Es. Roma"
              value={filters.city ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            />
          </fieldset>

          <fieldset className="field">
            <legend>Identità</legend>
            <ChipGroup options={IDENTITY_F} selected={filters.identities ?? []} onToggle={(v) => toggle('identities', v)} />
          </fieldset>

          <fieldset className="field">
            <legend>Orientamento</legend>
            <ChipGroup options={ORIENTATION_F} selected={filters.orientations ?? []} onToggle={(v) => toggle('orientations', v)} />
          </fieldset>

          <fieldset className="field">
            <legend>Interessi</legend>
            <ChipGroup options={INTEREST_F} selected={filters.interests ?? []} onToggle={(v) => toggle('interests', v)} />
          </fieldset>

          <fieldset className="field">
            <legend>Cerco</legend>
            <ChipGroup options={INTENT_F} selected={filters.intents ?? []} onToggle={(v) => toggle('intents', v)} />
          </fieldset>

          <fieldset className="field">
            <legend>Fumo</legend>
            <ChipGroup options={SMOKING_F} selected={filters.smoking ?? []} onToggle={(v) => toggle('smoking', v)} />
          </fieldset>

          <fieldset className="field">
            <legend>Sport</legend>
            <ChipGroup options={SPORT_F} selected={filters.sport ?? []} onToggle={(v) => toggle('sport', v)} />
          </fieldset>

          <fieldset className="field">
            <legend>Segno zodiacale</legend>
            <ChipGroup options={ZODIAC_F} selected={filters.zodiac ?? []} onToggle={(v) => toggle('zodiac', v)} />
          </fieldset>

          <button
            type="button"
            className="btn-primary search-go"
            onClick={runFilters}
            disabled={loading}
          >
            Cerca
          </button>
        </div>
      )}

      {err && <p className="err">{err}</p>}
      {softWarning && <p className="hint search-soft-warn">{softWarning}</p>}

      {searched && (
        <div className="search-results">
          {loading && results.length === 0 ? (
            <div className="search-skeletons">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="hint">
              Nessun risultato. Forse non ci sono utenti cercabili che
              corrispondono — prova a cambiare i filtri.
            </p>
          ) : (
            <>
              {results.map((r) => (
                <UserCard
                  key={r.id}
                  result={r}
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
                  Hai raggiunto il massimo dei risultati. Raffina i filtri per trovare quello che cerchi.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </main>
  )
}
