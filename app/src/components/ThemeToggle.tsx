import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      className="theme-btn"
      onClick={toggle}
      aria-label={isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      title={isDark ? 'Tema chiaro' : 'Tema scuro'}
    >
      {isDark ? '☀' : '🌙'}
    </button>
  )
}
