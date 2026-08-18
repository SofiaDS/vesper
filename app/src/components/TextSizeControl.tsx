import { useTextSize, type TextSize } from '../hooks/useTextSize'

const OPTIONS: { value: TextSize; label: string }[] = [
  { value: 'default', label: 'Normale' },
  { value: 'large', label: 'Grande' },
  { value: 'xlarge', label: 'Molto grande' },
]

// Controllo a tre segmenti per la dimensione del testo, nella sezione
// Accessibilità. Selezione singola: ogni bottone espone aria-pressed così lo
// screen reader annuncia quale livello è attivo.
export function TextSizeControl() {
  const { size, setSize } = useTextSize()
  return (
    <div className="text-size-row">
      <span className="toggle-label" id="text-size-label">
        Dimensione testo
        <span className="hint" style={{ display: 'block', marginTop: '0.15rem' }}>
          Ingrandisci il testo di tutta l'app
        </span>
      </span>
      <div className="seg" role="group" aria-labelledby="text-size-label">
        {OPTIONS.map((o) => {
          const on = size === o.value
          return (
            <button
              key={o.value}
              type="button"
              className={on ? 'seg-btn on' : 'seg-btn'}
              aria-pressed={on}
              onClick={() => setSize(o.value)}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
