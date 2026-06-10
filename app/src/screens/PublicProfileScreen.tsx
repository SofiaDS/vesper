import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { AppHeader } from '../components/AppHeader'
import { sendDmRequest } from '../lib/dm'
import { ProfileLayout } from './profile/ProfileLayout'
import { buildProfileRows, buildKeyFacts } from './profile/profileFacts'
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
  EducationLevel,
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
  education_level: EducationLevel | null
  education_institute: string | null
  smoking: Smoking | null
  sport: Sport | null
  zodiac: Zodiac | null
  is_self: boolean
}

const COLS = `id, nickname, avatar_preset, accent_color, bio, interests, birth_date, age,
  identity_category, orientations, city, city_province, city_region, pronouns, intents,
  relationship_status, relationship_type, languages, children_status, has_pets, pets_detail,
  diet, religion, politics, education_level, education_institute, smoking, sport, zodiac, is_self`

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
        {!loading && <p className="err chat-error" role="alert">{error ?? 'Profilo non trovato.'}</p>}
      </main>
    )
  }

  // public_profiles espone solo i campi che l'utente ha scelto di mostrare:
  // p soddisfa già la forma di ProfileFacts, nessun filtro aggiuntivo qui.
  const rows = buildProfileRows(p)
  const keyFacts = buildKeyFacts(p)

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
                      {dmFeedback && <p className="hint" role="status">{dmFeedback}</p>}
                    </>
                  )
                  return (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled
                        title="Per inviare messaggi privati devi essere attiva in chatroom per almeno 7 giorni e aver scritto 20 messaggi"
                      >
                        Manda messaggio
                      </button>
                      <p className="hint hint-active">
                        Per inviare messaggi privati devi essere attiva in chatroom per almeno 7 giorni e aver scritto 20 messaggi.
                      </p>
                    </>
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
