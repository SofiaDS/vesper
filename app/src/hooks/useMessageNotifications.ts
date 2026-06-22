import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useChatCache } from './useChatCache'
import type { Chatroom } from '../types'

// Durata (ms) per cui un toast resta a schermo prima di scomparire da solo.
const AUTO_DISMISS_MS = 6000

export interface MessageNotification {
  // Chiave univoca (tabella + id riga): usata come key React e per de-duplicare
  // gli eventi realtime occasionalmente doppi.
  key: string
  kind: 'room' | 'dm'
  senderNickname: string
  // true se il messaggio di stanza cita "@mionickname".
  isMention: boolean
  // Corpo del messaggio (troncato via CSS).
  preview: string
  // Nome della stanza (solo per kind === 'room').
  roomName?: string
  // Stanza completa da aprire al click (solo per kind === 'room').
  room?: Chatroom
}

interface Options {
  myId: string | undefined
  myNickname: string | undefined
  // Stanza attualmente aperta in ChatScreen: i suoi messaggi non generano toast
  // (li stai già leggendo). null se non sei in una chat di stanza.
  activeRoomId: string | null
  // true se la sezione "Messaggi" (DM) è aperta: in tal caso niente toast DM.
  dmOpen: boolean
}

// Verifica se `body` contiene una menzione "@nickname" dell'utente corrente.
// I nickname sono [a-zA-Z0-9_]{3,24} (vedi MentionText) quindi non servono
// escape regex; richiediamo che dopo il nick non segua un altro carattere di
// parola, così "@anna" non matcha dentro "@annamaria".
function mentionsMe(body: string, nickname: string | undefined): boolean {
  if (!nickname) return false
  return new RegExp(`@${nickname}(?![a-zA-Z0-9_])`, 'i').test(body)
}

// Notifiche in-app cross-screen (toast globale, vedi mockup `.global-toast`):
// ascolta in realtime i nuovi messaggi di stanza e DM ovunque ti trovi
// nell'app e mostra un toast quando NON stai già guardando quella
// conversazione. Riusa l'infrastruttura esistente:
//   - postgres_changes su `messages`/`dm_messages` (già nella publication
//     realtime e protette da RLS: ricevi solo righe che puoi leggere);
//   - useChatCache per risolvere nickname e lista bloccati.
// Nessun dato/colonna nuovi lato Supabase.
export function useMessageNotifications({
  myId,
  myNickname,
  activeRoomId,
  dmOpen,
}: Options): { toast: MessageNotification | null; dismiss: () => void } {
  const [toast, setToast] = useState<MessageNotification | null>(null)
  const { blockedIds, loadBlockedIds, resolveNickname } = useChatCache()

  // Valori che cambiano spesso ma che il callback realtime (registrato una
  // sola volta) deve leggere aggiornati: li teniamo in ref per non dover
  // ri-sottoscrivere il canale a ogni navigazione.
  const activeRoomIdRef = useRef(activeRoomId)
  const dmOpenRef = useRef(dmOpen)
  const myNicknameRef = useRef(myNickname)
  activeRoomIdRef.current = activeRoomId
  dmOpenRef.current = dmOpen
  myNicknameRef.current = myNickname

  // Cache delle stanze già risolte (id → Chatroom) e degli eventi già visti.
  const roomCache = useRef<Map<string, Chatroom>>(new Map())
  const seenKeys = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!myId) { setToast(null); return }
    let alive = true
    loadBlockedIds()

    async function fetchRoom(id: string): Promise<Chatroom | null> {
      const cached = roomCache.current.get(id)
      if (cached) return cached
      const { data } = await supabase
        .from('chatrooms')
        .select('id, slug, name, description, kind')
        .eq('id', id)
        .maybeSingle()
      const room = (data as Chatroom | null) ?? null
      if (room) roomCache.current.set(id, room)
      return room
    }

    function remember(key: string): boolean {
      if (seenKeys.current.has(key)) return false
      seenKeys.current.add(key)
      // Tiene la memoria limitata: scarta le chiavi più vecchie.
      if (seenKeys.current.size > 200) {
        seenKeys.current = new Set([...seenKeys.current].slice(-100))
      }
      return true
    }

    const channel = supabase
      .channel('global_message_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const r = payload.new as {
            id: number
            body: string
            sender_id: string
            chatroom_id: string
          }
          if (r.sender_id === myId) return
          if (blockedIds.current.has(r.sender_id)) return
          if (r.chatroom_id === activeRoomIdRef.current) return
          const key = `msg:${r.id}`
          if (!remember(key)) return
          const [room, senderNickname] = await Promise.all([
            fetchRoom(r.chatroom_id),
            resolveNickname(r.sender_id),
          ])
          if (!alive || !room) return
          setToast({
            key,
            kind: 'room',
            senderNickname,
            isMention: mentionsMe(r.body, myNicknameRef.current),
            preview: r.body,
            roomName: room.name,
            room,
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dm_messages' },
        async (payload) => {
          const r = payload.new as { id: number; body: string; sender_id: string }
          if (r.sender_id === myId) return
          if (dmOpenRef.current) return
          if (blockedIds.current.has(r.sender_id)) return
          const key = `dm:${r.id}`
          if (!remember(key)) return
          const senderNickname = await resolveNickname(r.sender_id)
          if (!alive) return
          setToast({
            key,
            kind: 'dm',
            senderNickname,
            isMention: false,
            preview: r.body,
          })
        },
      )
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(channel)
    }
    // Sottoscrizione unica per sessione: i valori volatili passano via ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId])

  // Auto-dismiss: ogni nuovo toast riavvia il timer.
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [toast])

  return { toast, dismiss: () => setToast(null) }
}
