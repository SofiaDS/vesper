import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'
import { useModalA11y } from '../hooks/useModalA11y'

export interface BurgerMenuItem {
  label: string
  onClick?: () => void
  active?: boolean
  badge?: number
  // Etichetta accessibile alternativa (es. per voci che aprono link esterni
  // in una nuova scheda, dove va segnalato esplicitamente).
  ariaLabel?: string
  // Sottovoci verticali (es. le sezioni di moderazione sotto "Moderazione"):
  // se presenti, il click sulla voce apre/chiude il gruppo invece di navigare.
  children?: BurgerMenuItem[]
}

interface BurgerMenuContextValue {
  open: boolean
  toggle: () => void
}

const BurgerMenuContext = createContext<BurgerMenuContextValue | null>(null)

function useBurgerMenu(): BurgerMenuContextValue {
  const ctx = useContext(BurgerMenuContext)
  if (!ctx) throw new Error('useBurgerMenu va usato dentro <BurgerMenu>')
  return ctx
}

// Pulsante che apre/chiude il menu: va inserito nell'header di ogni schermata
// (sostituisce il vecchio toggle fisso in alto a destra).
export function BurgerMenuButton() {
  const { open, toggle } = useBurgerMenu()
  return (
    <button
      type="button"
      className="burger-btn"
      onClick={toggle}
      aria-label={open ? 'Chiudi menu' : 'Apri menu'}
      aria-expanded={open}
    >
      {open ? '✕' : '☰'}
    </button>
  )
}

// Provider del menu di navigazione: raccoglie i link e, in fondo, il toggle chiaro/scuro.
// Espone lo stato "aperto" via contesto così che ogni AppHeader possa avere il proprio
// pulsante di apertura senza duplicare pannello/overlay.
export function BurgerMenu({
  items,
  onSignOut,
  children,
}: {
  items: BurgerMenuItem[]
  onSignOut: () => void
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const { theme, toggle: toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const panelRef = useRef<HTMLElement | null>(null)
  useModalA11y(panelRef, open, () => setOpen(false))

  function go(action?: () => void) {
    if (!action) return
    action()
    setOpen(false)
    setExpanded(null)
  }

  function press(item: BurgerMenuItem) {
    if (item.children) setExpanded((cur) => (cur === item.label ? null : item.label))
    else go(item.onClick)
  }

  return (
    <BurgerMenuContext.Provider value={{ open, toggle: () => setOpen((v) => !v) }}>
      {children}

      {open && <div className="burger-overlay" onClick={() => setOpen(false)} />}

      <nav
        ref={panelRef}
        className={`burger-panel${open ? ' open' : ''}`}
        aria-hidden={!open}
        tabIndex={-1}
        inert={!open ? '' : undefined}
      >
        <div className="burger-items">
          {items.map((item) => (
            <div key={item.label} className="burger-group">
              <button
                type="button"
                className={`burger-item${item.active ? ' active' : ''}`}
                onClick={() => press(item)}
                aria-expanded={item.children ? expanded === item.label : undefined}
                aria-label={item.ariaLabel}
              >
                <span>{item.label}</span>
                <span className="burger-item-end">
                  {!!item.badge && <span className="badge">{item.badge}</span>}
                  {item.children && (
                    <span className="burger-caret" aria-hidden="true">
                      {expanded === item.label ? '⌃' : '⌄'}
                    </span>
                  )}
                </span>
              </button>
              {item.children && expanded === item.label && (
                <div className="burger-submenu">
                  {item.children.map((sub) => (
                    <button
                      key={sub.label}
                      type="button"
                      className={`burger-item burger-subitem${sub.active ? ' active' : ''}`}
                      onClick={() => go(sub.onClick)}
                    >
                      <span>{sub.label}</span>
                      {!!sub.badge && <span className="badge">{sub.badge}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button type="button" className="burger-item" onClick={() => go(onSignOut)}>
            <span>Esci</span>
          </button>
        </div>

        <button type="button" className="burger-item burger-theme" onClick={toggleTheme}>
          <span>{isDark ? '☀ Tema chiaro' : '🌙 Tema scuro'}</span>
        </button>
      </nav>
    </BurgerMenuContext.Provider>
  )
}
