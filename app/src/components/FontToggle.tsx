import { useFont } from '../hooks/useFont'

export function FontToggle() {
  const { font, toggle } = useFont()
  const on = font === 'dyslexic'
  return (
    <div className="theme-toggle-row">
      <span className="toggle-label">
        Carattere ad alta leggibilità
        <span className="hint" style={{ display: 'block', marginTop: '0.15rem' }}>
          Usa OpenDyslexic, pensato per chi ha dislessia
        </span>
      </span>
      <button
        type="button"
        className={on ? 'toggle-pill on' : 'toggle-pill'}
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? 'Disattiva carattere per dislessia' : 'Attiva carattere per dislessia'}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  )
}
