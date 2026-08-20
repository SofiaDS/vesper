import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { parseDeepLink, type DeepLinkIntent } from '../lib/deepLink'
import {
  clearPendingDeepLink,
  getPendingDeepLink,
  onPendingDeepLink,
} from '../lib/pushDeepLink'

const native = Capacitor.isNativePlatform()

// Espone l'ultimo intento di deep-link da consumare per navigare. Tre sorgenti:
//   - avvio a freddo web: l'app viene aperta su "/?dm=1" / "/?room=<id>" →
//     leggiamo location una volta;
//   - app web già aperta: il service worker, al click della notifica, mette a
//     fuoco la finestra esistente e le invia { type: 'deep-link', path } via
//     postMessage (una SPA a stato non rilegge l'URL da sola);
//   - nativo: il tap su una notifica FCM viene raccolto in lib/pushDeepLink,
//     registrato al boot dell'app (prima di React) perché Capacitor consegna
//     quell'evento una volta sola — se il listener nascesse qui, montato
//     tardi insieme a Home, l'intento del cold start andrebbe perso.
// Chi consuma chiama `consume()` dopo aver navigato, così un refresh o una
// seconda notifica non ri-triggerano una vecchia destinazione.
export function useDeepLink(): { intent: DeepLinkIntent | null; consume: () => void } {
  const [intent, setIntent] = useState<DeepLinkIntent | null>(() => {
    if (native) return getPendingDeepLink()
    return typeof window !== 'undefined'
      ? parseDeepLink(window.location.pathname + window.location.search)
      : null
  })

  useEffect(() => {
    // Ripulisci subito l'URL: l'app "vive" su "/", il query param era solo
    // l'istruzione iniziale. Senza questo, un refresh riaprirebbe la stessa
    // destinazione.
    if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== '/') {
      window.history.replaceState(null, '', '/')
    }

    if (native) {
      // Tap arrivato mentre l'app era già aperta: pushDeepLink ci sveglia.
      // Ricontrolliamo anche l'intento parcheggiato, nel caso sia stato
      // depositato tra il primo render e questo effetto.
      const parked = getPendingDeepLink()
      if (parked) setIntent(parked)
      return onPendingDeepLink(setIntent)
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

  return {
    intent,
    consume: () => {
      clearPendingDeepLink()
      setIntent(null)
    },
  }
}
