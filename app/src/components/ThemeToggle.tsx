import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isLight = theme === 'light'
  return (
    <div className="theme-toggle-row">
      <span className="toggle-label">
        {isLight ? 'Tema chiaro' : 'Tema scuro'}
      </span>
      <button
        type="button"
        className={isLight ? 'toggle-pill on' : 'toggle-pill'}
        onClick={toggle}
        aria-label={isLight ? 'Passa al tema scuro' : 'Passa al tema chiaro'}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  )
}
