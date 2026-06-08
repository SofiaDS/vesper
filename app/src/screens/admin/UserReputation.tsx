import { useEffect, useState } from 'react'
import {
  getReputationScore,
  getReputationHistory,
  applyReputationEvent,
  annulReputationEvent,
  REPUTATION_EVENTS,
  type ReputationEvent,
  type ReputationEventType,
} from '../../lib/reputation'

const EVENT_LABELS: Record<ReputationEventType, string> = {
  warning:   'Warning',
  mute_temp: 'Mute temporaneo',
}

function scoreLabel(score: number): { text: string; cls: string } {
  if (score >= 0)  return { text: 'Neutro',             cls: 'rep-neutral' }
  if (score >= -3) return { text: 'Qualche episodio',   cls: 'rep-low'     }
  if (score >= -9) return { text: 'Storia di problemi', cls: 'rep-mid'     }
  return                   { text: 'Storia pesante',    cls: 'rep-high'    }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

async function loadReputation(userId: string) {
  const [score, history] = await Promise.all([
    getReputationScore(userId),
    getReputationHistory(userId),
  ])
  return { score, history }
}

export function UserReputation({
  userId,
  nickname,
  moderatorId,
  isAdmin,
}: {
  userId: string
  nickname: string
  moderatorId: string
  isAdmin: boolean
}) {
  const [score, setScore]     = useState<number | null>(null)
  const [history, setHistory] = useState<ReputationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr]         = useState<string | null>(null)

  const [addOpen, setAddOpen]   = useState(false)
  const [addType, setAddType]   = useState<ReputationEventType>('warning')
  const [addNotes, setAddNotes] = useState('')
  const [addBusy, setAddBusy]   = useState(false)
  const [addErr, setAddErr]     = useState<string | null>(null)

  const [annulBusy, setAnnulBusy] = useState<string | null>(null)
  const [annulErr, setAnnulErr]   = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadReputation(userId)
      .then(({ score: s, history: h }) => { if (alive) { setScore(s); setHistory(h) } })
      .catch((e) => { if (alive) setErr(e instanceof Error ? e.message : 'Errore.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [userId])

  async function refresh() {
    const { score: s, history: h } = await loadReputation(userId)
    setScore(s)
    setHistory(h)
  }

  async function addEvent() {
    setAddBusy(true)
    setAddErr(null)
    try {
      await applyReputationEvent(userId, addType, moderatorId, undefined, addNotes)
      await refresh()
      setAddOpen(false)
      setAddNotes('')
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : 'Errore.')
    } finally {
      setAddBusy(false)
    }
  }

  async function annulEvent(eventId: string) {
    setAnnulBusy(eventId)
    setAnnulErr(null)
    try {
      await annulReputationEvent(eventId)
      await refresh()
    } catch (e) {
      setAnnulErr(e instanceof Error ? e.message : 'Errore.')
    } finally {
      setAnnulBusy(null)
    }
  }

  if (loading) return <p className="muted">Carico reputazione…</p>
  if (err)     return <p className="err">{err}</p>
  if (score === null) return null

  const { text: label, cls } = scoreLabel(score)

  return (
    <div className="rep-card box-shadow">
      <div className="rep-score-row">
        <span className={`rep-score ${cls}`}>{score}</span>
        <div>
          <p className="rep-nick">@{nickname}</p>
          <p className={`rep-label ${cls}`}>{label}</p>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary btn-sm"
        style={{ marginTop: '0.75rem' }}
        onClick={() => setAddOpen((o) => !o)}
      >
        {addOpen ? 'Annulla' : 'Aggiungi evento manuale'}
      </button>

      {addOpen && (
        <div className="rep-add-form">
          <div className="rep-add-row">
            {(Object.keys(REPUTATION_EVENTS) as ReputationEventType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={addType === t ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
                onClick={() => setAddType(t)}
              >
                {EVENT_LABELS[t]} ({REPUTATION_EVENTS[t]})
              </button>
            ))}
          </div>
          <textarea
            className="textarea"
            placeholder="Note opzionali…"
            value={addNotes}
            onChange={(e) => setAddNotes(e.target.value)}
            rows={2}
          />
          {addErr && <p className="err">{addErr}</p>}
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={addEvent}
            disabled={addBusy}
          >
            {addBusy ? 'Salvo…' : 'Conferma'}
          </button>
        </div>
      )}

      <div className="rep-history">
        <p className="rep-history-title">
          Storico ultimi 12 mesi ({history.length} eventi)
        </p>
        {annulErr && <p className="err">{annulErr}</p>}
        {history.length === 0 ? (
          <p className="hint">Nessun evento registrato.</p>
        ) : (
          history.map((e) => (
            <div key={e.id} className="rep-event">
              <div className="rep-event-head">
                <span className={`rep-event-type ${e.is_active ? 'rep-active' : 'rep-expired'}`}>
                  {EVENT_LABELS[e.event_type]} ({REPUTATION_EVENTS[e.event_type]})
                </span>
                <span className="hint">{formatDate(e.created_at)}</span>
              </div>
              <div className="rep-event-meta">
                <span className={`rep-badge ${e.is_active ? 'rep-badge-active' : 'rep-badge-expired'}`}>
                  {e.status === 'annulled_appeal'
                    ? 'Annullato in appello'
                    : e.is_active ? 'Attivo' : 'Scaduto'}
                </span>
                <span className="hint">scade {formatDate(e.expires_at)}</span>
              </div>
              {e.notes && <p className="rep-notes">{e.notes}</p>}
              {isAdmin && e.is_active && e.status !== 'annulled_appeal' && (
                <button
                  type="button"
                  className="link rep-annul"
                  onClick={() => annulEvent(e.id)}
                  disabled={annulBusy === e.id}
                >
                  {annulBusy === e.id ? 'Annullo…' : 'Annulla in appello'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
