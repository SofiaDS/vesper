import { useBurgerMenu } from './BurgerMenu'

export interface TabBarItem {
  key: string
  label: string
  onClick: () => void
  active: boolean
  badge?: number
  // Badge in stile "oro" (menzioni) invece di rosso (default, non letti).
  mention?: boolean
}

// Tab bar fissa sotto l'header: le voci principali (Stanze, DM, Ricerca,
// Profilo) arrivano da Home, "Altro" è aggiunta qui e riusa il pannello del
// burger menu già esistente (BurgerMenu) per le voci senza una tab dedicata.
export function TabBar({ items, altroBadge }: { items: TabBarItem[]; altroBadge?: number }) {
  const { open, toggle } = useBurgerMenu()

  const allItems: TabBarItem[] = [
    ...items,
    { key: 'altro', label: 'Altro', onClick: toggle, active: open, badge: altroBadge, mention: true },
  ]

  return (
    <nav className="tabbar" style={{ '--tabbar-cols': allItems.length } as React.CSSProperties}>
      {allItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`tab${item.active ? ' active' : ''}`}
          onClick={item.onClick}
          aria-pressed={item.active}
        >
          {item.label}
          {!!item.badge && (
            <span className={`tab-badge${item.mention ? ' mention' : ''}`}>{item.badge}</span>
          )}
        </button>
      ))}
    </nav>
  )
}
