import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { AppHeader } from '../components/AppHeader'
import { sendDmRequest } from '../lib/dm'
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
  SMOKING_OPTIONS,
  SPORT_OPTIONS,
} from '../constants/options'
import { ZODIAC_LABELS } from '../constants/labels'
import { labelOf, labelsOf } from '../lib/profile/formatters'
import { ProfileLayout } from './profile/ProfileLayout'
import { ProfileRow } from './profile/ProfileRow'
import { ReportDialog } from '../components/ReportDialog'
import { blockUser, unblockUser, isBlocked } from '../lib/blocks'
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
  Smoking,
  Sport,
  Zodiac,
} from '../types'

type PublicProfile = {
  id: string
  nickname: string
  avatar_preset: string | null
  accent_color: string | null
  bio: string | null
  interests: string[] | null
  birth_date: string | null
  age: number | null
  identity_category: IdentityCategory | null
  orientations: Orientation[] | null
  city: string | null
  city_province: string | null
  city_region: string | null
  pronouns: string | null
  intents: Intent[] | null
  relationship_status: RelationshipStatus | null
  relationship_type: RelationshipType | null
  languages: Language[] | null
  children_status: ChildrenStatus | null
  has_pets: boolean | null
  pets_detail: string | null
  diet: Diet | null
  religion: Religion | null
  politics: Politics | null
  smoking: Smoking | null
  sport: Sport | null
  zodiac: Zodiac | null
  is_self: boolean
}

const COLS = `id, nickname, avatar_preset, accent_color, bio, interests, birth_date, age,
  identity_category, orientations, city, city_province, city_region, pronouns, intents,
  relationship_status, relationship_type, languages, children_status, has_pets, pets_detail,
  diet, religion, politics, smoking, sport, zodiac, is_self`

