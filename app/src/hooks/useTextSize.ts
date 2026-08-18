import { useEffect, useState } from 'react'

// Tre livelli di dimensione del testo. Il layout usa `rem` ovunque, quindi
// basta scalare il font-size di <html> (vedi index.css: html[data-text-size]) e
// tutto il testo cresce in proporzione — è il supporto a WCAG 1.4.4 "Resize text".
export type TextSize = 'default' | 'large' | 'xlarge'
const TEXT_SIZE_KEY = 'vesper-text-size'

function applyTextSize(size: TextSize) {
  if (size === 'default') {
    document.documentElement.removeAttribute('data-text-size')
  } else {
    document.documentElement.setAttribute('data-text-size', size)
  }
}

/**
 * Applica la dimensione testo salvata all'avvio (chiamata in main.tsx), come
 * per il font: il controllo vive solo in Impostazioni, senza questa init la
 * preferenza varrebbe solo mentre quella schermata è montata.
 */
export function initTextSize() {
  const stored = localStorage.getItem(TEXT_SIZE_KEY) as TextSize | null
  applyTextSize(stored ?? 'default')
}

export function useTextSize() {
  const [size, setSizeState] = useState<TextSize>(() => {
    const stored = localStorage.getItem(TEXT_SIZE_KEY) as TextSize | null
    return stored ?? 'default'
  })

  useEffect(() => {
    applyTextSize(size)
  }, [size])

  function setSize(next: TextSize) {
    localStorage.setItem(TEXT_SIZE_KEY, next)
    setSizeState(next)
  }

  return { size, setSize }
}
