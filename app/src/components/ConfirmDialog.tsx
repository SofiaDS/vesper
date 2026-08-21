import { useRef, type ReactNode } from 'react'
import { useModalA11y } from '../hooks/useModalA11y'

// Conferma generica per un'azione distruttiva raggiungibile in un tap dal menu
// ⋯ (oggi: abbandonare una stanza). BlockConfirmDialog resta separato perché
// non è un sì/no: offre due varianti di blocco.
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  busyLabel,
  busy = false,
  error,
  onCancel,
  onConfirm,
}: {
  title: string
  body: ReactNode
  confirmLabel: string
  busyLabel: string
  busy?: boolean
  error?: string | null
  onCancel: () => void
  onConfirm: () => void
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
        aria-labelledby="confirm-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title" id="confirm-modal-title">{title}</h2>
        <p className="muted small-inline">{body}</p>
        {error && <p className="err" role="alert">{error}</p>}
        <div className="modal-actions modal-actions-col">
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </button>
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            Annulla
          </button>
        </div>
      </div>
    </div>
  )
}
