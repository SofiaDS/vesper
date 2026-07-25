import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// Ogni quanto, al massimo, si annuncia "sto scrivendo" mentre si digita.
// Un evento per tasto premuto sarebbe uno spreco: basta ribadirlo ogni tanto.
const THROTTLE_MS = 2000
// Quanto vale un annuncio prima di considerarlo scaduto. Deve superare
// THROTTLE_MS con un margine, altrimenti l'indicatore lampeggia tra un
// annuncio e il successivo mentre la persona sta ancora scrivendo.
const TTL_MS = 5000
// Cadenza con cui si ripuliscono gli annunci scaduti.
const SWEEP_MS = 1000

type Scope = 'room' | 'dm'

interface TypingEvent {
  userId: string
  // Usato solo nei DM, dove si mostra chi sta scrivendo. Nelle stanze
  // l'indicatore resta anonimo, quindi lì il nickname non viene nemmeno letto.
  nickname?: string
}

interface Options {
  scope: Scope
  scopeId: string
  myId: string | undefined
  myNickname: string | undefined
  // false = non annunciamo di stare scrivendo. Rispetta l'impostazione
  // "mostra quando sono online": digitare è a tutti gli effetti un segnale di
  // presenza, e chi ha scelto di non risultare online non deve trapelare da qui.
  broadcast: boolean
  // Chi è bloccato non deve nemmeno far comparire "sta scrivendo".
  blockedIds?: React.MutableRefObject<Set<string>>
}

interface TypingState {
  // Frase pronta da mostrare, o null se non sta scrivendo nessunə.
  label: string | null
  // Da chiamare a ogni battuta.
  notifyTyping: () => void
  // Da chiamare all'invio: fa sparire subito l'indicatore altrui invece di
  // aspettare il TTL, che dopo un messaggio già arrivato sarebbe fantasma.
  stopTyping: () => void
}

// Indicatore "sta scrivendo" per stanze e DM.
//
// Viaggia su un canale Realtime **broadcast** dedicato, separato da quello dei
// messaggi e da quello di presenza: è informazione effimera, non deve toccare
// il database né sporcare i canali esistenti. Nessuna tabella, nessuna
// migrazione, nessuna riga scritta.
//
// La scadenza è gestita da chi riceve, non da chi scrive: se una persona chiude
// la scheda o perde la connessione mentre sta scrivendo, il suo annuncio scade
// da solo dopo TTL_MS e l'indicatore sparisce. Affidarsi a un messaggio di
// "ho smesso" lascerebbe indicatori appesi per sempre.
export function useTypingIndicator({
  scope,
  scopeId,
  myId,
  myNickname,
  broadcast,
  blockedIds,
}: Options): TypingState {
  // userId → { nickname, scadenza }. In una ref perché il callback del canale
  // viene registrato una volta sola e non deve dipendere dallo stato React.
  const typers = useRef<Map<string, { nickname?: string; expiresAt: number }>>(new Map())
  const [label, setLabel] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const lastSentAt = useRef(0)

  useEffect(() => {
    if (!myId) return
    typers.current.clear()
    setLabel(null)

    const ch = supabase.channel(`typing:${scope}:${scopeId}`, {
      // self:false — non ci interessa vedere il nostro stesso annuncio.
      config: { broadcast: { self: false } },
    })

    ch.on('broadcast', { event: 'typing' }, ({ payload }) => {
      const e = payload as TypingEvent
      if (!e?.userId || e.userId === myId) return
      if (blockedIds?.current.has(e.userId)) return
      typers.current.set(e.userId, { nickname: e.nickname, expiresAt: Date.now() + TTL_MS })
    })

    ch.on('broadcast', { event: 'stop' }, ({ payload }) => {
      const e = payload as TypingEvent
      if (e?.userId) typers.current.delete(e.userId)
    })

    ch.subscribe()
    channelRef.current = ch

    // Un solo timer ricalcola la frase: scarta gli annunci scaduti e aggiorna
    // lo stato React soltanto quando il testo cambia davvero, così non forza
    // un render al secondo su ogni chat aperta.
    const sweep = setInterval(() => {
      const now = Date.now()
      let changed = false
      for (const [id, entry] of typers.current) {
        if (entry.expiresAt <= now) {
          typers.current.delete(id)
          changed = true
        }
      }
      const active = [...typers.current.values()]
      const next =
        active.length === 0
          ? null
          : scope === 'dm'
            // DM: la conversazione è 1 a 1, quindi chi scrive è identificabile
            // e dirlo non rivela niente che non si sappia già.
            ? `${active[0].nickname ?? 'Sta scrivendo'} sta scrivendo…`
            // Stanze: indicatore anonimo. Con molte persone non avrebbe senso
            // elencarle, e non serve esporre chi sta per intervenire.
            : active.length === 1
              ? 'qualcunə sta scrivendo…'
              : 'più persone stanno scrivendo…'
      setLabel((prev) => (prev === next && !changed ? prev : next))
    }, SWEEP_MS)

    return () => {
      clearInterval(sweep)
      channelRef.current = null
      supabase.removeChannel(ch)
    }
  }, [scope, scopeId, myId, blockedIds])

  const notifyTyping = useCallback(() => {
    if (!broadcast || !myId) return
    const now = Date.now()
    if (now - lastSentAt.current < THROTTLE_MS) return
    lastSentAt.current = now
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: myId, nickname: myNickname } satisfies TypingEvent,
    })
  }, [broadcast, myId, myNickname])

  const stopTyping = useCallback(() => {
    if (!myId) return
    // Azzera il throttle: dopo un invio, la battuta successiva deve poter
    // riannunciare subito invece di restare muta fino a THROTTLE_MS.
    lastSentAt.current = 0
    channelRef.current?.send({
      type: 'broadcast',
      event: 'stop',
      payload: { userId: myId } satisfies TypingEvent,
    })
  }, [myId])

  return { label, notifyTyping, stopTyping }
}
