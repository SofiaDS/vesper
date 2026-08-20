import { useRef, useState, useMemo, useEffect } from 'react'
import {
  Baby,
  BowlFood,
  Broadcast,
  ChatCircleDots,
  Cigarette,
  Compass,
  Eye,
  GraduationCap,
  HandsPraying,
  Heart,
  MagnifyingGlass,
  Medal,
  PawPrint,
  PersonSimpleRun,
  Planet,
  Scales,
  Sparkle,
  Star,
  Translate,
  Trash,
  User,
  Users,
} from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { AppHeader } from '../../components/AppHeader'
import {
  BIO_MAX,
  PRONOUNS_MAX,
  MAX_INTERESTS,
  MAX_LANGUAGES,
  LANGUAGE_MAX_LEN,
  PETS_DETAIL_MAX,
  EDUCATION_INSTITUTE_MAX,
  INTEREST_CATEGORIES,
  INTEREST_SUGGESTIONS,
} from '../../constants/limits'
import {
  IDENTITY_OPTIONS,
  ORIENTATION_OPTIONS,
  INTENT_OPTIONS,
  RELATIONSHIP_STATUS_OPTIONS,
  RELATIONSHIP_TYPE_OPTIONS,
  LANGUAGE_OPTIONS,
  CHILDREN_OPTIONS,
  DIET_OPTIONS,
  RELIGION_OPTIONS,
  POLITICS_OPTIONS,
  EDUCATION_OPTIONS,
  SMOKING_OPTIONS,
  SPORT_OPTIONS,
  DM_FILTER_OPTIONS,
} from '../../constants/options'
import { ZODIAC_LABELS } from '../../constants/labels'
import {
  SingleChoiceField,
  MultiChoiceField,
  VisibilityPill,
  FieldHead,
} from './ChoiceField'
import { FieldSheet } from './FieldSheet'
import { SummaryRows, summarize, type SummaryRow } from './SummaryRows'
import { DeleteAccountSection } from './DeleteAccountSection'
import { normalize, labelOf } from '../../lib/profile/formatters'
import { profileCompletion } from '../../lib/profile/completion'
import { defaultAvatarValue, parseAvatar } from '../../lib/profile/avatars'
import { AvatarPicker, avatarSummary } from './AvatarPicker'
import { Avatar } from '../../components/Avatar'
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
  Language,
  IdentityCategory,
  Orientation,
  Intent,
  RelationshipStatus,
  RelationshipType,
  ChildrenStatus,
  Diet,
  Religion,
  Politics,
  EducationLevel,
  Smoking,
  Sport,
} from '../../types'

type Comune = { nome: string; sigla: string; provincia: string; regione: string }

// Le cinque schede dell'editor (redesign 2F). Un solo form sotto: cambiare
// scheda nasconde dei campi, non ne perde il contenuto, e il salvataggio
// resta uno solo.
type EditorTab = 'base' | 'identita' | 'vita' | 'foto' | 'privacy'

const TABS: { key: EditorTab; label: string }[] = [
  { key: 'base', label: 'Base' },
  { key: 'identita', label: 'Identità' },
  { key: 'vita', label: 'Vita' },
  { key: 'foto', label: 'Foto' },
  { key: 'privacy', label: 'Privacy' },
]

const PHOTO_STATUS_LABEL: Record<PhotoStatus, string> = {
  pending: 'In revisione',
  approved: 'Approvata',
  rejected: 'Rifiutata',
}

// Elenco riassuntivo dei flag show_* nella scheda Privacy: un posto solo dove
// vedere e cambiare tutto quello che è pubblico, senza girare le altre schede.
// `show_online` non c'è: non riguarda un campo del profilo e ha già il suo
// interruttore dedicato più in alto.
const VIS_FIELDS: { key: VisKey; label: string }[] = [
  { key: 'show_pronouns', label: 'Pronomi' },
  { key: 'show_age', label: 'Età' },
  { key: 'show_birth_date', label: 'Data di nascita' },
  { key: 'show_identity', label: 'Come ti identifichi' },
  { key: 'show_orientation', label: 'Orientamento' },
  { key: 'show_city', label: 'Città' },
  { key: 'show_intents', label: 'Cosa cerchi' },
  { key: 'show_relationship', label: 'Stato relazionale' },
  { key: 'show_languages', label: 'Lingue parlate' },
  { key: 'show_education', label: 'Formazione' },
  { key: 'show_diet', label: 'Alimentazione' },
  { key: 'show_religion', label: 'Religione & credo' },
  { key: 'show_politics', label: 'Orientamento politico' },
  { key: 'show_children', label: 'Figli' },
  { key: 'show_smoking', label: 'Fumo' },
  { key: 'show_sport', label: 'Attività fisica' },
  { key: 'show_pets', label: 'Animali domestici' },
  { key: 'show_zodiac', label: 'Segno zodiacale' },
]

