import { useEffect, useRef } from 'react'

// Risponde al service worker quando chiede quale conversazione è aperta, per
// permettergli di scartare le notifiche push ridondanti (vedi src/sw.ts).
//
// Perché a domanda e non annunciando lo stato a ogni navigazione: un service
// worker può essere terminato dal browser in qualsiasi momento e riavviato per
// consegnare la push, perdendo tutto ciò che aveva in memoria. Chiedendo al
// momento dell'evento la risposta è sempre attuale, e non serve nessuna
// persistenza.
//
// Rispecchia la stessa regola dei toast in-app di useMessageNotifications:
// niente avviso per la stanza che stai leggendo, niente per la conversazione
// DM che hai aperta (o per tutte, se sei sull'elenco "Messaggi").
export function useActiveViewReporter(
  activeRoomId: string | null,
  dmOpen: boolean,
  activeDmConversationId: string | null,
): void {
  // Il listener viene registrato una volta sola: i valori volatili passano da
  // una ref, così non serve riagganciarlo a ogni navigazione.
  const view = useRef({ activeRoomId, dmOpen, activeDmConversationId })
  view.current = { activeRoomId, dmOpen, activeDmConversationId }

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    function onMessage(e: MessageEvent) {
      if ((e.data as { type?: string } | null)?.type !== 'query-active-view') return
      // Il service worker ascolta sulla porta che ha allegato al messaggio.
      e.ports[0]?.postMessage({
        roomId: view.current.activeRoomId,
        dmOpen: view.current.dmOpen,
        dmConversationId: view.current.activeDmConversationId,
      })
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])
}
