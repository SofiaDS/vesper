import { useEffect } from 'react'
import { touchLastSeen } from '../lib/presence'

// Cadenza dell'heartbeat. Va sotto la soglia "online" lato server (150s) così
// chi è attivo resta online tollerando un beat saltato.
const HEARTBEAT_MS = 60_000

// Mantiene aggiornato il proprio last_seen mentre l'app è in uso. Batte solo
// quando la scheda è in primo piano: chiusa/in background, l'heartbeat si ferma
// e dopo la soglia si risulta offline (così "online" riflette davvero l'uso
// attivo). Da montare una sola volta, in Home.
export function useHeartbeat(myId: string | undefined): void {
  useEffect(() => {
    if (!myId) return
    let timer: ReturnType<typeof setInterval> | null = null

    function beat() {
      touchLastSeen().catch(() => {})
    }
    function start() {
      if (timer) return
      beat()
      timer = setInterval(beat, HEARTBEAT_MS)
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null }
    }
    function onVisibility() {
      if (document.hidden) stop()
      else start()
    }

    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [myId])
}
