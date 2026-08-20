import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { ChatMessage } from './useChatMessages'

interface Options {
  roomId: string
  blockedIds: React.MutableRefObject<Set<string>>
  resolveNickname: (senderId: string) => Promise<string>
  onMessage: (msg: ChatMessage) => void
  /**
   * Chiamata quando il canale si riaggancia dopo una caduta (schermo spento,
   * app in background, rete persa). Il realtime NON rigioca ciò che è successo
   * mentre era giù: chi ci usa deve ripescare il buco da solo.
   */
  onResync?: () => void
}

export function useChatRealtime({
  roomId,
  blockedIds,
  resolveNickname,
  onMessage,
  onResync,
}: Options) {
  // Callback sempre fresche senza rimettere in piedi il canale a ogni render.
  const resyncRef = useRef(onResync)
  resyncRef.current = onResync

  useEffect(() => {
    let subscribedOnce = false
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
            reply_to_id: number | null
          }
          if (blockedIds.current.has(r.sender_id)) return
          const nickname = await resolveNickname(r.sender_id)
          onMessage({
            id: r.id,
            body: r.body,
            created_at: r.created_at,
            sender_id: r.sender_id,
            nickname,
            reply_to_id: r.reply_to_id,
          })
        },
      )
      .subscribe((status) => {
        // Il primo SUBSCRIBED è l'iscrizione iniziale (la lista è appena stata
        // caricata dal server, niente da recuperare). Quelli successivi sono
        // riagganci dopo una caduta: lì sì che può esserci un buco.
        if (status !== 'SUBSCRIBED') return
        if (subscribedOnce) resyncRef.current?.()
        subscribedOnce = true
      })

    return () => { supabase.removeChannel(channel) }
  }, [roomId])
}
