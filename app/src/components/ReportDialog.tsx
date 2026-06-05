import { useState } from 'react'
import {
  createReport,
  REPORT_REASONS,
  type ReportTarget,
} from '../lib/reports'

// Modale riusabile per segnalare un utente o un messaggio. Mostra i motivi
// preset + una nota facoltativa, poi conferma l'invio. Anonima verso la
// persona segnalata (solo lo staff vede il mittente).
export function ReportDialog({
  targetType,
  targetUserId,
  targetMessageId,
  targetPhotoId,
  targetLabel,
  onClose,
}: {
  targetType: ReportTarget
  targetUserId?: string | null
  targetMessageId?: number | null
  targetPhotoId?: string | null
  targetLabel: string
  onClose: () => void
}) {
  const [reason, setReason] = useState<string>(REPORT_REASONS[0])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const full = note.trim() ? `${reason} — ${note.trim()}` : reason
      await createReport({
        targetType,
        targetUserId,
        targetMessageId,
        targetPhotoId,
        reason: full,
      })
      setDone(true)
    } catch {
      setError('Invio della segnalazione non riuscito. Riprova.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <>
            <h2 className="modal-title">Segnalazione inviata</h2>
            <p className="muted">
              Grazie. Il team di moderazione la esaminerà al più presto.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={onClose}>
                Chiudi
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2 className="modal-title">Segnala {targetLabel}</h2>
            <p className="muted small-inline">
              La segnalazione è anonima per la persona segnalata.
            </p>
            <fieldset className="report-reasons">
              {REPORT_REASONS.map((r) => (
                <label key={r} className="report-reason-opt">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </fieldset>
            <textarea
              className="report-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Aggiungi dettagli (facoltativo)"
              maxLength={500}
              rows={3}
            />
            {error && <p className="err">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={onClose}>
                Annulla
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? 'Invio…' : 'Invia segnalazione'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
