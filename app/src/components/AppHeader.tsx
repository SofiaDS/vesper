import type { ReactNode } from 'react'

// Header comune a tutte le schermate post-login: back a sinistra (se non siamo
// in homeScreen), titolo al centro. La navigazione vive nella tab bar + hub
// "Altro" (il burger menu è stato rimosso).
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
  // backLabel resta per l'accessibilità (aria-label/title): in UI mostriamo
  // solo l'icona della freccia, non più il testo "‹ Indietro" / "‹ Stanze" ecc.
  const backName = backLabel.replace(/^[‹\s]+/, '') || 'Indietro'
  return (
    <header className="app-header">
      {onBack ? (
        <button type="button" className="link back" onClick={onBack} aria-label={backName} title={backName}>
          ‹
        </button>
      ) : (
        <span className="link-placeholder" />
      )}
      <div className="app-header-center">
        <h1>{title}</h1>
        {extra}
      </div>
      <span className="link-placeholder" />
    </header>
  )
}
