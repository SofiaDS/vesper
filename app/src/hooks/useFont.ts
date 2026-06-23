import { useEffect, useState } from 'react'

export type FontPref = 'default' | 'dyslexic'
const FONT_KEY = 'vesper-font'

function applyFont(pref: FontPref) {
  if (pref === 'dyslexic') {
    document.documentElement.setAttribute('data-font', 'dyslexic')
  } else {
    document.documentElement.removeAttribute('data-font')
  }
}

/**
 * Applica la preferenza font salvata all'avvio dell'app (chiamata in main.tsx).
 * Necessario perché il toggle vive solo in Impostazioni: senza questa init il
 * carattere ad alta leggibilità varrebbe solo mentre quella schermata è montata.
 */
export function initFont() {
  const stored = localStorage.getItem(FONT_KEY) as FontPref | null
  applyFont(stored ?? 'default')
}

export function useFont() {
  const [font, setFont] = useState<FontPref>(() => {
    const stored = localStorage.getItem(FONT_KEY) as FontPref | null
    return stored ?? 'default'
  })

  useEffect(() => {
    applyFont(font)
  }, [font])

  function toggle() {
    setFont((prev) => {
      const next: FontPref = prev === 'default' ? 'dyslexic' : 'default'
      localStorage.setItem(FONT_KEY, next)
      return next
    })
  }

  return { font, toggle }
}
