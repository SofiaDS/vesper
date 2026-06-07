import { createContext, useContext, useState, type ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'

export interface BurgerMenuItem {
  label: string
  onClick: () => void
  active?: boolean
  badge?: number
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
  const { theme, toggle: toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  function go(action: () => void) {
    action()
    setOpen(false)
  }

  return (
    <BurgerMenuContext.Provider value={{ open, toggle: () => setOpen((v) => !v) }}>
      {children}

      {open && <div className="burger-overlay" onClick={() => setOpen(false)} />}

      <nav className={`burger-panel${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="burger-items">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`burger-item${item.active ? ' active' : ''}`}
              onClick={() => go(item.onClick)}
            >
              <span>{item.label}</span>
              {!!item.badge && <span className="badge">{item.badge}</span>}
            </button>
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
