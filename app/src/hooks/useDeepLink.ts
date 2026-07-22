import { useEffect, useState } from 'react'
import { parseDeepLink, type DeepLinkIntent } from '../lib/deepLink'

// Espone l'ultimo intento di deep-link da consumare per navigare. Due sorgenti:
//   - avvio a freddo: l'app viene aperta su /dm o /room/<id> (il rewrite SPA di
//     Vercel serve index.html) → leggiamo location.pathname una volta;
//   - app già aperta: il service worker, al click della notifica, mette a fuoco
//     la finestra esistente e le invia { type: 'deep-link', path } via
//     postMessage (una SPA a stato non rilegge l'URL da sola).
// Chi consuma chiama `consume()` dopo aver navigato, così un refresh o una
// seconda notifica non ri-triggerano una vecchia destinazione.
export function useDeepLink(): { intent: DeepLinkIntent | null; consume: () => void } {
  const [intent, setIntent] = useState<DeepLinkIntent | null>(() =>
    typeof window !== 'undefined' ? parseDeepLink(window.location.pathname) : null,
  )

  useEffect(() => {
    // Ripulisci subito l'URL: l'app "vive" su "/", il path era solo l'istruzione
    // iniziale. Senza questo, un refresh riaprirebbe la stessa destinazione.
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/')
    }

    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    function onMessage(e: MessageEvent) {
      const data = e.data as { type?: string; path?: string } | null
      if (data?.type !== 'deep-link' || typeof data.path !== 'string') return
      const next = parseDeepLink(data.path)
      if (next) setIntent(next)
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])

  return { intent, consume: () => setIntent(null) }
}
