import { useEffect, useRef } from 'react'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { App } from '@capacitor/app'

const native = Capacitor.isNativePlatform()

/**
 * Chiama `onResume` quando l'app torna in primo piano (o la rete ritorna).
 *
 * Serve perché mentre l'app è in background Android sospende la WebView e il
 * websocket realtime di Supabase cade: i messaggi arrivati nel frattempo NON
 * vengono recapitati al ritorno (il canale si riaggancia ma non rigioca lo
 * storico). Chi lo usa ne approfitta per ripescare il buco.
 *
 * Due sorgenti perché nessuna copre tutto: `visibilitychange` funziona anche
 * su web/PWA, `appStateChange` di Capacitor è più affidabile nella WebView
 * Android (dove la visibility a volte non cambia).
 */
export function useAppResume(onResume: () => void) {
  // La callback cambia a ogni render di chi ci usa: la teniamo in un ref così
  // i listener si registrano una volta sola.
  const cb = useRef(onResume)
  cb.current = onResume

  useEffect(() => {
    function fire() { cb.current() }
    function onVisibility() {
      if (document.visibilityState === 'visible') fire()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', fire)

    let handle: PluginListenerHandle | null = null
    let cancelled = false
    if (native) {
      App.addListener('appStateChange', ({ isActive }) => { if (isActive) fire() })
        .then((h) => {
          if (cancelled) { void h.remove(); return }
          handle = h
        })
    }

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', fire)
      void handle?.remove()
    }
  }, [])
}
