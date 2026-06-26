import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'
const THEME_KEY = 'vesper-theme'
// Evento custom per tenere allineate le istanze del hook nella stessa scheda
// (es. il toggle nell'header e quello in "Altro").
const THEME_EVENT = 'vesper-theme-change'

export function getStoredTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'dark'
}

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
  // Allinea la status bar (TWA/PWA) al tema corrente.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f0ece0' : '#171520')
}

export function useTheme() {
  // localStorage è la fonte di verità; lo script inline in index.html ha già
  // applicato il tema al primo paint, qui ci limitiamo a riallinearci.
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  // Applica il tema a ogni cambiamento. La persistenza NON va nell'updater di
  // setState (impuro → in StrictMode l'updater viene invocato due volte e il
  // valore salvato si corrompe): si scrive in toggle(), prima del setState.
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Mantiene sincronizzate le diverse istanze del hook (stessa scheda via
  // THEME_EVENT, schede diverse via l'evento 'storage').
  useEffect(() => {
    function sync() { setThemeState(getStoredTheme()) }
    window.addEventListener(THEME_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(THEME_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  function toggle() {
    const next: Theme = getStoredTheme() === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, next)
    setThemeState(next)
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  return { theme, toggle }
}
