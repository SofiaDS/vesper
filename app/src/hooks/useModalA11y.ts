import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

// Gestione accessibilità di base per le modali (overlay + .modal):
// - sposta il focus dentro la modale all'apertura (sul container o sul primo
//   elemento focusabile);
// - chiude la modale con Escape;
// - intrappola Tab/Shift+Tab tra gli elementi focusabili della modale;
// - ripristina il focus sull'elemento che lo possedeva prima dell'apertura
//   (il "trigger") alla chiusura.
export function useModalA11y(
  ref: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const latestOnClose = useRef(onClose)
  latestOnClose.current = onClose

  useEffect(() => {
    if (!isOpen) return
    const container = ref.current
    triggerRef.current = document.activeElement as HTMLElement | null

    function focusables(): HTMLElement[] {
      if (!container) return []
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
      )
    }

    // Sposta il focus dentro la modale: sul primo elemento focusabile, o sul
    // container stesso come fallback.
    const items = focusables()
    if (items.length > 0) {
      items[0].focus()
    } else {
      container?.focus()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        latestOnClose.current()
        return
      }
      if (e.key !== 'Tab') return

      const els = focusables()
      if (els.length === 0) {
        e.preventDefault()
        return
      }
      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === first || !container?.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !container?.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Ripristina il focus sul trigger originale, se ancora presente nel DOM.
      triggerRef.current?.focus?.()
    }
  }, [isOpen, ref])
}
