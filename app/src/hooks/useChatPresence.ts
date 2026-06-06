import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface OnlineUser {
  userId: string
  nickname: string
}

// Traccia la presenza in tempo reale su un canale separato da quello dei messaggi.
// Se showOnline è false, l'utente vede le altre ma non appare nella lista.
export function useChatPresence(
  roomId: string,
  myId: string | undefined,
  myNickname: string | undefined,
  showOnline: boolean,
): OnlineUser[] {
  const [online, setOnline] = useState<OnlineUser[]>([])

  useEffect(() => {
    if (!myId || !myNickname) return

    const ch = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: myId } },
    })

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<
        string,
        Array<{ userId: string; nickname: string }>
      >
      setOnline(
        Object.values(state)
          .map((entries) => entries[0])
          .filter(Boolean)
          .map((p) => ({ userId: p.userId, nickname: p.nickname })),
      )
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && showOnline) {
        await ch.track({ userId: myId, nickname: myNickname })
      }
    })

    return () => {
      ch.untrack()
      supabase.removeChannel(ch)
    }
  }, [roomId, myId, myNickname, showOnline])

  return online
}
