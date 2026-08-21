import { useRef, useState } from 'react'
import { DotsThreeVertical } from '@phosphor-icons/react'
import { useModalA11y } from '../hooks/useModalA11y'

export interface HeaderMenuItem {
  key: string
  label: string
  onClick: () => void
  // Azione distruttiva (abbandona stanza, blocca): rossa e staccata dal resto.
  danger?: boolean
}

// Menu "⋯" in fondo a destra nell'header, al posto del contrappeso vuoto della
// freccia indietro. Nasce per le schermate di conversazione, dove la tab bar è
// nascosta e le poche azioni disponibili (abbandona stanza, blocca/segnala)
// non hanno più un altro posto dove stare.
//
// Il popover riusa `useModalA11y`: focus dentro all'apertura, Escape per
// chiudere, Tab intrappolato tra le voci e focus restituito al ⋯ alla chiusura.
export function HeaderMenu({ label, items }: { label: string; items: HeaderMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  useModalA11y(panelRef, open, () => setOpen(false))

  // Un ⋯ che si apre sul nulla è peggio di un ⋯ assente: chi chiama decide di
  // non renderizzarci affatto (vedi la Foyer), questo è solo una rete.
  if (items.length === 0) return null

  return (
    <div className="hmenu-wrap">
      <button
        type="button"
        className="hmenu-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <DotsThreeVertical size={22} weight="bold" aria-hidden="true" />
      </button>

      {open && (
        <>
          {/* Chiude toccando fuori: sta dentro lo stacking context dell'header
              (z-index 5), quindi copre la conversazione ma non le modali. */}
          <div className="hmenu-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
          <div ref={panelRef} className="hmenu" role="menu" aria-label={label} tabIndex={-1}>
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={item.danger ? 'hmenu-item danger' : 'hmenu-item'}
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
