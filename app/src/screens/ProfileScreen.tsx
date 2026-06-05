import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import {
  BIO_MAX,
  PRONOUNS_MAX,
  MAX_INTERESTS,
  IDENTITY_OPTIONS,
  ORIENTATION_OPTIONS,
  INTENT_OPTIONS,
  SMOKING_OPTIONS,
  SPORT_OPTIONS,
  INTEREST_SUGGESTIONS,
  ZODIAC_LABELS,
  type IdentityCategory,
  type Orientation,
  type Intent,
  type Smoking,
  type Sport,
  type Profile,
} from '../lib/types'

// Avatar preset: placeholder funzionanti finche' non arriva l'art definitiva
// (vedi profilo_utente.md sez. 4 / branding.md). La chiave viene salvata; il
// glifo e' solo la resa visiva provvisoria.
const AVATAR_PRESETS: { key: string; glyph: string }[] = [
  { key: 'luna', glyph: '🌙' },
  { key: 'stella', glyph: '⭐' },
  { key: 'foglia', glyph: '🌿' },
  { key: 'onda', glyph: '🌊' },
  { key: 'prisma', glyph: '🔮' },
  { key: 'fiore', glyph: '🌸' },
  { key: 'farfalla', glyph: '🦋' },
  { key: 'fiamma', glyph: '🔥' },
]

const ACCENT_COLORS = ['#E8B14E', '#EC6A55', '#7FB7A3', '#9B8CE0', '#E08CB5']

function ageFrom(birth: string | null): number | null {
  if (!birth) return null
  const d = new Date(birth)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

function glyphFor(key: string | null, nickname: string): string {
  return (
    AVATAR_PRESETS.find((a) => a.key === key)?.glyph ||
    nickname.trim().charAt(0).toUpperCase() ||
    '·'
  )
}

function labelOf<T extends string>(
  opts: { value: T; label: string }[],
  v: T,
): string {
  return opts.find((o) => o.value === v)?.label ?? v
}

function labelsOf<T extends string>(
  opts: { value: T; label: string }[],
  vs: T[],
): string {
  return vs.map((v) => labelOf(opts, v)).join(', ')
}

// Normalizza come la colonna `ricerca` della tabella comuni (lower + senza accenti).
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

type Comune = {
  nome: string
  sigla: string
  provincia: string
  regione: string
}

export function ProfileScreen({ onBack }: { onBack: () => void }) {
  const { profile, refreshProfile } = useAuth()
  const [mode, setMode] = useState<'view' | 'edit'>('view')

  if (!profile) return null

  if (mode === 'view') {
    return (
      <ProfilePreview
        profile={profile}
        onBack={onBack}
        onEdit={() => setMode('edit')}
      />
    )
  }
  return (
    <ProfileEditor
      profile={profile}
      onCancel={() => setMode('view')}
      onSaved={async () => {
        await refreshProfile()
        setMode('view')
      }}
    />
  )
}

// --- Anteprima: come ti vedono le altre persone (rispetta i flag show_*) ---

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="pf-row">
      <span className="pf-label">{label}</span>
      <span className="pf-value">{children}</span>
    </div>
  )
}

