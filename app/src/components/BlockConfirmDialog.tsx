import { useRef } from 'react'
import { useModalA11y } from '../hooks/useModalA11y'

// Modale di conferma prima di bloccare una persona: chiede se bloccare e
// basta o bloccare e cancellare anche la conversazione DM (per entrambe).
export function BlockConfirmDialog({
  nickname,
  busy,
  onCancel,
  onConfirm,
}: {
  nickname: string
  busy: boolean
  onCancel: () => void
  onConfirm: (deleteConversation: boolean) => void
}) {
  const modalRef = useRef<HTMLDivElement | null>(null)
  useModalA11y(modalRef, true, onCancel)

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Bloccare @{nickname}?</h2>
        <p className="muted small-inline">
          Non vedrai più i suoi messaggi. La persona non riceverà una notifica.
        </p>
        <div className="modal-actions modal-actions-col">
          <button type="button" className="btn-secondary" onClick={() => onConfirm(false)} disabled={busy}>
            {busy ? 'Blocco…' : 'Blocca soltanto'}
          </button>
          <button type="button" className="btn-danger" onClick={() => onConfirm(true)} disabled={busy}>
            {busy ? 'Blocco…' : 'Blocca e cancella conversazione'}
          </button>
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            Annulla
          </button>
        </div>
      </div>
    </div>
  )
}
