import { useId, type ReactNode } from 'react'

// Sezione filtro comprimibile: stesso pattern usato in SearchScreen per
// identità, orientamento, interessi ecc. — un bottone con titolo + badge
// opzionale che mostra/nasconde il contenuto.
export function FilterSection({
  legend,
  badge,
  open,
  onToggle,
  children,
}: {
  legend: string
  badge?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const panelId = useId()
  return (
    <fieldset className="field filter-section">
      <legend className="visually-hidden">{legend}</legend>
      <button
        type="button"
        className="filter-section-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>{legend}</span>
        {badge}
        <span className="filter-section-arrow" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div id={panelId} className="filter-section-panel">
          {children}
        </div>
      )}
    </fieldset>
  )
}