export function PublicProfileScreen({
  userId,
  onBack,
}: {
  userId: string
  onBack: () => void
}) {
  const { session, profile: myProfile } = useAuth()
  const myId = session?.user.id

  const [p, setP] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reporting, setReporting] = useState(false)
  const [reportPhotoId, setReportPhotoId] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [blockBusy, setBlockBusy] = useState(false)
  const [dmBusy, setDmBusy] = useState(false)
  const [dmFeedback, setDmFeedback] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    setP(null)
    ;(async () => {
      const { data, error: qErr } = await supabase
        .from('public_profiles')
        .select(COLS)
        .eq('id', userId)
        .maybeSingle()
      if (!alive) return
      if (qErr) setError('Impossibile caricare il profilo.')
      else if (!data) setError('Profilo non trovato.')
      else setP(data as PublicProfile)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [userId])

  useEffect(() => {
    let alive = true
    isBlocked(userId)
      .then((b) => alive && setBlocked(b))
      .catch(() => {})
    return () => { alive = false }
  }, [userId])

  async function sendDm() {
    if (!myId) return
    setDmBusy(true)
    setDmFeedback(null)
    try {
      await sendDmRequest(myId, userId)
      setDmFeedback('Richiesta inviata.')
    } catch (e) {
      setDmFeedback(e instanceof Error ? e.message : 'Errore nell\'invio.')
    } finally {
      setDmBusy(false)
    }
  }

  async function toggleBlock() {
    setBlockBusy(true)
    try {
      if (blocked) {
        await unblockUser(userId)
        setBlocked(false)
      } else {
        await blockUser(userId)
        setBlocked(true)
      }
    } catch {
      // silenzioso: l'utente può riprovare
    } finally {
      setBlockBusy(false)
    }
  }

  if (loading || error || !p) {
    return (
      <main className="app profile">
        <AppHeader onBack={onBack} title="Profilo" />
        {loading && <p className="muted">Carico il profilo…</p>}
        {!loading && <p className="err chat-error">{error ?? 'Profilo non trovato.'}</p>}
      </main>
    )
  }

  const rows: React.ReactNode[] = []
  if (p.pronouns)
    rows.push(<ProfileRow key="pron" label="Pronomi">{p.pronouns}</ProfileRow>)
  if (p.city)
    rows.push(
      <ProfileRow key="city" label="Città">
        {p.city}
        {p.city_province ? ` (${p.city_province})` : ''}
        {p.city_region ? `, ${p.city_region}` : ''}
      </ProfileRow>,
    )
  if (p.birth_date)
    rows.push(
      <ProfileRow key="bd" label="Data di nascita">
        {new Date(p.birth_date).toLocaleDateString('it-IT')}
      </ProfileRow>,
    )
  if (p.relationship_status)
    rows.push(
      <ProfileRow key="rel" label="Relazione">
        {labelOf(RELATIONSHIP_STATUS_OPTIONS, p.relationship_status)}
        {p.relationship_status === 'in_relazione' && p.relationship_type
          ? ` · ${labelOf(RELATIONSHIP_TYPE_OPTIONS, p.relationship_type)}`
          : ''}
      </ProfileRow>,
    )
  if (p.languages && p.languages.length > 0)
    rows.push(<ProfileRow key="lang" label="Lingue parlate">{labelsOf(LANGUAGE_OPTIONS, p.languages)}</ProfileRow>)
  if (p.interests && p.interests.length > 0)
    rows.push(<ProfileRow key="int" label="Interessi">{p.interests.join(', ')}</ProfileRow>)
  if (p.children_status)
    rows.push(<ProfileRow key="ch" label="Figli">{labelOf(CHILDREN_OPTIONS, p.children_status)}</ProfileRow>)
  if (p.has_pets != null)
    rows.push(
      <ProfileRow key="pets" label="Animali domestici">
        {p.has_pets ? (p.pets_detail ? `Sì — ${p.pets_detail}` : 'Sì') : 'No'}
      </ProfileRow>,
    )
  if (p.diet)
    rows.push(<ProfileRow key="diet" label="Alimentazione">{labelOf(DIET_OPTIONS, p.diet)}</ProfileRow>)
  if (p.religion)
    rows.push(<ProfileRow key="rel2" label="Religione & credo">{labelOf(RELIGION_OPTIONS, p.religion)}</ProfileRow>)
  if (p.politics)
    rows.push(<ProfileRow key="pol" label="Orientamento politico">{labelOf(POLITICS_OPTIONS, p.politics)}</ProfileRow>)
  if (p.smoking)
    rows.push(<ProfileRow key="sm" label="Fumo">{labelOf(SMOKING_OPTIONS, p.smoking)}</ProfileRow>)
  if (p.sport)
    rows.push(<ProfileRow key="sp" label="Attività fisica">{labelOf(SPORT_OPTIONS, p.sport)}</ProfileRow>)
  if (p.zodiac)
    rows.push(<ProfileRow key="zo" label="Segno">{ZODIAC_LABELS[p.zodiac]}</ProfileRow>)

  const keyFacts = [
    p.identity_category ? labelOf(IDENTITY_OPTIONS, p.identity_category) : null,
    p.orientations && p.orientations.length > 0 ? labelsOf(ORIENTATION_OPTIONS, p.orientations) : null,
    p.intents && p.intents.length > 0 ? labelsOf(INTENT_OPTIONS, p.intents) : null,
    p.age != null ? `${p.age} anni` : null,
  ]

  return (
    <>
      <ProfileLayout
        onBack={onBack}
        userId={p.id}
        nickname={p.nickname}
        avatarPreset={p.avatar_preset}
        accentColor={p.accent_color}
        bio={p.bio}
        keyFacts={keyFacts}
        rows={rows}
        onReportPhoto={p.is_self ? undefined : (id) => setReportPhotoId(id)}
        topActions={
          !p.is_self && (
            <>
              <button
                type="button"
                className={blocked ? 'pf-icon-btn danger' : 'pf-icon-btn'}
                title={blocked ? 'Sblocca' : 'Blocca'}
                aria-label={blocked ? 'Sblocca' : 'Blocca'}
                onClick={toggleBlock}
                disabled={blockBusy}
              >
                ⛔
              </button>
              <button
                type="button"
                className="pf-icon-btn"
                title="Segnala profilo"
                aria-label="Segnala profilo"
                onClick={() => setReporting(true)}
              >
                ⚑
              </button>
            </>
          )
        }
        bottomCard={
          !p.is_self && (
            <section className="card box-shadow">
              <h2 className="pf-section-title">Contatti</h2>
              <div className="pf-actions">
                {!blocked && (() => {
                  const strato = myProfile?.strato ?? 0
                  if (strato >= 2) return (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={sendDm}
                        disabled={dmBusy || dmFeedback === 'Richiesta inviata.'}
                      >
                        {dmBusy ? 'Invio…' : 'Manda messaggio'}
                      </button>
                      {dmFeedback && <p className="hint">{dmFeedback}</p>}
                    </>
                  )
                  return (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled
                      title="Per inviare messaggi privati devi essere attiva in chatroom per almeno 7 giorni e aver scritto 20 messaggi"
                    >
                      Manda messaggio
                    </button>
                  )
                })()}
                {blocked && (
                  <p className="hint">
                    Hai bloccato questa persona: non vedrai più i suoi messaggi.
                  </p>
                )}
              </div>
            </section>
          )
        }
      />

      {reporting && (
        <ReportDialog
          targetType="user"
          targetUserId={p.id}
          targetLabel={`@${p.nickname}`}
          onClose={() => setReporting(false)}
        />
      )}

      {reportPhotoId && (
        <ReportDialog
          targetType="photo"
          targetUserId={p.id}
          targetPhotoId={reportPhotoId}
          targetLabel="questa foto"
          onClose={() => setReportPhotoId(null)}
        />
      )}
    </>
  )
}
