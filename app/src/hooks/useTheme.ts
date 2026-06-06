import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'
const THEME_KEY = 'vesper-theme'

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null
    return stored ?? 'dark'
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Applica immediatamente al mount senza aspettare il render successivo
  useEffect(() => { applyTheme(theme) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(THEME_KEY, next)
      return next
    })
  }

  return { theme, toggle }
}
