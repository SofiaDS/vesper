import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ChatMessage } from './useChatMessages'

interface Options {
  roomId: string
  blockedIds: React.MutableRefObject<Set<string>>
  resolveNickname: (senderId: string) => Promise<string>
  onMessage: (msg: ChatMessage) => void
}

export function useChatRealtime({
  roomId,
  blockedIds,
  resolveNickname,
  onMessage,
}: Options) {
  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chatroom_id=eq.${roomId}`,
        },
        async (payload) => {
          const r = payload.new as {
            id: number
            body: string
            created_at: string
            sender_id: string
          }
          if (blockedIds.current.has(r.sender_id)) return
          const nickname = await resolveNickname(r.sender_id)
          onMessage({
            id: r.id,
            body: r.body,
            created_at: r.created_at,
            sender_id: r.sender_id,
            nickname,
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId])
}
