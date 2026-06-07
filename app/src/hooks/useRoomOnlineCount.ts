import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Conta le presenze sul canale realtime della stanza, in sola lettura
// (nessun track: riusa lo stesso canale di useChatPresence senza aggiungersi alla lista).
export function useRoomOnlineCount(roomId: string): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const ch = supabase.channel(`presence:${roomId}`)

    ch.on('presence', { event: 'sync' }, () => {
      setCount(Object.keys(ch.presenceState()).length)
    }).subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [roomId])

  return count
}
