import { SpinnerBall } from '@phosphor-icons/react'

// Loader leggero (0 KB extra): icona Phosphor SpinnerBall che ruota via CSS.
// La rotazione si disattiva da sola con `prefers-reduced-motion` (vedi .spinner
// in index.css). role="status" fa annunciare il caricamento agli screen reader.
export function AnimatedLoader({ label = 'Carico…' }: { label?: string }) {
  return (
    <p className="muted loader-row" role="status">
      <SpinnerBall size={22} weight="duotone" className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </p>
  )
}