function ProfilePreview({
  profile,
  onBack,
  onEdit,
}: {
  profile: Profile
  onBack: () => void
  onEdit: () => void
}) {
  const age = ageFrom(profile.birth_date)
  const rows: React.ReactNode[] = []

  if (profile.show_pronouns && profile.pronouns)
    rows.push(
      <Row key="pron" label="Pronomi">
        {profile.pronouns}
      </Row>,
    )
  if (profile.show_city && profile.city)
    rows.push(
      <Row key="city" label="Città">
        {profile.city}
        {profile.city_province ? ` (${profile.city_province})` : ''}
        {profile.city_region ? `, ${profile.city_region}` : ''}
      </Row>,
    )
  if (profile.show_age && age != null)
    rows.push(
      <Row key="age" label="Età">
        {age} anni
      </Row>,
    )
  if (profile.show_birth_date && profile.birth_date)
    rows.push(
      <Row key="bd" label="Data di nascita">
        {new Date(profile.birth_date).toLocaleDateString('it-IT')}
      </Row>,
    )
  if (profile.show_identity)
    rows.push(
      <Row key="id" label="Identità">
        {labelOf(IDENTITY_OPTIONS, profile.identity_category)}
      </Row>,
    )
  if (profile.show_orientation && profile.orientations.length > 0)
    rows.push(
      <Row key="or" label="Orientamento">
        {labelsOf(ORIENTATION_OPTIONS, profile.orientations)}
      </Row>,
    )
  if (profile.show_intents && profile.intents.length > 0)
    rows.push(
      <Row key="in" label="Cosa cerco">
        {labelsOf(INTENT_OPTIONS, profile.intents)}
      </Row>,
    )
  if (profile.interests.length > 0)
    rows.push(
      <Row key="int" label="Interessi">
        {profile.interests.join(', ')}
      </Row>,
    )
  if (profile.show_smoking && profile.smoking)
    rows.push(
      <Row key="sm" label="Fumo">
        {labelOf(SMOKING_OPTIONS, profile.smoking)}
      </Row>,
    )
  if (profile.show_sport && profile.sport)
    rows.push(
      <Row key="sp" label="Sport">
        {labelOf(SPORT_OPTIONS, profile.sport)}
      </Row>,
    )
  if (profile.show_zodiac && profile.zodiac)
    rows.push(
      <Row key="zo" label="Segno">
        {ZODIAC_LABELS[profile.zodiac]}
      </Row>,
    )

  return (
    <main className="app profile">
      <header className="rooms-header">
        <button type="button" className="link back" onClick={onBack}>
          ‹ Stanze
        </button>
        <h1 className="rooms-brand">Il mio profilo</h1>
        <button type="button" className="link" onClick={onEdit}>
          Modifica
        </button>
      </header>

      <p className="hint">Anteprima: così appari alle altre persone.</p>

      <div className="profile-card">
        <div className="avatar-preview">
          <span
            className="avatar-bubble"
            style={{ background: profile.accent_color ?? 'var(--gold)' }}
          >
            {glyphFor(profile.avatar_preset, profile.nickname)}
          </span>
          <span className="pf-nick">@{profile.nickname}</span>
        </div>

        {profile.bio && <p className="pf-bio">{profile.bio}</p>}

        {rows.length > 0 ? (
          <div className="pf-rows">{rows}</div>
        ) : (
          <p className="hint">
            Per ora gli altri vedono solo il tuo nickname e l’avatar. Tocca
            “Modifica” per scegliere cosa mostrare.
          </p>
        )}
      </div>
    </main>
  )
}

// --- Editor: modifica del proprio profilo ---

