import type { ReactNode } from 'react'
import { BurgerMenuButton } from './BurgerMenu'

// Header comune a tutte le schermate post-login: back a sinistra (se non siamo
// in homeScreen), titolo al centro, burger menu a destra.
export function AppHeader({
  title,
  extra,
  onBack,
  backLabel = '‹ Indietro',
}: {
  title: ReactNode
  extra?: ReactNode
  onBack?: () => void
  backLabel?: string
}) {
  return (
    <header className="app-header">
      {onBack ? (
        <button type="button" className="link back" onClick={onBack}>
          {backLabel}
        </button>
      ) : (
        <span className="link-placeholder" />
      )}
      <div className="app-header-center">
        <h1>{title}</h1>
        {extra}
      </div>
      <BurgerMenuButton />
    </header>
  )
}
