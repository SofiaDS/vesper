import { useRef, useState, useMemo, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { NotificationSettings } from '../../components/NotificationSettings'
import { SupporterButton } from '../../components/SupporterButton'
import { PinSetupSection } from './PinSetupSection'
import {
  BIO_MAX,
  PRONOUNS_MAX,
  MAX_INTERESTS,
  INTEREST_CATEGORIES,
  INTEREST_SUGGESTIONS,
} from '../../constants/limits'
import {
  IDENTITY_OPTIONS,
  ORIENTATION_OPTIONS,
  INTENT_OPTIONS,
  RELATIONSHIP_STATUS_OPTIONS,
  RELATIONSHIP_TYPE_OPTIONS,
  DIET_OPTIONS,
  RELIGION_OPTIONS,
  POLITICS_OPTIONS,
  SMOKING_OPTIONS,
  SPORT_OPTIONS,
  DM_FILTER_OPTIONS,
} from '../../constants/options'
import { ZODIAC_LABELS } from '../../constants/labels'
import { glyphFor, normalize, AVATAR_PRESETS } from '../../lib/profile/formatters'
import { checkLayerEligibility, type LayerEligibility } from '../../lib/layers'
import {
  listMyPhotos,
  uploadPhotoFromBlob,
  deletePhoto,
  setPrimary,
  signedUrls,
  MAX_PHOTOS,
  type ProfilePhoto,
  type PhotoStatus,
} from '../../lib/photos'
import { PhotoUploadDialog } from '../../components/PhotoUploadDialog'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import type {
  Profile,
  IdentityCategory,
  Orientation,
  Intent,
  RelationshipStatus,
  RelationshipType,
  Diet,
  Religion,
  Politics,
  Smoking,
  Sport,
} from '../../types'

const ACCENT_COLORS = ['#E8B14E', '#EC6A55', '#7FB7A3', '#9B8CE0', '#E08CB5']

type Comune = { nome: string; sigla: string; provincia: string; regione: string }

const PHOTO_STATUS_LABEL: Record<PhotoStatus, string> = {
  pending: 'In revisione',
  approved: 'Approvata',
  rejected: 'Rifiutata',
}

function PhotoManager({ userId }: { userId: string }) {
  const [photos, setPhotos] = useState<ProfilePhoto[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  async function reload() {
    const list = await listMyPhotos(userId)
    setPhotos(list)
    setUrls(await signedUrls(list.map((p) => p.storage_path)))
  }

  useState(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await listMyPhotos(userId)
        if (!alive) return
        setPhotos(list)
        const map = await signedUrls(list.map((p) => p.storage_path))
        if (alive) setUrls(map)
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : 'Errore foto.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  })

  async function onCropped(blob: Blob) {
    setErr(null)
    setBusy(true)
    try {
      await uploadPhotoFromBlob(userId, blob)
      await reload()
      setAdding(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Caricamento non riuscito.')
    } finally {
      setBusy(false)
    }
  }

  async function run(fn: () => Promise<void>, msg: string) {
    setErr(null)
    setBusy(true)
    try {
      await fn()
      await reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <fieldset className="field">
      <legend>
        Foto <span className="muted">({photos.length}/{MAX_PHOTOS})</span>
      </legend>
      {loading ? (
        <p className="hint">Carico le foto…</p>
      ) : (
        <div className="photo-grid">
          {photos.map((p) => (
            <div key={p.id} className={p.is_primary ? 'photo-cell primary' : 'photo-cell'}>
              {urls[p.storage_path] ? (
                <img className="photo-thumb" src={urls[p.storage_path]} alt="" />
              ) : (
                <div className="photo-thumb ph" />
              )}
              <span className={`photo-badge ${p.status}`}>
                {PHOTO_STATUS_LABEL[p.status]}
              </span>
              <div className="photo-actions">
                <button
                  type="button"
                  className="photo-star"
                  onClick={() => run(() => setPrimary(userId, p.id), 'Operazione non riuscita.')}
                  disabled={busy || p.is_primary}
                  title="Imposta come principale"
                  aria-label="Imposta come principale"
                >
                  {p.is_primary ? '★' : '☆'}
                </button>
                <button
                  type="button"
                  className="photo-del"
                  onClick={() => run(() => deletePhoto(p), 'Eliminazione non riuscita.')}
                  disabled={busy}
                  title="Elimina"
                  aria-label="Elimina foto"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              className="photo-add"
              onClick={() => setAdding(true)}
              disabled={busy}
            >
              <span className="photo-add-plus">{busy ? '…' : '+'}</span>
              <span>Aggiungi</span>
            </button>
          )}
        </div>
      )}
      {adding && (
        <ErrorBoundary
          fallback={(error, retry) => (
            <div className="error-boundary">
              <p>Errore nel caricamento: {error.message}</p>
              <button type="button" className="link" onClick={retry}>Riprova</button>
              <button type="button" className="link" onClick={() => setAdding(false)}>Chiudi</button>
            </div>
          )}
        >
          <PhotoUploadDialog onClose={() => setAdding(false)} onComplete={onCropped} />
        </ErrorBoundary>
      )}
      <span className="hint">
        La prima è la principale (★). Le foto restano <em>in revisione</em>{' '}
        finché non vengono approvate: le altre persone le vedono solo dopo l'ok.
      </span>
      {err && <p className="err">{err}</p>}
    </fieldset>
  )
}

export function ProfileEditor({
  profile,
  onCancel,
  onSaved,
}: {
  profile: Profile
  onCancel: () => void
  onSaved: () => void | Promise<void>
}) {
  const [nickname, setNickname] = useState(profile.nickname)
  const [pronouns, setPronouns] = useState(profile.pronouns ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [identity, setIdentity] = useState<IdentityCategory>(profile.identity_category)
  const [orientations, setOrientations] = useState<Orientation[]>(profile.orientations ?? [])
  const [intents, setIntents] = useState<Intent[]>(profile.intents ?? [])
  const [relStatus, setRelStatus] = useState<RelationshipStatus | null>(profile.relationship_status ?? null)
  const [relType, setRelType] = useState<RelationshipType | null>(profile.relationship_type ?? null)
  const [diet, setDiet] = useState<Diet | null>(profile.diet ?? null)
  const [religion, setReligion] = useState<Religion | null>(profile.religion ?? null)
  const [politics, setPolitics] = useState<Politics | null>(profile.politics ?? null)
  const [interests, setInterests] = useState<string[]>(profile.interests ?? [])
  const [newInterest, setNewInterest] = useState('')
  const [smoking, setSmoking] = useState<Smoking | null>(profile.smoking ?? null)
  const [sport, setSport] = useState<Sport | null>(profile.sport ?? null)
  const [avatar, setAvatar] = useState<string | null>(profile.avatar_preset ?? null)
  const [accent, setAccent] = useState<string | null>(profile.accent_color ?? null)
  const [dmFilter, setDmFilter] = useState(profile.dm_filter)

  const [cityName, setCityName] = useState(profile.city ?? '')
  const [cityProvince, setCityProvince] = useState(profile.city_province ?? '')
  const [cityRegion, setCityRegion] = useState(profile.city_region ?? '')
  const [cityQuery, setCityQuery] = useState(
    profile.city
      ? `${profile.city}${profile.city_province ? ` (${profile.city_province})` : ''}`
      : '',
  )
  const [cityResults, setCityResults] = useState<Comune[]>([])
  const [cityOpen, setCityOpen] = useState(false)
  const cityTimer = useRef<number | null>(null)
  const citySelected = useRef<boolean>(!!profile.city)

  const [vis, setVis] = useState({
    show_age: profile.show_age,
    show_birth_date: profile.show_birth_date,
    show_identity: profile.show_identity,
    show_orientation: profile.show_orientation,
    show_city: profile.show_city,
    show_pronouns: profile.show_pronouns,
    show_intents: profile.show_intents,
    show_relationship: profile.show_relationship,
    show_diet: profile.show_diet,
    show_religion: profile.show_religion,
    show_politics: profile.show_politics,
    show_smoking: profile.show_smoking,
    show_sport: profile.show_sport,
    show_zodiac: profile.show_zodiac,
    show_online: profile.show_online,
  })
  const [searchable, setSearchable] = useState(profile.is_searchable)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [layerEligibility, setLayerEligibility] = useState<LayerEligibility | null>(null)

  useEffect(() => {
    checkLayerEligibility(profile.id)
      .then((e) => setLayerEligibility(e))
      .catch(() => {})
  }, [profile.id])

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
  }

  function setVisFlag(key: keyof typeof vis, value: boolean) {
    setVis((prev) => ({ ...prev, [key]: value }))
  }

  function addInterest(raw: string) {
    const tag = raw.trim().toLowerCase()
    if (!tag) return
    setInterests((prev) => {
      if (prev.includes(tag) || prev.length >= MAX_INTERESTS) return prev
      return [...prev, tag]
    })
    setNewInterest('')
  }

  function toggleInterest(tag: string) {
    setInterests((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length >= MAX_INTERESTS
          ? prev
          : [...prev, tag],
    )
  }

  const customInterests = interests.filter((t) => !INTEREST_SUGGESTIONS.includes(t))

  function onCityInput(v: string) {
    setCityQuery(v)
    citySelected.current = false
    setCityName('')
    setCityProvince('')
    setCityRegion('')
    if (cityTimer.current) window.clearTimeout(cityTimer.current)
    const q = normalize(v)
    if (q.length < 2) {
      setCityResults([])
      setCityOpen(false)
      return
    }
    cityTimer.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from('comuni')
        .select('nome, sigla, provincia, regione')
        .like('ricerca', `${q}%`)
        .order('nome')
        .limit(8)
      setCityResults((data as Comune[]) ?? [])
      setCityOpen(true)
    }, 200)
  }

  function pickCity(c: Comune) {
    setCityName(c.nome)
    setCityProvince(c.sigla)
    setCityRegion(c.regione)
    setCityQuery(`${c.nome} (${c.sigla})`)
    citySelected.current = true
    setCityOpen(false)
    setCityResults([])
  }

  function clearCity() {
    setCityQuery('')
    setCityName('')
    setCityProvince('')
    setCityRegion('')
    citySelected.current = false
    setCityResults([])
    setCityOpen(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const nick = nickname.trim()
    if (nick.length < 3 || nick.length > 24) {
      setError('Il nickname deve avere tra 3 e 24 caratteri.')
      return
    }
    if (bio.length > BIO_MAX) {
      setError(`La bio non può superare i ${BIO_MAX} caratteri.`)
      return
    }
    if (pronouns.length > PRONOUNS_MAX) {
      setError(`I pronomi non possono superare i ${PRONOUNS_MAX} caratteri.`)
      return
    }
    if (cityQuery.trim() && !citySelected.current) {
      setError("Seleziona la città dall'elenco dei suggerimenti.")
      return
    }
    const relTypeToSave = relStatus === 'in_relazione' ? relType : null
    setSaving(true)
    try {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({
          nickname: nick,
          pronouns: pronouns.trim() || null,
          bio: bio.trim() || null,
          city: citySelected.current ? cityName : null,
          city_province: citySelected.current ? cityProvince : null,
          city_region: citySelected.current ? cityRegion : null,
          identity_category: identity,
          orientations,
          intents,
          relationship_status: relStatus,
          relationship_type: relTypeToSave,
          diet,
          religion,
          politics,
          interests,
          smoking,
          sport,
          avatar_preset: avatar,
          accent_color: accent,
          dm_filter: dmFilter,
          ...vis,
          is_searchable: searchable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
      if (updErr) {
        if (updErr.code === '23505') {
          throw new Error('Questo nickname è già in uso, scegline un altro.')
        }
        throw updErr
      }
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvataggio non riuscito.')
    } finally {
      setSaving(false)
    }
  }

  const avatarGlyph = glyphFor(avatar, nickname)

  const identityOpts = useMemo(() => IDENTITY_OPTIONS, [])
  const orientationOpts = useMemo(() => ORIENTATION_OPTIONS, [])
  const intentOpts = useMemo(() => INTENT_OPTIONS, [])
  const relStatusOpts = useMemo(() => RELATIONSHIP_STATUS_OPTIONS, [])
  const relTypeOpts = useMemo(() => RELATIONSHIP_TYPE_OPTIONS, [])
  const dietOpts = useMemo(() => DIET_OPTIONS, [])
  const religionOpts = useMemo(() => RELIGION_OPTIONS, [])
  const politicsOpts = useMemo(() => POLITICS_OPTIONS, [])
  const smokingOpts = useMemo(() => SMOKING_OPTIONS, [])
  const sportOpts = useMemo(() => SPORT_OPTIONS, [])

  return (
    <main className="app profile">
      <header className="rooms-header">
        <button type="button" className="link back" onClick={onCancel}>
          ‹ Anteprima
        </button>
        <h1 className="rooms-brand">Modifica profilo</h1>
        <span />
      </header>

      <form className="form profile-form" onSubmit={handleSave}>
        <div className="avatar-preview">
          <span className="avatar-bubble" style={{ background: accent ?? 'var(--accent)' }}>
            {avatarGlyph}
          </span>
          <span className="muted small-inline">@{nickname || '—'}</span>
        </div>

        <PhotoManager userId={profile.id} />

        <fieldset className="field">
          <legend>Avatar</legend>
          <div className="options">
            {AVATAR_PRESETS.map((a) => (
              <button
                type="button"
                key={a.key}
                className={avatar === a.key ? 'avatar-opt sel' : 'avatar-opt'}
                onClick={() => setAvatar(a.key)}
                aria-label={a.key}
              >
                {a.glyph}
              </button>
            ))}
          </div>
          <span className="hint">
            Avatar provvisori: l'illustrazione definitiva arriverà col branding.
          </span>
        </fieldset>

        <fieldset className="field">
          <legend>Colore accento</legend>
          <div className="options">
            {ACCENT_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={accent === c ? 'color-opt sel' : 'color-opt'}
                style={{ background: c }}
                onClick={() => setAccent(c)}
                aria-label={c}
              />
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span>Nickname</span>
          <input
            type="text"
            required
            minLength={3}
            maxLength={24}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Pronomi</span>
          <input
            type="text"
            maxLength={PRONOUNS_MAX}
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            placeholder="es. lei/lei, they/them"
          />
          <label className="declare mini">
            <input
              type="checkbox"
              checked={vis.show_pronouns}
              onChange={(e) => setVisFlag('show_pronouns', e.target.checked)}
            />
            <span>Mostra nel profilo</span>
          </label>
        </label>

        <label className="field">
          <span>
            Bio{' '}
            {bio.length >= BIO_MAX
              ? <span className="limit-warning">raggiunto limite caratteri</span>
              : <span className="muted">({bio.length}/{BIO_MAX})</span>
            }
          </span>
          <textarea
            className={bio.length >= BIO_MAX ? 'textarea textarea--limit' : 'textarea'}
            maxLength={BIO_MAX}
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="due righe su di te…"
          />
        </label>

        <div className="field">
          <span>Città</span>
          <div className="autocomplete">
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => onCityInput(e.target.value)}
              onFocus={() => { if (cityResults.length > 0) setCityOpen(true) }}
              onBlur={() => window.setTimeout(() => setCityOpen(false), 150)}
              placeholder="inizia a digitare il comune…"
              autoComplete="off"
            />
            {cityQuery && (
              <button type="button" className="ac-clear" onClick={clearCity} aria-label="Pulisci città">
                ✕
              </button>
            )}
            {cityOpen && cityResults.length > 0 && (
              <ul className="ac-list">
                {cityResults.map((c) => (
                  <li key={`${c.nome}-${c.sigla}`}>
                    <button
                      type="button"
                      className="ac-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickCity(c)}
                    >
                      {c.nome}{' '}
                      <span className="muted">({c.sigla}) · {c.regione}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {cityOpen && cityResults.length === 0 && normalize(cityQuery).length >= 2 && (
              <ul className="ac-list">
                <li className="ac-empty">Nessun comune trovato</li>
              </ul>
            )}
          </div>
          <label className="declare mini">
            <input
              type="checkbox"
              checked={vis.show_city}
              onChange={(e) => setVisFlag('show_city', e.target.checked)}
            />
            <span>Mostra nel profilo</span>
          </label>
        </div>

        {profile.birth_date && (
          <fieldset className="field">
            <legend>Età e data di nascita</legend>
            <p className="hint">la data di nascita non è modificabile.</p>
            <label className="declare mini">
              <input
                type="checkbox"
                checked={vis.show_age}
                onChange={(e) => setVisFlag('show_age', e.target.checked)}
              />
              <span>Mostra la mia età</span>
            </label>
            <label className="declare mini">
              <input
                type="checkbox"
                checked={vis.show_birth_date}
                onChange={(e) => setVisFlag('show_birth_date', e.target.checked)}
              />
              <span>Mostra la data esatta</span>
            </label>
          </fieldset>
        )}

        <fieldset className="field">
          <legend>Come ti identifichi</legend>
          <div className="options">
            {identityOpts.map((opt) => (
              <label key={opt.value} className="chip">
                <input
                  type="radio"
                  name="identity"
                  checked={identity === opt.value}
                  onChange={() => setIdentity(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          <label className="declare mini">
            <input
              type="checkbox"
              checked={vis.show_identity}
              onChange={(e) => setVisFlag('show_identity', e.target.checked)}
            />
            <span>Mostra nel profilo</span>
          </label>
        </fieldset>

        <fieldset className="field">
          <legend>Orientamento</legend>
          <div className="options">
            {orientationOpts.map((opt) => (
              <label key={opt.value} className="chip">
                <input
                  type="checkbox"
                  checked={orientations.includes(opt.value)}
                  onChange={() => setOrientations(toggle(orientations, opt.value))}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          <label className="declare mini">
            <input
              type="checkbox"
              checked={vis.show_orientation}
              onChange={(e) => setVisFlag('show_orientation', e.target.checked)}
            />
            <span>Mostra nel profilo</span>
          </label>
        </fieldset>

        <fieldset className="field">
          <legend>Stato relazionale</legend>
          <div className="options">
            {relStatusOpts.map((opt) => (
              <label key={opt.value} className="chip">
                <input
                  type="radio"
                  name="relstatus"
                  checked={relStatus === opt.value}
                  onChange={() => setRelStatus(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
            {relStatus && (
              <button type="button" className="link clear-sel" onClick={() => { setRelStatus(null); setRelType(null) }}>
                pulisci
              </button>
            )}
          </div>
          {relStatus === 'in_relazione' && (
            <div className="options sub-options">
              {relTypeOpts.map((opt) => (
                <label key={opt.value} className="chip">
                  <input
                    type="radio"
                    name="reltype"
                    checked={relType === opt.value}
                    onChange={() => setRelType(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          )}
          <label className="declare mini">
            <input
              type="checkbox"
              checked={vis.show_relationship}
              onChange={(e) => setVisFlag('show_relationship', e.target.checked)}
            />
            <span>Mostra nel profilo</span>
          </label>
        </fieldset>

        <fieldset className="field">
          <legend>Cosa cerchi</legend>
          <div className="options">
            {intentOpts.map((opt) => (
              <label key={opt.value} className="chip">
                <input
                  type="checkbox"
                  checked={intents.includes(opt.value)}
                  onChange={() => setIntents(toggle(intents, opt.value))}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          <label className="declare mini">
            <input
              type="checkbox"
              checked={vis.show_intents}
              onChange={(e) => setVisFlag('show_intents', e.target.checked)}
            />
            <span>Mostra nel profilo</span>
          </label>
        </fieldset>

        <fieldset className="field">
          <legend>
            Interessi <span className="muted">({interests.length}/{MAX_INTERESTS})</span>
          </legend>
          {INTEREST_CATEGORIES.map((cat) => (
            <div key={cat.label} className="interest-cat">
              <span className="interest-cat-label">{cat.label}</span>
              <div className="options">
                {cat.options.map((tag) => (
                  <label key={tag} className="chip">
                    <input
                      type="checkbox"
                      checked={interests.includes(tag)}
                      onChange={() => toggleInterest(tag)}
                      disabled={!interests.includes(tag) && interests.length >= MAX_INTERESTS}
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {customInterests.length > 0 && (
            <div className="options">
              {customInterests.map((tag) => (
                <button type="button" key={tag} className="chip sel" onClick={() => toggleInterest(tag)}>
                  {tag} ✕
                </button>
              ))}
            </div>
          )}
          <div className="composer inline-add">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInterest(newInterest) } }}
              placeholder="Altro (specifica)…"
              maxLength={24}
              disabled={interests.length >= MAX_INTERESTS}
            />
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => addInterest(newInterest)}
              disabled={!newInterest.trim() || interests.length >= MAX_INTERESTS}
            >
              Aggiungi
            </button>
          </div>
        </fieldset>

        {[
          { legend: 'Alimentazione', opts: dietOpts, val: diet, name: 'diet', set: setDiet as (v: Diet | null) => void, visKey: 'show_diet' as const },
          { legend: 'Religione & credo', opts: religionOpts, val: religion, name: 'religion', set: setReligion as (v: Religion | null) => void, visKey: 'show_religion' as const, label: null },
          { legend: 'Orientamento politico', opts: politicsOpts, val: politics, name: 'politics', set: setPolitics as (v: Politics | null) => void, visKey: 'show_politics' as const, label: null },
        ].map(({ legend, opts, val, name, set, visKey }) => (
          <fieldset key={name} className="field">
            <legend>{legend}</legend>
            <div className="options">
              {(opts as { value: string; label: string }[]).map((opt) => (
                <label key={opt.value} className="chip">
                  <input
                    type="radio"
                    name={name}
                    checked={val === opt.value}
                    onChange={() => (set as (v: string) => void)(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
              {val && (
                <button type="button" className="link clear-sel" onClick={() => (set as (v: null) => void)(null)}>
                  pulisci
                </button>
              )}
            </div>
            <label className="declare mini">
              <input
                type="checkbox"
                checked={vis[visKey]}
                onChange={(e) => setVisFlag(visKey, e.target.checked)}
              />
              <span>Mostra nel profilo</span>
            </label>
          </fieldset>
        ))}

        <fieldset className="field">
          <legend>Fumo</legend>
          <div className="options">
            {smokingOpts.map((opt) => (
              <label key={opt.value} className="chip">
                <input
                  type="radio"
                  name="smoking"
                  checked={smoking === opt.value}
                  onChange={() => setSmoking(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
            {smoking && (
              <button type="button" className="link clear-sel" onClick={() => setSmoking(null)}>pulisci</button>
            )}
          </div>
          <label className="declare mini">
            <input
              type="checkbox"
              checked={vis.show_smoking}
              onChange={(e) => setVisFlag('show_smoking', e.target.checked)}
            />
            <span>Mostra nel profilo</span>
          </label>
        </fieldset>

        <fieldset className="field">
          <legend>Attività fisica</legend>
          <div className="options">
            {sportOpts.map((opt) => (
              <label key={opt.value} className="chip">
                <input
                  type="radio"
                  name="sport"
                  checked={sport === opt.value}
                  onChange={() => setSport(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
            {sport && (
              <button type="button" className="link clear-sel" onClick={() => setSport(null)}>pulisci</button>
            )}
          </div>
          <label className="declare mini">
            <input
              type="checkbox"
              checked={vis.show_sport}
              onChange={(e) => setVisFlag('show_sport', e.target.checked)}
            />
            <span>Mostra nel profilo</span>
          </label>
        </fieldset>

        {profile.zodiac && (
          <fieldset className="field">
            <legend>Segno zodiacale</legend>
            <p className="hint">
              {ZODIAC_LABELS[profile.zodiac]} · calcolato dalla data di nascita.
            </p>
            <label className="declare mini">
              <input
                type="checkbox"
                checked={vis.show_zodiac}
                onChange={(e) => setVisFlag('show_zodiac', e.target.checked)}
              />
              <span>Mostra nel profilo</span>
            </label>
          </fieldset>
        )}

        {layerEligibility && (
          <fieldset className="field">
            <legend>Il tuo livello</legend>
            <p className="hint">
              Sei al <strong>Strato {layerEligibility.currentLayer}</strong>
              {layerEligibility.nextLayer
                ? ` — per avanzare allo Strato ${layerEligibility.nextLayer}:`
                : ' — hai raggiunto il livello massimo.'}
            </p>
            {layerEligibility.nextLayer && (
              <>
                {layerEligibility.eligible ? (
                  <p className="ok">Hai soddisfatto tutti i requisiti. L'avanzamento avviene automaticamente al tuo prossimo accesso.</p>
                ) : (
                  <ul className="layer-requirements">
                    {layerEligibility.missingDays > 0 && (
                      <li>ancora <strong>{layerEligibility.missingDays} giorni</strong> di permanenza</li>
                    )}
                    {layerEligibility.missingMessages > 0 && (
                      <li>ancora <strong>{layerEligibility.missingMessages} messaggi</strong> in chatroom</li>
                    )}
                  </ul>
                )}
              </>
            )}
          </fieldset>
        )}

        <fieldset className="field">
          <legend>Privacy</legend>
          <label className="declare mini">
            <input
              type="checkbox"
              checked={searchable}
              onChange={(e) => setSearchable(e.target.checked)}
            />
            <span>Sono cercabile (le altre persone possono trovarmi nella ricerca)</span>
          </label>
          <label className="declare mini">
            <input
              type="checkbox"
              checked={vis.show_online}
              onChange={(e) => setVisFlag('show_online', e.target.checked)}
            />
            <span>Mostra quando sono online</span>
          </label>
        </fieldset>

        {profile.strato >= 2 && (
          <fieldset className="field">
            <legend>Chi può scrivermi in privato</legend>
            <div className="options">
              {DM_FILTER_OPTIONS.map((opt) => (
                <label key={opt.value} className="chip">
                  <input
                    type="radio"
                    name="dm_filter"
                    value={opt.value}
                    checked={dmFilter === opt.value}
                    onChange={() => setDmFilter(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <p className="hint">
              Filtra le richieste di messaggio privato che ricevi.
            </p>
          </fieldset>
        )}

        {error && <p className="err">{error}</p>}

        <div className="composer inline-add">
          <button type="button" className="link" onClick={onCancel} disabled={saving}>
            Annulla
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvo…' : 'Salva profilo'}
          </button>
        </div>
      </form>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 className="pf-section-title">Preferenze app</h2>
        <NotificationSettings />
        <div style={{ marginTop: '1.25rem' }}>
          <p className="pf-section-subtitle">Blocco con PIN</p>
          <PinSetupSection />
        </div>
      </section>

      <SupporterButton />
      <DeleteAccountSection profileId={profile.id} />
    </main>
  )
}

function DeleteAccountSection({ profileId }: { profileId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleDelete() {
    setBusy(true)
    setErr(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? 'Errore nella cancellazione.')
      }
      await supabase.auth.signOut()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Errore. Riprova.')
      setBusy(false)
    }
  }

  void profileId
  return (
    <section className="card danger-zone" style={{ marginTop: '1rem' }}>
      <h2 className="pf-section-title">Zona pericolosa</h2>
      {!confirm ? (
        <>
          <p className="hint">
            La cancellazione dell'account è definitiva. Tutti i tuoi messaggi, foto e dati
            saranno rimossi in modo permanente.
          </p>
          <button type="button" className="btn-danger" onClick={() => setConfirm(true)}>
            Cancella il mio account
          </button>
        </>
      ) : (
        <>
          <p className="err">
            Sei sicura? Questa operazione è <strong>irreversibile</strong>.
          </p>
          {err && <p className="err">{err}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn-danger" onClick={handleDelete} disabled={busy}>
              {busy ? 'Cancello…' : 'Sì, cancella definitivamente'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setConfirm(false)} disabled={busy}>
              Annulla
            </button>
          </div>
        </>
      )}
    </section>
  )
}
