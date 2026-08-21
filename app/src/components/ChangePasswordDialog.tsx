import { useRef, useState, type FormEvent } from 'react'
import { useModalA11y } from '../hooks/useModalA11y'
import { PasswordInput } from './PasswordInput'
import { changePassword } from '../lib/account'

// Cambio password dall'app, riconfermando quella attuale. Chi la password non
// se la ricorda più usa "Password dimenticata?" nella schermata di accesso: là
// il link via email è l'unica strada possibile, qui sarebbe solo un giro in più
// che dipende dalla posta in arrivo.
export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const modalRef = useRef<HTMLDivElement | null>(null)
  useModalA11y(modalRef, true, onClose)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (next !== confirm) {
      setError('Le due password non coincidono.')
      return
    }
    setBusy(true)
    try {
      await changePassword(next, current)
      setDone(true)
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
        aria-labelledby="password-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title" id="password-modal-title">Cambia password</h2>

        {done ? (
          <>
            <p className="ok" role="status">Password aggiornata.</p>
            <p className="muted small-inline">
              Da adesso accedi con quella nuova. Se non sei stata tu a cambiarla,
              scrivi subito a privacy@vespercommunity.com.
            </p>
            <div className="modal-actions modal-actions-col">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Ho capito
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            <label className="field">
              <span>Password attuale</span>
              <PasswordInput
                autoComplete="current-password"
                required
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="la password che usi ora"
              />
            </label>

            <label className="field">
              <span>Nuova password</span>
              <PasswordInput
                autoComplete="new-password"
                required
                minLength={8}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="min 8 caratteri, lettere e numeri"
              />
              <span className="hint">
                Scegline una lunga e diversa da quelle che usi su altri siti.
              </span>
            </label>

            <label className="field">
              <span>Conferma nuova password</span>
              <PasswordInput
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="ripeti la nuova password"
              />
            </label>

            {error && <p className="err" role="alert">{error}</p>}

            <div className="modal-actions modal-actions-col">
              <button type="submit" className="btn-secondary" disabled={busy}>
                {busy ? 'Aggiorno…' : 'Cambia password'}
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
