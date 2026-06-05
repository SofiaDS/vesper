import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { findUserIdByNickname } from '../../lib/admin'
import {
  getReputationScore,
  getReputationHistory,
  applyReputationEvent,
  REPUTATION_EVENTS,
  type ReputationEvent,
  type ReputationEventType,
} from '../../lib/reputation'

const EVENT_LABELS: Record<ReputationEventType, string> = {
  warning:   'Warning',
  mute_temp: 'Mute temporaneo',
}

// Interpretazione del punteggio (reputazione.md §4.5)
function scoreLabel(score: number): { text: string; cls: string } {
  if (score >= 0)   return { text: 'Neutro',           cls: 'rep-neutral'  }
  if (score >= -3)  return { text: 'Qualche episodio', cls: 'rep-low'      }
  if (score >= -9)  return { text: 'Storia di problemi', cls: 'rep-mid'    }
  return               { text: 'Storia pesante',       cls: 'rep-high'    }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Scheda reputazione utente ────────────────────────────────────────────────

function UserReputation({
  userId,
  nickname,
  moderatorId,
}: {
  userId: string
  nickname: string
  moderatorId: string
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

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [s, h] = await Promise.all([
          getReputationScore(userId),
          getReputationHistory(userId),
        ])
        if (alive) { setScore(s); setHistory(h) }
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : 'Errore.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [userId])

  async function addEvent() {
    setAddBusy(true)
    setAddErr(null)
    try {
      await applyReputationEvent(userId, addType, moderatorId, undefined, addNotes)
      const [s, h] = await Promise.all([
        getReputationScore(userId),
        getReputationHistory(userId),
      ])
      setScore(s)
      setHistory(h)
      setAddOpen(false)
      setAddNotes('')
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : 'Errore.')
    } finally {
      setAddBusy(false)
    }
  }

  if (loading) return <p className="muted">Carico reputazione…</p>
  if (err)     return <p className="err">{err}</p>
  if (score === null) return null

  const { text: label, cls } = scoreLabel(score)

  return (
    <div className="rep-card">
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
                    : e.is_active
                      ? 'Attivo'
                      : 'Scaduto'}
                </span>
                <span className="hint">scade {formatDate(e.expires_at)}</span>
              </div>
              {e.notes && <p className="rep-notes">{e.notes}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export function ReputationModeration() {
  const { session } = useAuth()
  const moderatorId = session!.user.id

  const [query, setQuery]       = useState('')
  const [targetId, setTargetId] = useState<string | null>(null)
  const [targetNick, setTargetNick] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState<string | null>(null)

  async function search(e: React.FormEvent) {
    e.preventDefault()
    const nick = query.trim()
    if (!nick) return
    setSearching(true)
    setSearchErr(null)
    setTargetId(null)
    try {
      const id = await findUserIdByNickname(nick)
      if (!id) {
        setSearchErr('Utente non trovata.')
      } else {
        setTargetId(id)
        setTargetNick(nick)
      }
    } catch (e) {
      setSearchErr(e instanceof Error ? e.message : 'Errore.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="mod-list">
      <form className="rep-search" onSubmit={search}>
        <input
          type="text"
          placeholder="Cerca per nickname…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Nickname"
        />
        <button type="submit" className="btn-primary btn-sm" disabled={searching}>
          {searching ? 'Cerco…' : 'Cerca'}
        </button>
      </form>

      {searchErr && <p className="err">{searchErr}</p>}

      {targetId && (
        <UserReputation
          key={targetId}
          userId={targetId}
          nickname={targetNick}
          moderatorId={moderatorId}
        />
      )}
    </div>
  )
}
