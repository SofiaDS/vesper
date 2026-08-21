import type { ReactNode } from 'react'
import { CaretLeft } from '@phosphor-icons/react'

// Header comune a tutte le schermate post-login: back a sinistra (se non siamo
// in homeScreen), titolo al centro. La navigazione vive nella tab bar + hub
// "Altro" (il burger menu è stato rimosso).
export function AppHeader({
  title,
  extra,
  action,
  onBack,
  backLabel = '‹ Indietro',
}: {
  title: ReactNode
  extra?: ReactNode
  // Azione a destra (oggi il menu ⋯ delle conversazioni). Senza, resta il
  // segnaposto vuoto che fa da contrappeso alla freccia e tiene il titolo
  // centrato: le due cose occupano la stessa larghezza.
  action?: ReactNode
  onBack?: () => void
  backLabel?: string
}) {
  // backLabel resta per l'accessibilità (aria-label/title): in UI mostriamo
  // solo l'icona della freccia, non più il testo "‹ Indietro" / "‹ Stanze" ecc.
  const backName = backLabel.replace(/^[‹\s]+/, '') || 'Indietro'
  return (
    <header className="app-header">
      {onBack ? (
        <button type="button" className="link back" onClick={onBack} aria-label={backName} title={backName}>
          <CaretLeft size={24} weight="bold" aria-hidden="true" />
        </button>
      ) : (
        <span className="link-placeholder" />
      )}
      <div className="app-header-center">
        <h1>{title}</h1>
        {extra}
      </div>
      {action ?? <span className="link-placeholder" />}
    </header>
  )
}
