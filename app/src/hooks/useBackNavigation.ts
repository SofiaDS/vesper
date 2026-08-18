import { useEffect, useRef } from 'react'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { App } from '@capacitor/app'

interface BackNavigationOptions {
  // true quando siamo su una schermata diversa dalla lobby: è la condizione
  // in cui il gesto/pulsante "indietro" di sistema deve restare nell'app
  // invece di chiuderla.
  active: boolean
  // true se richiamare onBack riporta alla lobby: non c'è un altro livello
  // da proteggere e la "trappola" sulla history non va riarmata.
  exitsOnBack: boolean
  onBack: () => void
}

const GUARD_STATE = { vesperBackGuard: true }

// Nel guscio nativo il gesto/tasto "indietro" NON passa dalla history del
// browser, quindi il trucco pushState/popstate (sotto) non lo intercetta: senza
// un handler nativo Capacitor lascia che Android chiuda l'activity → l'app si
// chiude invece di tornare indietro. Perciò sul nativo usiamo @capacitor/app.
const native = Capacitor.isNativePlatform()

// Vesper non usa un router: senza voci nella history del browser, il gesto
// "indietro" di sistema (swipe dal bordo, tasto fisico Android) chiude
// direttamente la PWA invece di tornare alla schermata precedente. Sul WEB si
// inganna la history pushando una voce-sentinella ogni volta che si lascia la
// lobby; il pop di quella voce (evento popstate) viene intercettato e tradotto
// in `onBack`, ri-armando la trappola finché non si torna alla lobby — punto in
// cui il gesto successivo può uscire dall'app normalmente. Sul NATIVO lo stesso
// risultato si ottiene con l'evento backButton di @capacitor/app.
export function useBackNavigation({ active, exitsOnBack, onBack }: BackNavigationOptions) {
  const guardPresent = useRef(false)
  // Un solo listener nativo vive per tutta la sessione, ma `active`/`onBack`
  // cambiano a ogni navigazione: li leggiamo sempre aggiornati da questo ref.
  const latest = useRef({ active, exitsOnBack, onBack })
  latest.current = { active, exitsOnBack, onBack }

  // ── NATIVO: tasto/gesto "indietro" di Android via @capacitor/app ──────────
  useEffect(() => {
    if (!native) return
    let handle: PluginListenerHandle | undefined
    let removed = false
    // Il listener persiste; a ogni pressione decide in base allo stato corrente:
    // su una sotto-schermata torna indietro di un livello, sulla lobby esce
    // dall'app (comportamento atteso del "indietro" alla radice).
    App.addListener('backButton', () => {
      if (latest.current.active) latest.current.onBack()
      else App.exitApp()
    }).then((h) => {
      handle = h
      if (removed) h.remove() // effetto già smontato prima che la Promise risolvesse
    })
    return () => {
      removed = true
      handle?.remove()
    }
  }, [])

  // ── WEB / PWA: inganno sulla history del browser ──────────────────────────
  useEffect(() => {
    if (native) return
    function handlePopState() {
      if (!guardPresent.current) return
      guardPresent.current = false
      const { active, exitsOnBack, onBack } = latest.current
      if (!active) return
      onBack()
      if (!exitsOnBack) {
        window.history.pushState(GUARD_STATE, '')
        guardPresent.current = true
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (native) return
    if (active && !guardPresent.current) {
      window.history.pushState(GUARD_STATE, '')
      guardPresent.current = true
    } else if (!active && guardPresent.current) {
      guardPresent.current = false
      window.history.back()
    }
  }, [active])
}
