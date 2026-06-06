import { useEffect, useState } from 'react'
import {
  listPendingVerifications,
  approveVerification,
  rejectVerification,
  type PendingVerification,
} from '../../lib/admin'

const REJECTION_REASONS = [
  'Video troppo scuro o sfocato',
  'Viso non visibile o coperto',
  'Video troppo corto',
  'La persona non sembra reale',
  'Altro',
]

export function VerificationModeration() {
  const [items, setItems]     = useState<PendingVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr]         = useState<string | null>(null)
  const [busy, setBusy]       = useState<string | null>(null)

  // Per il rifiuto: quale utente e quale motivo
  const [rejectingId, setRejectingId]       = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await listPendingVerifications()
        if (alive) setItems(list)
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : 'Errore.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  async function approve(userId: string) {
    setBusy(userId)
    setErr(null)
    try {
      await approveVerification(userId)
      setItems((prev) => prev.filter((v) => v.user_id !== userId))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Errore.')
    } finally {
      setBusy(null)
    }
  }

  async function reject(userId: string) {
    setBusy(userId)
    setErr(null)
    try {
      await rejectVerification(userId, rejectionReason)
      setItems((prev) => prev.filter((v) => v.user_id !== userId))
      setRejectingId(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Errore.')
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <p className="muted">Carico le verifiche…</p>

  return (
    <div className="mod-list">
      {err && <p className="err">{err}</p>}

      {items.length === 0 ? (
        <p className="hint">Nessuna verifica in attesa.</p>
      ) : (
        items.map((v) => (
          <div key={v.user_id} className="mod-photo">
            <div className="mod-photo-body" style={{ width: '100%' }}>
              <p className="mod-photo-who">
                @{v.nickname}
                <span className="muted small-inline"> · {new Date(v.submitted_at).toLocaleString('it-IT')}</span>
              </p>

              {v.video_url ? (
                <video
                  className="verif-admin-video"
                  src={v.video_url}
                  controls
                  playsInline
                  muted
                />
              ) : (
                <p className="hint">Video non disponibile.</p>
              )}

              {rejectingId === v.user_id ? (
                <div className="verif-reject-form">
                  <label className="field">
                    <span>Motivo del rifiuto</span>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    >
                      {REJECTION_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <div className="mod-photo-actions">
                    <button
                      type="button"
                      className="btn-reject"
                      onClick={() => reject(v.user_id)}
                      disabled={busy === v.user_id}
                    >
                      {busy === v.user_id ? 'Attendi…' : 'Conferma rifiuto'}
                    </button>
                    <button
                      type="button"
                      className="link"
                      onClick={() => setRejectingId(null)}
                      disabled={busy === v.user_id}
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mod-photo-actions">
                  <button
                    type="button"
                    className="btn-approve"
                    onClick={() => approve(v.user_id)}
                    disabled={busy === v.user_id}
                  >
                    {busy === v.user_id ? 'Attendi…' : 'Approva'}
                  </button>
                  <button
                    type="button"
                    className="btn-reject"
                    onClick={() => { setRejectingId(v.user_id); setRejectionReason(REJECTION_REASONS[0]) }}
                    disabled={busy === v.user_id}
                  >
                    Rifiuta
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
