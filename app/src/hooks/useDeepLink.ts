import { useEffect, useState } from 'react'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { parseDeepLink, type DeepLinkIntent } from '../lib/deepLink'

const native = Capacitor.isNativePlatform()

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
    typeof window !== 'undefined'
      ? parseDeepLink(window.location.pathname + window.location.search)
      : null,
  )

  useEffect(() => {
    // Ripulisci subito l'URL: l'app "vive" su "/", il query param era solo
    // l'istruzione iniziale. Senza questo, un refresh riaprirebbe la stessa
    // destinazione.
    if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== '/') {
      window.history.replaceState(null, '', '/')
    }

    // NATIVO: il tap su una notifica FCM arriva su 'pushNotificationActionPerformed'.
    // Il backend mette la destinazione in data.url ("/?room=x", "/?dm=1"): la
    // parsiamo come i deep-link web. Copre sia app in background sia avvio a freddo.
    if (native) {
      let handle: PluginListenerHandle | null = null
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const url = action.notification.data?.url
        if (typeof url !== 'string') return
        const next = parseDeepLink(url)
        if (next) setIntent(next)
      }).then((h) => { handle = h })
      return () => { handle?.remove() }
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
