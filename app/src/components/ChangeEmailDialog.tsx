import { useRef, useState, type FormEvent } from 'react'
import { useModalA11y } from '../hooks/useModalA11y'
import { PasswordInput } from './PasswordInput'
import { requestEmailChange } from '../lib/account'

// Cambio dell'indirizzo email. La password attuale serve a dimostrare che è
// davvero la proprietaria a chiederlo (vedi lib/account.ts).
export function ChangeEmailDialog({
  currentEmail,
  onClose,
}: {
  currentEmail: string | undefined
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const modalRef = useRef<HTMLDivElement | null>(null)
  useModalA11y(modalRef, true, onClose)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await requestEmailChange(email.trim(), password)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operazione non riuscita. Riprova.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title" id="email-modal-title">Cambia email</h2>

        {sent ? (
          <>
            <p className="ok" role="status">
              Ti abbiamo inviato un link di conferma a <strong>{email.trim()}</strong>.
            </p>
            {/* Con il "secure email change" attivo Supabase manda un link anche
                al vecchio indirizzo e servono entrambi: la formula copre le due
                configurazioni senza promettere quella sbagliata. */}
            <p className="muted small-inline">
              Apri quel link per completare il cambio; potresti riceverne uno anche
              all'indirizzo attuale, in quel caso servono entrambi. Fino ad allora
              continui ad accedere con l'indirizzo di prima. Controlla anche lo spam.
            </p>
            <div className="modal-actions modal-actions-col">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Ho capito
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            {currentEmail && (
              <p className="muted small-inline">
                Indirizzo attuale: <strong>{currentEmail}</strong>
              </p>
            )}

            <label className="field">
              <span>Nuova email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nuova@esempio.it"
              />
            </label>

            <label className="field">
              <span>La tua password attuale</span>
              <PasswordInput
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="per confermare che sei tu"
              />
            </label>

            {error && <p className="err" role="alert">{error}</p>}

            <div className="modal-actions modal-actions-col">
              <button type="submit" className="btn-secondary" disabled={busy}>
                {busy ? 'Invio…' : "Invia il link di conferma"}
              </button>
              <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
                Annulla
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
