import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getRoomUnread, getDmUnread, type RoomUnread } from '../lib/reads'

// Logica condivisa fra stanze e DM: carica una mappa di non letti via RPC e la
// ricarica (con piccolo debounce) quando arriva in realtime un nuovo messaggio
// altrui sulla tabella indicata. Attivo solo finché lo schermo che lo usa è
// montato — i conteggi si rinfrescano comunque a ogni rientro nella schermata.
function useUnreadMap<V>(
  myId: string | undefined,
  table: 'messages' | 'dm_messages',
  fetcher: () => Promise<Map<string, V>>,
): Map<string, V> {
  const [counts, setCounts] = useState<Map<string, V>>(new Map())
  // fetcher cambia identità a ogni render: lo teniamo in ref così l'effect può
  // dipendere solo da [myId, table] senza ri-sottoscrivere il canale.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!myId) { setCounts(new Map()); return }
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null

    function refresh() {
      fetcherRef.current().then((m) => { if (alive) setCounts(m) }).catch(() => {})
    }
    // Coalesce più insert ravvicinati in un solo refetch.
    function scheduleRefresh() {
      if (timer) return
      timer = setTimeout(() => { timer = null; refresh() }, 400)
    }

    refresh()

    const channel = supabase
      .channel(`unread_${table}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table },
        (payload) => {
          if ((payload.new as { sender_id?: string }).sender_id === myId) return
          scheduleRefresh()
        },
      )
      .subscribe()

    return () => {
      alive = false
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [myId, table])

  return counts
}

// Non letti per stanza (con flag menzione). Vuoto se la migration read_markers
// non è ancora applicata.
export function useRoomUnread(myId: string | undefined): Map<string, RoomUnread> {
  return useUnreadMap(myId, 'messages', getRoomUnread)
}

// Non letti per conversazione DM.
export function useDmUnread(myId: string | undefined): Map<string, number> {
  return useUnreadMap(myId, 'dm_messages', getDmUnread)
}
