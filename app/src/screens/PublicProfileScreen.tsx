import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { sendDmRequest } from '../lib/dm'
import {
  IDENTITY_OPTIONS,
  ORIENTATION_OPTIONS,
  INTENT_OPTIONS,
  SMOKING_OPTIONS,
  SPORT_OPTIONS,
} from '../constants/options'
import { ZODIAC_LABELS } from '../constants/labels'
import { glyphFor, labelOf, labelsOf } from '../lib/profile/formatters'
import { PhotoCarousel } from '../components/PhotoCarousel'
import { ReportDialog } from '../components/ReportDialog'
import { blockUser, unblockUser, isBlocked } from '../lib/blocks'
import type { IdentityCategory, Orientation, Intent, Smoking, Sport, Zodiac } from '../types'

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
  smoking: Smoking | null
  sport: Sport | null
  zodiac: Zodiac | null
  is_self: boolean
}

const COLS =
  'id, nickname, avatar_preset, accent_color, bio, interests, birth_date, age, identity_category, orientations, city, city_province, city_region, pronouns, intents, smoking, sport, zodiac, is_self'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pf-row">
      <span className="pf-label">{label}</span>
      <span className="pf-value">{children}</span>
    </div>
  )
}

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

  const rows: React.ReactNode[] = []
  if (p) {
    if (p.pronouns)
      rows.push(<Row key="pron" label="Pronomi">{p.pronouns}</Row>)
    if (p.city)
      rows.push(
        <Row key="city" label="Città">
          {p.city}
          {p.city_province ? ` (${p.city_province})` : ''}
          {p.city_region ? `, ${p.city_region}` : ''}
        </Row>,
      )
    if (p.age != null)
      rows.push(<Row key="age" label="Età">{p.age} anni</Row>)
    if (p.birth_date)
      rows.push(
        <Row key="bd" label="Data di nascita">
          {new Date(p.birth_date).toLocaleDateString('it-IT')}
        </Row>,
      )
    if (p.identity_category)
      rows.push(
        <Row key="id" label="Identità">{labelOf(IDENTITY_OPTIONS, p.identity_category)}</Row>,
      )
    if (p.orientations && p.orientations.length > 0)
      rows.push(
        <Row key="or" label="Orientamento">{labelsOf(ORIENTATION_OPTIONS, p.orientations)}</Row>,
      )
    if (p.intents && p.intents.length > 0)
      rows.push(
        <Row key="in" label="Cosa cerca">{labelsOf(INTENT_OPTIONS, p.intents)}</Row>,
      )
    if (p.interests && p.interests.length > 0)
      rows.push(<Row key="int" label="Interessi">{p.interests.join(', ')}</Row>)
    if (p.smoking)
      rows.push(<Row key="sm" label="Fumo">{labelOf(SMOKING_OPTIONS, p.smoking)}</Row>)
    if (p.sport)
      rows.push(<Row key="sp" label="Sport">{labelOf(SPORT_OPTIONS, p.sport)}</Row>)
    if (p.zodiac)
      rows.push(<Row key="zo" label="Segno">{ZODIAC_LABELS[p.zodiac]}</Row>)
  }

  return (
    <main className="app profile">
      <header className="rooms-header">
        <button type="button" className="link back" onClick={onBack}>
          ‹ Indietro
        </button>
        <h1 className="rooms-brand">Profilo</h1>
        {p && !p.is_self ? (
          <button type="button" className="link" onClick={() => setReporting(true)}>
            Segnala
          </button>
        ) : (
          <span className="link-placeholder" />
        )}
      </header>

      {loading && <p className="muted">Carico il profilo…</p>}
      {error && <p className="err chat-error">{error}</p>}

      {p && (
        <div className="profile-card">
          <div className="avatar-preview">
            <PhotoCarousel
              userId={p.id}
              onReportPhoto={p.is_self ? undefined : (id) => setReportPhotoId(id)}
              fallback={
                <span
                  className="avatar-bubble"
                  style={{ background: p.accent_color ?? 'var(--gold)' }}
                >
                  {glyphFor(p.avatar_preset, p.nickname)}
                </span>
              }
            />
            <span className="pf-nick">@{p.nickname}</span>
          </div>

          {p.bio && <p className="pf-bio">{p.bio}</p>}

          {rows.length > 0 ? (
            <div className="pf-rows">{rows}</div>
          ) : (
            <p className="hint">Questa persona ha scelto di mostrare solo nickname e avatar.</p>
          )}

          {!p.is_self && (
            <div className="pf-actions">
              {!blocked && (myProfile?.strato ?? 0) >= 2 && (
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
              )}
              <button
                type="button"
                className={blocked ? 'btn-primary' : 'btn-ghost'}
                onClick={toggleBlock}
                disabled={blockBusy}
              >
                {blockBusy ? 'Attendi…' : blocked ? 'Sblocca' : 'Blocca'}
              </button>
              {blocked && (
                <p className="hint">
                  Hai bloccato questa persona: non vedrai più i suoi messaggi.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {reporting && p && (
        <ReportDialog
          targetType="user"
          targetUserId={p.id}
          targetLabel={`@${p.nickname}`}
          onClose={() => setReporting(false)}
        />
      )}

      {reportPhotoId && p && (
        <ReportDialog
          targetType="photo"
          targetUserId={p.id}
          targetPhotoId={reportPhotoId}
          targetLabel="questa foto"
          onClose={() => setReportPhotoId(null)}
        />
      )}
    </main>
  )
}
