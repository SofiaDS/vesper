import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'

export interface BurgerMenuItem {
  label: string
  onClick: () => void
  active?: boolean
  badge?: number
}

// Menu di navigazione fisso (in alto a destra, dove prima stava il toggle tema):
// raccoglie i link di navigazione e, in fondo, il toggle chiaro/scuro.
export function BurgerMenu({
  items,
  onSignOut,
}: {
  items: BurgerMenuItem[]
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  function go(action: () => void) {
    action()
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="burger-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Chiudi menu' : 'Apri menu'}
        aria-expanded={open}
      >
        {open ? '✕' : '☰'}
      </button>

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

        <button type="button" className="burger-item burger-theme" onClick={toggle}>
          <span>{isDark ? '☀ Tema chiaro' : '🌙 Tema scuro'}</span>
        </button>
      </nav>
    </>
  )
}
