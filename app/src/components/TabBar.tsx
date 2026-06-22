import type { ReactNode } from 'react'

export interface TabBarItem {
  key: string
  label: string
  onClick: () => void
  active: boolean
  badge?: number
  // Badge in stile "oro" (menzioni) invece di rosso (default, non letti).
  mention?: boolean
  // Sostantivo che descrive cosa conta il badge (es. "messaggi non letti"):
  // usato per costruire l'aria-label del tab così che lo screen reader
  // annunci "DM, 3 messaggi non letti" invece del solo numero "DM 3".
  badgeLabel?: string
  // Icona (decorativa) mostrata sopra l'etichetta.
  icon?: ReactNode
}

// Tab bar fissa sotto l'header con le voci principali di navigazione
// (Stanze, DM, Ricerca, Profilo, Altro). Tutte le voci, inclusa "Altro",
// arrivano da Home: la tab bar è puramente di presentazione.
export function TabBar({ items }: { items: TabBarItem[] }) {
  return (
    <nav className="tabbar" style={{ '--tabbar-cols': items.length } as React.CSSProperties}>
      {items.map((item) => {
        const ariaLabel =
          item.badge && item.badgeLabel
            ? `${item.label}, ${item.badge} ${item.badgeLabel}`
            : undefined
        return (
          <button
            key={item.key}
            type="button"
            className={`tab${item.active ? ' active' : ''}`}
            onClick={item.onClick}
            aria-pressed={item.active}
            aria-current={item.active ? 'page' : undefined}
            aria-label={ariaLabel}
          >
            {item.icon && (
              <span className="tab-icon" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span className="tab-label">{item.label}</span>
            {!!item.badge && (
              <span className={`tab-badge${item.mention ? ' mention' : ''}`} aria-hidden="true">
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