function ProfileEditor({
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
  const [identity, setIdentity] = useState<IdentityCategory>(
    profile.identity_category,
  )
  const [orientations, setOrientations] = useState<Orientation[]>(
    profile.orientations ?? [],
  )
  const [intents, setIntents] = useState<Intent[]>(profile.intents ?? [])
  const [interests, setInterests] = useState<string[]>(profile.interests ?? [])
  const [newInterest, setNewInterest] = useState('')
  const [smoking, setSmoking] = useState<Smoking | null>(profile.smoking ?? null)
  const [sport, setSport] = useState<Sport | null>(profile.sport ?? null)
  const [avatar, setAvatar] = useState<string | null>(
    profile.avatar_preset ?? null,
  )
  const [accent, setAccent] = useState<string | null>(
    profile.accent_color ?? null,
  )

  // Città con autocompletamento (tabella comuni).
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
    show_smoking: profile.show_smoking,
    show_sport: profile.show_sport,
    show_zodiac: profile.show_zodiac,
    show_online: profile.show_online,
  })
  const [searchable, setSearchable] = useState(profile.is_searchable)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const age = ageFrom(profile.birth_date)

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value)
      ? list.filter((x) => x !== value)
      : [...list, value]
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
    // La città deve essere scelta dall'elenco (o lasciata vuota).
    if (cityQuery.trim() && !citySelected.current) {
      setError('Seleziona la città dall’elenco dei suggerimenti.')
      return
    }

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
          interests,
          smoking,
          sport,
          avatar_preset: avatar,
          accent_color: accent,
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
          <span
            className="avatar-bubble"
            style={{ background: accent ?? 'var(--gold)' }}
          >
            {avatarGlyph}
          </span>
          <span className="muted small-inline">@{nickname || '—'}</span>
        </div>

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
            Avatar provvisori: l’illustrazione definitiva arriverà col branding.
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
            placeholder="es. lei/lei"
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
            <span className="muted">
              ({bio.length}/{BIO_MAX})
            </span>
          </span>
          <textarea
            className="textarea"
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
              onFocus={() => {
                if (cityResults.length > 0) setCityOpen(true)
              }}
              onBlur={() => window.setTimeout(() => setCityOpen(false), 150)}
              placeholder="inizia a digitare il comune…"
              autoComplete="off"
            />
            {cityQuery && (
              <button
                type="button"
                className="ac-clear"
                onClick={clearCity}
                aria-label="Pulisci città"
              >
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
                      <span className="muted">
                        ({c.sigla}) · {c.regione}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {cityOpen &&
              cityResults.length === 0 &&
              normalize(cityQuery).length >= 2 && (
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
            <p className="hint">
              {age != null ? `${age} anni` : '—'} · la data di nascita non è
              modificabile.
            </p>
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
            {IDENTITY_OPTIONS.map((opt) => (
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
            {ORIENTATION_OPTIONS.map((opt) => (
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
          <legend>Cosa cerchi</legend>
          <div className="options">
            {INTENT_OPTIONS.map((opt) => (
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
            Interessi{' '}
            <span className="muted">
              ({interests.length}/{MAX_INTERESTS})
            </span>
          </legend>
          <div className="options">
            {INTEREST_SUGGESTIONS.map((tag) => (
              <label key={tag} className="chip">
                <input
                  type="checkbox"
                  checked={interests.includes(tag)}
                  onChange={() => toggleInterest(tag)}
                  disabled={
                    !interests.includes(tag) && interests.length >= MAX_INTERESTS
                  }
                />
                <span>{tag}</span>
              </label>
            ))}
          </div>
          {interests.filter((t) => !INTEREST_SUGGESTIONS.includes(t)).length >
            0 && (
            <div className="options">
              {interests
                .filter((t) => !INTEREST_SUGGESTIONS.includes(t))
                .map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    className="chip sel"
                    onClick={() => toggleInterest(tag)}
                  >
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addInterest(newInterest)
                }
              }}
              placeholder="aggiungi un interesse…"
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

        <fieldset className="field">
          <legend>Fumo</legend>
          <div className="options">
            {SMOKING_OPTIONS.map((opt) => (
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
              <button
                type="button"
                className="link clear-sel"
                onClick={() => setSmoking(null)}
              >
                pulisci
              </button>
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
          <legend>Sport / attività fisica</legend>
          <div className="options">
            {SPORT_OPTIONS.map((opt) => (
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
              <button
                type="button"
                className="link clear-sel"
                onClick={() => setSport(null)}
              >
                pulisci
              </button>
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

        <fieldset className="field">
          <legend>Privacy</legend>
          <label className="declare mini">
            <input
              type="checkbox"
              checked={searchable}
              onChange={(e) => setSearchable(e.target.checked)}
            />
            <span>
              Sono cercabile (gli altri possono trovarmi nella ricerca)
            </span>
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

        {error && <p className="err">{error}</p>}

        <div className="composer inline-add">
          <button
            type="button"
            className="link"
            onClick={onCancel}
            disabled={saving}
          >
            Annulla
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvo…' : 'Salva profilo'}
          </button>
        </div>
      </form>
    </main>
  )
}
