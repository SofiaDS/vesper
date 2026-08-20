import { useRef, type ReactNode } from 'react'
import { useModalA11y } from '../../hooks/useModalA11y'

// Foglio che sale dal basso con i chip di un singolo campo (redesign 2F):
// toccando una riga riassuntiva della scheda «Vita» si apre questo, si sceglie
// e si conferma, senza mai lasciare l'elenco. Le modifiche sono già scritte
// nello stato del form mentre si sceglie: «Conferma» chiude e basta — il
// salvataggio vero resta l'unico, quello della barra in fondo.
export function FieldSheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  useModalA11y(ref, true, onClose)

  return (
    <div className="pf-sheet-overlay" onClick={onClose}>
      <div
        ref={ref}
        className="pf-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="pf-sheet-grip" aria-hidden="true" />
        {children}
        <button type="button" className="btn-primary pf-sheet-confirm" onClick={onClose}>
          Conferma
        </button>
      </div>
    </div>
  )
}