type VisKey =
  | 'show_age'
  | 'show_birth_date'
  | 'show_identity'
  | 'show_orientation'
  | 'show_city'
  | 'show_pronouns'
  | 'show_intents'
  | 'show_relationship'
  | 'show_languages'
  | 'show_children'
  | 'show_pets'
  | 'show_diet'
  | 'show_religion'
  | 'show_politics'
  | 'show_education'
  | 'show_smoking'
  | 'show_sport'
  | 'show_zodiac'
  | 'show_online'

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
      {err && <p className="err" role="alert">{err}</p>}
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
  const [languages, setLanguages] = useState<string[]>(profile.languages ?? [])
  const [newLanguage, setNewLanguage] = useState('')
  const [childrenStatus, setChildrenStatus] = useState<ChildrenStatus | null>(profile.children_status ?? null)
  const [hasPets, setHasPets] = useState<boolean | null>(profile.has_pets ?? null)
  const [petsDetail, setPetsDetail] = useState(profile.pets_detail ?? '')
  const [diet, setDiet] = useState<Diet | null>(profile.diet ?? null)
  const [religion, setReligion] = useState<Religion | null>(profile.religion ?? null)
  const [politics, setPolitics] = useState<Politics | null>(profile.politics ?? null)
  const [educationLevel, setEducationLevel] = useState<EducationLevel | null>(profile.education_level ?? null)
  const [educationInstitute, setEducationInstitute] = useState(profile.education_institute ?? '')
  const [interests, setInterests] = useState<string[]>(profile.interests ?? [])
  const [newInterest, setNewInterest] = useState('')
  const [smoking, setSmoking] = useState<Smoking | null>(profile.smoking ?? null)
  const [sport, setSport] = useState<Sport | null>(profile.sport ?? null)
  // Chi non ha ancora un avatar — o ne ha uno nel vecchio formato, con gli
  // stili di DiceBear v9 che non esistono più — parte da quello di default sul
  // proprio id: l'avatar non è una casella da riempire, ce l'hanno tutte.
  // Aprendo l'editor e salvando, il valore vecchio si allinea al nuovo formato.
  const [avatar, setAvatar] = useState<string>(
    parseAvatar(profile.avatar_preset) ? profile.avatar_preset! : defaultAvatarValue(profile.id),
  )
  const [dmFilter, setDmFilter] = useState(profile.dm_filter)

  // Data di nascita: facoltativa e inseribile una sola volta (finché il profilo
  // non ne ha una). Da qui deriva l'età usata nei filtri di ricerca e nel
  // profilo. Una volta salvata non è più modificabile dall'editor.
  const [birthDate, setBirthDate] = useState('')
  // Data massima selezionabile = oggi meno 18 anni (vincolo 18+ lato app).
  const maxBirthDate = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 18)
    return d.toISOString().slice(0, 10)
  })()

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
    show_languages: profile.show_languages,
    show_children: profile.show_children,
    show_pets: profile.show_pets,
    show_diet: profile.show_diet,
    show_religion: profile.show_religion,
    show_politics: profile.show_politics,
    show_education: profile.show_education,
    show_smoking: profile.show_smoking,
    show_sport: profile.show_sport,
    show_zodiac: profile.show_zodiac,
    show_online: profile.show_online,
  })
  const [searchable, setSearchable] = useState(profile.is_searchable)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [layerEligibility, setLayerEligibility] = useState<LayerEligibility | null>(null)

  // Stato del redesign 2F: scheda attiva, foglio di campo aperto (chiave del
  // campo, `null` se chiuso) e quali gruppi di chip sono stati espansi oltre
  // i primi sei.
  const [tab, setTab] = useState<EditorTab>('base')
  const [openSheet, setOpenSheet] = useState<string | null>(null)
  const [expandedChips, setExpandedChips] = useState<Record<string, boolean>>({})

  useEffect(() => {
    checkLayerEligibility()
      .then((e) => setLayerEligibility(e))
      .catch(() => {})
  }, [profile.id])

  // Cambiando scheda il contenuto è tutt'altro: senza questo si resterebbe a
  // metà pagina, davanti a campi diversi da quelli che si stava guardando.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab])

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
  }

  function setVisFlag(key: VisKey, value: boolean) {
    setVis((prev) => ({ ...prev, [key]: value }))
  }

  function expand(key: string) {
    setExpandedChips((prev) => ({ ...prev, [key]: true }))
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

  function addLanguage(raw: string) {
    const tag = raw.trim().toLowerCase()
    if (!tag) return
    setLanguages((prev) => {
      if (prev.includes(tag) || prev.length >= MAX_LANGUAGES) return prev
      return [...prev, tag]
    })
    setNewLanguage('')
  }

  function toggleLanguage(tag: string) {
    setLanguages((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length >= MAX_LANGUAGES
          ? prev
          : [...prev, tag],
    )
  }

  const customLanguages = languages.filter((t) => !LANGUAGE_OPTIONS.some((o) => o.value === t))

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

  // Il campo che ha fatto fallire la validazione può stare in una scheda che
  // non è quella aperta: senza portarci sopra l'utente leggerebbe un errore
  // senza vedere a cosa si riferisce.
  function fail(message: string, where: EditorTab) {
    setTab(where)
    setError(message)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const nick = nickname.trim()
    if (nick.length < 3 || nick.length > 24) {
      fail('Il nickname deve avere tra 3 e 24 caratteri.', 'base')
      return
    }
    if (bio.length > BIO_MAX) {
      fail(`La bio non può superare i ${BIO_MAX} caratteri.`, 'base')
      return
    }
    if (pronouns.length > PRONOUNS_MAX) {
      fail(`I pronomi non possono superare i ${PRONOUNS_MAX} caratteri.`, 'base')
      return
    }
    if (hasPets && petsDetail.length > PETS_DETAIL_MAX) {
      fail(
        `La specifica sugli animali domestici non può superare i ${PETS_DETAIL_MAX} caratteri.`,
        'vita',
      )
      return
    }
    if (educationInstitute.length > EDUCATION_INSTITUTE_MAX) {
      fail(
        `Il nome di scuola/università non può superare i ${EDUCATION_INSTITUTE_MAX} caratteri.`,
        'vita',
      )
      return
    }
    if (cityQuery.trim() && !citySelected.current) {
      fail("Seleziona la città dall'elenco dei suggerimenti.", 'base')
      return
    }
    // Data di nascita: si salva solo la prima volta (finché il profilo non ne ha
    // già una). Ricontrolliamo il vincolo 18+ oltre al `max` dell'input, che un
    // utente potrebbe aggirare.
    const birthDateToSave = !profile.birth_date && birthDate ? birthDate : null
    if (birthDateToSave && birthDateToSave > maxBirthDate) {
      fail('Devi avere almeno 18 anni per inserire la data di nascita.', 'base')
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
          languages,
          children_status: childrenStatus,
          has_pets: hasPets,
          pets_detail: hasPets ? petsDetail.trim() || null : null,
          diet,
          religion,
          politics,
          education_level: educationLevel,
          education_institute: educationInstitute.trim() || null,
          interests,
          smoking,
          sport,
          avatar_preset: avatar,
          dm_filter: dmFilter,
          ...(birthDateToSave ? { birth_date: birthDateToSave } : {}),
          ...vis,
          is_searchable: searchable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
      if (updErr) {
        if (updErr.code === '23505') {
          throw new Error('Questo nickname è già in uso, scegline un altro.')
        }
        // 23514 = CHECK violato: una delle liste in constants/options.ts offre un
        // valore che il DB non ammette più (è già successo con `intents`, vedi
        // 20260820000000_sync_profile_checks). Senza questo ramo l'utente vede il
        // messaggio grezzo di Postgres e noi non capiamo quale campo sia.
        if (updErr.code === '23514') {
          console.error('CHECK violato nel salvataggio profilo:', updErr.message)
          throw new Error('Una delle opzioni selezionate non è più valida. Ricontrolla i campi del profilo.')
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

  const identityOpts = useMemo(() => IDENTITY_OPTIONS, [])
  const orientationOpts = useMemo(() => ORIENTATION_OPTIONS, [])
  const intentOpts = useMemo(() => INTENT_OPTIONS, [])
  const relStatusOpts = useMemo(() => RELATIONSHIP_STATUS_OPTIONS, [])
  const relTypeOpts = useMemo(() => RELATIONSHIP_TYPE_OPTIONS, [])
  const languageOpts = useMemo(() => LANGUAGE_OPTIONS, [])

  // Barra di completamento: legge lo stato del form (non il profilo salvato),
  // così la percentuale si muove mentre si compila.
  const completion = profileCompletion({
    pronouns,
    bio,
    city: citySelected.current ? cityName : null,
    birth_date: profile.birth_date ?? (birthDate || null),
    identity_category: identity,
    orientations,
    intents,
    relationship_status: relStatus,
    languages,
    interests,
    children_status: childrenStatus,
    has_pets: hasPets,
    diet,
    religion,
    politics,
    education_level: educationLevel,
    smoking,
    sport,
  })

  // ── Righe riassuntive + foglio di campo ───────────────────────────────
  // Le schede «Vita», «Identità» e «Privacy» hanno tutte la stessa forma:
  // un elenco di righe (icona, titolo, valore corrente) che toccate aprono
  // in basso il foglio con i chip di quel campo. Descrivere ogni riga in una
  // lista evita venti blocchi di markup identici — e la scheda si legge in un
  // colpo d'occhio invece di essere un form da scorrere.
  const lifeFields: SummaryRow[] = [
    {
      key: 'education',
      label: 'Formazione',
      icon: GraduationCap,
      visible: vis.show_education,
      value:
        educationLevel && educationLevel !== 'preferisco_non_specificare'
          ? labelOf(EDUCATION_OPTIONS, educationLevel) +
            (educationInstitute.trim() ? ` · ${educationInstitute.trim()}` : '')
          : null,
      body: (
        <SingleChoiceField
          legend="Formazione"
          name="education"
          options={EDUCATION_OPTIONS}
          value={educationLevel}
          onChange={(v) => setEducationLevel(v)}
          expanded={!!expandedChips.education}
          onExpand={() => expand('education')}
          visibility={
            <VisibilityPill
              field="Formazione"
              checked={vis.show_education}
              onChange={(v) => setVisFlag('show_education', v)}
            />
          }
        >
          <div className="composer inline-add">
            <input
              type="text"
              value={educationInstitute}
              onChange={(e) => setEducationInstitute(e.target.value)}
              placeholder="Scuola, Università o Ente (opzionale)…"
              maxLength={EDUCATION_INSTITUTE_MAX}
              aria-label="Scuola, Università o Ente"
            />
            <span className="muted">{educationInstitute.length}/{EDUCATION_INSTITUTE_MAX}</span>
          </div>
        </SingleChoiceField>
      ),
    },
    {
      key: 'diet',
      label: 'Alimentazione',
      icon: BowlFood,
      value: diet ? labelOf(DIET_OPTIONS, diet) : null,
      visible: vis.show_diet,
      body: (
        <SingleChoiceField
          legend="Alimentazione"
          name="diet"
          options={DIET_OPTIONS}
          value={diet}
          onChange={(v) => setDiet(v)}
          expanded={!!expandedChips.diet}
          onExpand={() => expand('diet')}
          visibility={
            <VisibilityPill
              field="Alimentazione"
              checked={vis.show_diet}
              onChange={(v) => setVisFlag('show_diet', v)}
            />
          }
        />
      ),
    },
    {
      key: 'religion',
      label: 'Religione & credo',
      icon: HandsPraying,
      value: religion ? labelOf(RELIGION_OPTIONS, religion) : null,
      visible: vis.show_religion,
      body: (
        <SingleChoiceField
          legend="Religione & credo"
          name="religion"
          options={RELIGION_OPTIONS}
          value={religion}
          onChange={(v) => setReligion(v)}
          expanded={!!expandedChips.religion}
          onExpand={() => expand('religion')}
          visibility={
            <VisibilityPill
              field="Religione e credo"
              checked={vis.show_religion}
              onChange={(v) => setVisFlag('show_religion', v)}
            />
          }
        />
      ),
    },
    {
      key: 'politics',
      label: 'Orientamento politico',
      icon: Scales,
      value: politics ? labelOf(POLITICS_OPTIONS, politics) : null,
      visible: vis.show_politics,
      body: (
        <SingleChoiceField
          legend="Orientamento politico"
          name="politics"
          options={POLITICS_OPTIONS}
          value={politics}
          onChange={(v) => setPolitics(v)}
          expanded={!!expandedChips.politics}
          onExpand={() => expand('politics')}
          visibility={
            <VisibilityPill
              field="Orientamento politico"
              checked={vis.show_politics}
              onChange={(v) => setVisFlag('show_politics', v)}
            />
          }
        />
      ),
    },
    {
      key: 'children',
      label: 'Figli',
      icon: Baby,
      value: childrenStatus ? labelOf(CHILDREN_OPTIONS, childrenStatus) : null,
      visible: vis.show_children,
      body: (
        <SingleChoiceField
          legend="Figli"
          name="children"
          options={CHILDREN_OPTIONS}
          value={childrenStatus}
          onChange={(v) => setChildrenStatus(v)}
          visibility={
            <VisibilityPill
              field="Figli"
              checked={vis.show_children}
              onChange={(v) => setVisFlag('show_children', v)}
            />
          }
        />
      ),
    },
    {
      key: 'smoking',
      label: 'Fumo',
      icon: Cigarette,
      value: smoking ? labelOf(SMOKING_OPTIONS, smoking) : null,
      visible: vis.show_smoking,
      body: (
        <SingleChoiceField
          legend="Fumo"
          name="smoking"
          options={SMOKING_OPTIONS}
          value={smoking}
          onChange={(v) => setSmoking(v)}
          visibility={
            <VisibilityPill
              field="Fumo"
              checked={vis.show_smoking}
              onChange={(v) => setVisFlag('show_smoking', v)}
            />
          }
        />
      ),
    },
    {
      key: 'sport',
      label: 'Attività fisica',
      icon: PersonSimpleRun,
      value: sport ? labelOf(SPORT_OPTIONS, sport) : null,
      visible: vis.show_sport,
      body: (
        <SingleChoiceField
          legend="Attività fisica"
          name="sport"
          options={SPORT_OPTIONS}
          value={sport}
          onChange={(v) => setSport(v)}
          visibility={
            <VisibilityPill
              field="Attività fisica"
              checked={vis.show_sport}
              onChange={(v) => setVisFlag('show_sport', v)}
            />
          }
        />
      ),
    },
    {
      key: 'pets',
      label: 'Animali domestici',
      icon: PawPrint,
      value:
        hasPets == null
          ? null
          : hasPets
            ? petsDetail.trim()
              ? `sì — ${petsDetail.trim()}`
              : 'sì'
            : 'no',
      visible: vis.show_pets,
      body: (
        <div className="field pf-field" role="group" aria-labelledby="pf-pets-title">
          <FieldHead
            legend="Animali domestici"
            titleId="pf-pets-title"
            visibility={
              <VisibilityPill
                field="Animali domestici"
                checked={vis.show_pets}
                onChange={(v) => setVisFlag('show_pets', v)}
              />
            }
          />
          <div className="options">
            <label className="chip">
              <input
                type="radio"
                name="pets"
                checked={hasPets === true}
                onChange={() => setHasPets(true)}
              />
              <span>Sì</span>
            </label>
            <label className="chip">
              <input
                type="radio"
                name="pets"
                checked={hasPets === false}
                onChange={() => { setHasPets(false); setPetsDetail('') }}
              />
              <span>No</span>
            </label>
            {hasPets !== null && (
              <button
                type="button"
                className="link clear-sel"
                onClick={() => { setHasPets(null); setPetsDetail('') }}
              >
                pulisci
              </button>
            )}
          </div>
          {hasPets === true && (
            <div className="composer inline-add">
              <input
                type="text"
                value={petsDetail}
                onChange={(e) => setPetsDetail(e.target.value)}
                placeholder="Specifica (es. un gatto e un cane)…"
                maxLength={PETS_DETAIL_MAX}
                aria-label="Quali animali"
              />
              <span className="muted">{petsDetail.length}/{PETS_DETAIL_MAX}</span>
            </div>
          )}
        </div>
      ),
    },
  ]

  // ── Scheda «Base»: l'unica riga riassuntiva, per l'avatar ─────────────
  const avatarFields: SummaryRow[] = [
    {
      key: 'avatar',
      label: 'Avatar',
      icon: Planet,
      value: avatarSummary(avatar),
      body: (
        <AvatarPicker
          value={avatar}
          seed={profile.id}
          nickname={nickname}
          onChange={setAvatar}
        />
      ),
    },
  ]

  // ── Scheda «Identità» ─────────────────────────────────────────────────
  const identityFields: SummaryRow[] = [
    {
      key: 'identity',
      label: 'Come ti identifichi',
      icon: User,
      visible: vis.show_identity,
      value:
        identity !== 'preferisco_non_specificare' ? labelOf(identityOpts, identity) : null,
      body: (
        <SingleChoiceField
          legend="Come ti identifichi"
          name="identity"
          options={identityOpts}
          value={identity}
          clearable={false}
          onChange={(v) => setIdentity(v ?? 'preferisco_non_specificare')}
          expanded={!!expandedChips.identity}
          onExpand={() => expand('identity')}
          visibility={
            <VisibilityPill
              field="Come ti identifichi"
              checked={vis.show_identity}
              onChange={(v) => setVisFlag('show_identity', v)}
            />
          }
        />
      ),
    },
    {
      key: 'orientation',
      label: 'Orientamento',
      icon: Heart,
      visible: vis.show_orientation,
      value: summarize(orientations.map((o) => labelOf(orientationOpts, o))),
      body: (
        <MultiChoiceField
          legend="Orientamento"
          options={orientationOpts}
          selected={orientations}
          onToggle={(v) => setOrientations(toggle(orientations, v))}
          expanded={!!expandedChips.orientation}
          onExpand={() => expand('orientation')}
          visibility={
            <VisibilityPill
              field="Orientamento"
              checked={vis.show_orientation}
              onChange={(v) => setVisFlag('show_orientation', v)}
            />
          }
        />
      ),
    },
    {
      key: 'intents',
      label: 'Cosa cerchi',
      icon: Compass,
      visible: vis.show_intents,
      value: summarize(intents.map((i) => labelOf(intentOpts, i))),
      body: (
        <MultiChoiceField
          legend="Cosa cerchi"
          options={intentOpts}
          selected={intents}
          onToggle={(v) => setIntents(toggle(intents, v))}
          expanded={!!expandedChips.intents}
          onExpand={() => expand('intents')}
          visibility={
            <VisibilityPill
              field="Cosa cerchi"
              checked={vis.show_intents}
              onChange={(v) => setVisFlag('show_intents', v)}
            />
          }
        />
      ),
    },
    {
      key: 'relationship',
      label: 'Stato relazionale',
      icon: Users,
      visible: vis.show_relationship,
      value: relStatus
        ? labelOf(relStatusOpts, relStatus) +
          (relStatus === 'in_relazione' && relType ? ` · ${labelOf(relTypeOpts, relType)}` : '')
        : null,
      body: (
        <SingleChoiceField
          legend="Stato relazionale"
          name="relstatus"
          options={relStatusOpts}
          value={relStatus}
          onChange={(v) => { setRelStatus(v); if (!v) setRelType(null) }}
          visibility={
            <VisibilityPill
              field="Stato relazionale"
              checked={vis.show_relationship}
              onChange={(v) => setVisFlag('show_relationship', v)}
            />
          }
        >
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
        </SingleChoiceField>
      ),
    },
    {
      key: 'interests',
      label: 'Interessi',
      icon: Sparkle,
      // Gli interessi non hanno un flag show_*: sono sempre pubblici, quindi
      // niente occhio su questa riga.
      value: summarize(interests),
      body: (
        <div className="field pf-field" role="group" aria-labelledby="pf-interests-title">
          <FieldHead
            legend={
              <>
                Interessi <span className="muted">({interests.length}/{MAX_INTERESTS})</span>
              </>
            }
            titleId="pf-interests-title"
          />
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
              aria-label="Aggiungi un interesse"
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
        </div>
      ),
    },
    {
      key: 'languages',
      label: 'Lingue',
      icon: Translate,
      visible: vis.show_languages,
      value: summarize(languages.map((l) => labelOf(languageOpts, l as Language))),
      body: (
        <div className="field pf-field" role="group" aria-labelledby="pf-lang-title">
          <FieldHead
            legend={
              <>
                Lingue parlate{' '}
                <span className="muted">({languages.length}/{MAX_LANGUAGES})</span>
              </>
            }
            titleId="pf-lang-title"
            visibility={
              <VisibilityPill
                field="Lingue parlate"
                checked={vis.show_languages}
                onChange={(v) => setVisFlag('show_languages', v)}
              />
            }
          />
          <div className="options">
            {languageOpts.map((opt) => (
              <label key={opt.value} className="chip">
                <input
                  type="checkbox"
                  checked={languages.includes(opt.value)}
                  onChange={() => toggleLanguage(opt.value)}
                  disabled={!languages.includes(opt.value) && languages.length >= MAX_LANGUAGES}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {customLanguages.length > 0 && (
            <div className="options">
              {customLanguages.map((tag) => (
                <button type="button" key={tag} className="chip sel" onClick={() => toggleLanguage(tag)}>
                  {tag} ✕
                </button>
              ))}
            </div>
          )}
          <div className="composer inline-add">
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLanguage(newLanguage) } }}
              placeholder="Altra lingua…"
              maxLength={LANGUAGE_MAX_LEN}
              disabled={languages.length >= MAX_LANGUAGES}
              aria-label="Aggiungi una lingua"
            />
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => addLanguage(newLanguage)}
              disabled={!newLanguage.trim() || languages.length >= MAX_LANGUAGES}
            >
              Aggiungi
            </button>
          </div>
        </div>
      ),
    },
    // Il segno è una colonna generata dal DB: la riga compare solo se c'è una
    // data di nascita da cui ricavarlo, e nel foglio si può solo mostrarlo o
    // nasconderlo.
    ...(profile.zodiac
      ? [{
          key: 'zodiac',
          label: 'Segno zodiacale',
          icon: Star,
          visible: vis.show_zodiac,
          value: `${ZODIAC_LABELS[profile.zodiac]} · non modificabile`,
          body: (
            <div className="field pf-field" role="group" aria-labelledby="pf-zodiac-title">
              <FieldHead
                legend="Segno zodiacale"
                titleId="pf-zodiac-title"
                visibility={
                  <VisibilityPill
                    field="Segno zodiacale"
                    checked={vis.show_zodiac}
                    onChange={(v) => setVisFlag('show_zodiac', v)}
                  />
                }
              />
              <p className="hint">
                {ZODIAC_LABELS[profile.zodiac]} · calcolato dalla data di nascita,
                non si può cambiare.
              </p>
            </div>
          ),
        } satisfies SummaryRow]
      : []),
  ]

  // ── Scheda «Privacy» ──────────────────────────────────────────────────
  const visibleFieldNames = VIS_FIELDS.filter((f) => vis[f.key]).map((f) => f.label.toLowerCase())

  const privacyFields: SummaryRow[] = [
    {
      key: 'searchable',
      label: 'Profilo trovabile',
      icon: MagnifyingGlass,
      value: 'appari nei risultati di ricerca',
      state: { text: searchable ? 'attivo' : 'nascosto', on: searchable },
      body: (
        <div className="field pf-field" role="group" aria-labelledby="pf-searchable-title">
          <FieldHead legend="Profilo trovabile" titleId="pf-searchable-title" />
          <div className="options">
            {[true, false].map((v) => (
              <label key={String(v)} className="chip">
                <input
                  type="radio"
                  name="searchable"
                  checked={searchable === v}
                  onChange={() => setSearchable(v)}
                />
                <span>{v ? 'attivo' : 'nascosto'}</span>
              </label>
            ))}
          </div>
          <p className="hint">
            Da «nascosto» nessuno può trovarti dalla ricerca. Chi ha già una
            conversazione con te continua a vederti.
          </p>
        </div>
      ),
    },
    {
      key: 'online',
      label: 'Stato online',
      icon: Broadcast,
      value: 'mostra quando sei attiva',
      state: { text: vis.show_online ? 'visibile' : 'nascosto', on: vis.show_online },
      body: (
        <div className="field pf-field" role="group" aria-labelledby="pf-online-title">
          <FieldHead legend="Stato online" titleId="pf-online-title" />
          <div className="options">
            {[true, false].map((v) => (
              <label key={String(v)} className="chip">
                <input
                  type="radio"
                  name="show_online"
                  checked={vis.show_online === v}
                  onChange={() => setVisFlag('show_online', v)}
                />
                <span>{v ? 'visibile' : 'nascosto'}</span>
              </label>
            ))}
          </div>
        </div>
      ),
    },
    // Il filtro sulle richieste di DM ha senso solo da Strato 2, quando si
    // iniziano a ricevere messaggi privati.
    ...(profile.strato >= 2
      ? [{
          key: 'dmfilter',
          label: 'Chi può scriverti',
          icon: ChatCircleDots,
          value: labelOf(DM_FILTER_OPTIONS, dmFilter),
          body: (
            <div className="field pf-field" role="group" aria-labelledby="pf-dmfilter-title">
              <FieldHead legend="Chi può scriverti in privato" titleId="pf-dmfilter-title" />
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
              <p className="hint">Filtra le richieste di messaggio privato che ricevi.</p>
            </div>
          ),
        } satisfies SummaryRow]
      : []),
    {
      key: 'visfields',
      label: 'Campi visibili nel profilo',
      icon: Eye,
      value: summarize(visibleFieldNames) ?? 'nessun campo visibile',
      body: (
        <div className="field pf-field" role="group" aria-labelledby="pf-visfields-title">
          <FieldHead legend="Campi visibili nel profilo" titleId="pf-visfields-title" />
          <p className="hint">
            Ogni campo del profilo, con lo stesso interruttore che trovi nella sua
            scheda. Quello che è «nascosto» resta solo tuo.
          </p>
          <div className="pf-vis-list">
            {VIS_FIELDS.map((f) => (
              <div key={f.key} className="pf-vis-row">
                <span>{f.label}</span>
                <VisibilityPill
                  field={f.label}
                  checked={vis[f.key]}
                  onChange={(v) => setVisFlag(f.key, v)}
                />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    ...(layerEligibility
      ? [{
          key: 'layer',
          label: 'Il tuo livello',
          icon: Medal,
          value: `strato ${layerEligibility.currentLayer}`,
          body: (
            <div className="field pf-field" role="group" aria-labelledby="pf-layer-title">
              <FieldHead legend="Il tuo livello" titleId="pf-layer-title" />
              <p className="hint">
                Sei al <strong>Strato {layerEligibility.currentLayer}</strong>
                {layerEligibility.nextLayer
                  ? ` — per avanzare allo Strato ${layerEligibility.nextLayer}:`
                  : ' — hai raggiunto il livello massimo.'}
              </p>
              {layerEligibility.nextLayer && (
                <>
                  {layerEligibility.eligible ? (
                    <p className="ok" role="status">Hai soddisfatto tutti i requisiti. L'avanzamento avviene automaticamente al tuo prossimo accesso.</p>
                  ) : (
                    <>
                      {(layerEligibility.missingHours > 0 || layerEligibility.missingMessages > 0) && (
                        <ul className="layer-requirements">
                          {layerEligibility.missingHours > 0 && (
                            <li>
                              ancora{' '}
                              <strong>
                                {layerEligibility.missingHours >= 24
                                  ? `${Math.ceil(layerEligibility.missingHours / 24)} giorni`
                                  : `${layerEligibility.missingHours} ore`}
                              </strong>{' '}
                              di permanenza
                            </li>
                          )}
                          {layerEligibility.missingMessages > 0 && (
                            <li>ancora <strong>{layerEligibility.missingMessages} messaggi</strong> in chatroom</li>
                          )}
                        </ul>
                      )}
                      {!layerEligibility.reputationOk && (
                        <p className="hint">
                          Per ora non hai ancora i requisiti per scrivere messaggi privati.
                          Continua a partecipare in modo positivo nelle chat: la situazione si aggiorna
                          automaticamente nel tempo.
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          ),
        } satisfies SummaryRow]
      : []),
    {
      key: 'delete',
      label: 'Elimina account',
      icon: Trash,
      danger: true,
      value: null,
      emptyText: 'cancellazione definitiva',
      body: <DeleteAccountSection profileId={profile.id} />,
    },
  ]

  const sheetField =
    [...avatarFields, ...lifeFields, ...identityFields, ...privacyFields].find((f) => f.key === openSheet) ?? null

  return (
    <main className="app profile">
      <AppHeader backLabel="‹ Anteprima" onBack={onCancel} title="Modifica profilo" />

      {/* Non è un vero tablist (niente tabpanel né navigazione con le frecce):
          usiamo bottoni con aria-pressed, come già fa il selettore di avatar. */}
      <div className="pf-etabs" role="group" aria-label="Sezioni del profilo">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pf-progress">
        <div className="pf-progress-head">
          <span>Profilo compilato</span>
          <span className="pf-progress-pct">{completion.percent}%</span>
        </div>
        <div
          className="pf-progress-track"
          role="progressbar"
          aria-valuenow={completion.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Profilo compilato al ${completion.percent} per cento: ${completion.filled} campi su ${completion.total}`}
        >
          <div className="pf-progress-fill" style={{ width: `${completion.percent}%` }} />
        </div>
      </div>

      <form className="form profile-form" onSubmit={handleSave}>
        {tab === 'base' && (
          <>
            <div className="avatar-preview">
              <span className="avatar-bubble">
                <Avatar preset={avatar} nickname={nickname} />
              </span>
              <span className="muted small-inline">@{nickname || '—'}</span>
            </div>

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

            <SummaryRows rows={avatarFields} openKey={openSheet} onOpen={setOpenSheet} />

            {/* Un <div>, non un <label>: la pillola occhio è un bottone, e un
                bottone dentro l'etichetta di un campo ne ruberebbe il click. */}
            <div className="field">
              <label className="field">
                <span>Pronomi</span>
                <input
                  type="text"
                  maxLength={PRONOUNS_MAX}
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  placeholder="es. lei/lei, they/them"
                />
              </label>
              <VisibilityPill
                field="Pronomi"
                checked={vis.show_pronouns}
                onChange={(v) => setVisFlag('show_pronouns', v)}
              />
            </div>

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
                  aria-label="Città"
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
              {/* La regione non è un campo a sé: si ricava dal comune scelto e finisce
                  in city_region, che alimenta il filtro "Regione" della ricerca. Senza
                  questo avviso l'utente non ha modo di sapere che scegliendo la città
                  diventa trovabile anche per regione. Stesso pattern del segno
                  zodiacale, che è pure derivato (dalla data di nascita). */}
              {cityRegion && (
                <p className="hint">
                  Regione: <strong>{cityRegion}</strong> · derivata dalla città. Se
                  mostri la città nel profilo, le altre persone possono trovarti anche
                  filtrando per regione.
                </p>
              )}
              <VisibilityPill
                field="Città"
                checked={vis.show_city}
                onChange={(v) => setVisFlag('show_city', v)}
              />
            </div>

            <fieldset className="field">
              <legend>Età e data di nascita</legend>
              {profile.birth_date ? (
                <p className="hint">la data di nascita non è modificabile.</p>
              ) : (
                <label className="field">
                  <span>Data di nascita (facoltativa)</span>
                  <input
                    type="date"
                    value={birthDate}
                    max={maxBirthDate}
                    min="1900-01-01"
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                  <p className="hint">
                    Devi avere almeno 18 anni. Una volta salvata non sarà più
                    modificabile. Serve per mostrare la tua età e per i filtri di ricerca.
                  </p>
                </label>
              )}
              {(profile.birth_date || birthDate) && (
                <div className="pf-vis-list">
                  <div className="pf-vis-row">
                    <span>La mia età</span>
                    <VisibilityPill
                      field="Età"
                      checked={vis.show_age}
                      onChange={(v) => setVisFlag('show_age', v)}
                    />
                  </div>
                  <div className="pf-vis-row">
                    <span>La data esatta</span>
                    <VisibilityPill
                      field="Data di nascita esatta"
                      checked={vis.show_birth_date}
                      onChange={(v) => setVisFlag('show_birth_date', v)}
                    />
                  </div>
                </div>
              )}
            </fieldset>
          </>
        )}

        {tab === 'identita' && (
          <SummaryRows rows={identityFields} openKey={openSheet} onOpen={setOpenSheet} />
        )}

        {tab === 'vita' && (
          <SummaryRows rows={lifeFields} openKey={openSheet} onOpen={setOpenSheet} />
        )}

        {tab === 'foto' && <PhotoManager userId={profile.id} />}

        {tab === 'privacy' && (
          <SummaryRows rows={privacyFields} openKey={openSheet} onOpen={setOpenSheet} />
        )}

        {error && <p className="err" role="alert">{error}</p>}

        <div className="pf-savebar">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
            Annulla
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvo…' : 'Salva profilo'}
          </button>
        </div>
      </form>

      {/* Il foglio sta fuori dal <form>: dentro, un Invio in uno dei suoi campi
          di testo farebbe partire il salvataggio invece di confermare il campo. */}
      {sheetField && (
        <FieldSheet title={sheetField.label} onClose={() => setOpenSheet(null)}>
          {sheetField.body}
        </FieldSheet>
      )}
    </main>
  )
}
