import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface ChatMessage {
  id: number
  body: string
  created_at: string
  sender_id: string
  nickname: string
  reply_to_id: number | null
}

const PAGE_SIZE = 50

interface Options {
  roomId: string
  myId: string | undefined
  blockedIds: React.MutableRefObject<Set<string>>
  nicknameCache: React.MutableRefObject<Map<string, string>>
  loadBlockedIds: () => Promise<void>
  cacheNicknames: (ids: string[]) => Promise<void>
}

export function useChatMessages({
  roomId,
  myId,
  blockedIds,
  nicknameCache,
  loadBlockedIds,
  cacheNicknames,
}: Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  // Evita auto-scroll quando si prependono messaggi vecchi.
  const skipAutoScroll = useRef(false)
  // Momento in cui l'utente si è iscritto alla stanza: non mostriamo i messaggi
  // inviati prima, così entrando non si eredita tutto lo storico pregresso.
  // (Il Foyer è auto-join alla registrazione → joined_at ≈ signup.)
  const joinedAt = useRef<string | null>(null)
  // Copia dei messaggi leggibile dentro le callback (catchUp) senza rientrare
  // nelle dipendenze degli effetti.
  const messagesRef = useRef<ChatMessage[]>([])
  messagesRef.current = messages
  // Evita due recuperi sovrapposti (resume + riaggancio del realtime insieme).
  const catchingUp = useRef(false)

  function appendMessage(msg: ChatMessage) {
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
    )
  }

  // Ripesca i messaggi arrivati mentre eravamo "via": in background la WebView
  // viene sospesa e il websocket realtime cade, così i messaggi inseriti nel
  // frattempo non li vede nessuno — la chat si apriva senza il messaggio della
  // notifica finché non si usciva e rientrava. Qui li chiediamo al server e li
  // accodiamo, senza svuotare la lista (niente sfarfallio, niente salto dello
  // scroll a chi sta leggendo indietro).
  async function catchUp() {
    if (catchingUp.current || !roomId) return
    const last = messagesRef.current[messagesRef.current.length - 1]
    const since = last?.created_at ?? joinedAt.current
    catchingUp.current = true
    try {
      let query = supabase
        .from('messages')
        .select('id, body, created_at, sender_id, reply_to_id')
        .eq('chatroom_id', roomId)
      if (since) query = query.gt('created_at', since)
      const { data: rows, error: gapErr } = await query
        .order('created_at', { ascending: true })
        .limit(PAGE_SIZE)
      if (gapErr || !rows || rows.length === 0) return

      const fresh = rows.filter((r) => !blockedIds.current.has(r.sender_id))
      if (fresh.length === 0) return
      await cacheNicknames([...new Set(fresh.map((r) => r.sender_id))])

      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id))
        const added = fresh
          .filter((r) => !known.has(r.id))
          .map((r) => ({
            id: r.id,
            body: r.body,
            created_at: r.created_at,
            sender_id: r.sender_id,
            nickname: nicknameCache.current.get(r.sender_id) ?? '—',
            reply_to_id: r.reply_to_id,
          }))
        return added.length > 0 ? [...prev, ...added] : prev
      })
    } finally {
      catchingUp.current = false
    }
  }

  useEffect(() => {
    let active = true
    setMessages([])
    setLoading(true)
    setError(null)
    setHasMore(false)

    async function init() {
      // Recupera il momento di iscrizione per filtrare via lo storico
      // precedente. Se manca la riga (es. Foyer non ancora seminato), non
      // filtriamo: meglio mostrare i messaggi che nasconderli per errore.
      const { data: mem } = myId
        ? await supabase
            .from('chat_membership')
            .select('joined_at')
            .eq('chatroom_id', roomId)
            .eq('user_id', myId)
            .maybeSingle()
        : { data: null }
      if (!active) return
      joinedAt.current = mem?.joined_at ?? null

      let query = supabase
        .from('messages')
        .select('id, body, created_at, sender_id, reply_to_id')
        .eq('chatroom_id', roomId)
      if (joinedAt.current) query = query.gte('created_at', joinedAt.current)
      const { data: rows, error: msgErr } = await query
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (msgErr) {
        if (active) {
          setError(msgErr.message)
          setLoading(false)
        }
        return
      }

      await loadBlockedIds()
      const ordered = (rows ?? [])
        .slice()
        .reverse()
        .filter((r) => !blockedIds.current.has(r.sender_id))
      await cacheNicknames([...new Set(ordered.map((r) => r.sender_id))])

      if (!active) return
      setMessages(
        ordered.map((r) => ({
          id: r.id,
          body: r.body,
          created_at: r.created_at,
          sender_id: r.sender_id,
          nickname: nicknameCache.current.get(r.sender_id) ?? '—',
          reply_to_id: r.reply_to_id,
        })),
      )
      setHasMore((rows ?? []).length === PAGE_SIZE)
      setLoading(false)
    }

    init()
    return () => { active = false }
  }, [roomId, myId, reloadKey])

  function reload() {
    setReloadKey((k) => k + 1)
  }

  async function loadOlder(oldestCreatedAt: string) {
    if (loadingOlder) return
    setLoadingOlder(true)
    setError(null)
    try {
      let olderQuery = supabase
        .from('messages')
        .select('id, body, created_at, sender_id, reply_to_id')
        .eq('chatroom_id', roomId)
        .lt('created_at', oldestCreatedAt)
      if (joinedAt.current) olderQuery = olderQuery.gte('created_at', joinedAt.current)
      const { data: rows, error: olderErr } = await olderQuery
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
      if (olderErr) throw olderErr

      const older = (rows ?? [])
        .slice()
        .reverse()
        .filter((r) => !blockedIds.current.has(r.sender_id))
      await cacheNicknames([...new Set(older.map((r) => r.sender_id))])

      skipAutoScroll.current = true
      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id))
        const prepend = older
          .filter((r) => !existing.has(r.id))
          .map((r) => ({
            id: r.id,
            body: r.body,
            created_at: r.created_at,
            sender_id: r.sender_id,
            nickname: nicknameCache.current.get(r.sender_id) ?? '—',
            reply_to_id: r.reply_to_id,
          }))
        return [...prepend, ...prev]
      })
      setHasMore((rows ?? []).length === PAGE_SIZE)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Caricamento non riuscito.')
    } finally {
      setLoadingOlder(false)
    }
  }

  return {
    messages,
    loading,
    error,
    hasMore,
    loadingOlder,
    skipAutoScroll,
    appendMessage,
    loadOlder,
    setError,
    reload,
    catchUp,
  }
}
