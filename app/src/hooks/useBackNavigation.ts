import { useEffect, useRef } from 'react'

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

// Vesper non usa un router: senza voci nella history del browser, il gesto
// "indietro" di sistema (swipe dal bordo, tasto fisico Android) chiude
// direttamente la PWA invece di tornare alla schermata precedente. Qui si
// inganna la history pushando una voce-sentinella ogni volta che si lascia
// la lobby; il pop di quella voce (evento popstate) viene intercettato e
// tradotto in `onBack`, ri-armando la trappola finché non si torna alla
// lobby — punto in cui il gesto successivo può uscire dall'app normalmente,
// come ci si aspetta da un tasto "indietro".
export function useBackNavigation({ active, exitsOnBack, onBack }: BackNavigationOptions) {
  const guardPresent = useRef(false)
  const latest = useRef({ active, exitsOnBack, onBack })
  latest.current = { active, exitsOnBack, onBack }

  useEffect(() => {
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
    if (active && !guardPresent.current) {
      window.history.pushState(GUARD_STATE, '')
      guardPresent.current = true
    } else if (!active && guardPresent.current) {
      guardPresent.current = false
      window.history.back()
    }
  }, [active])
}
