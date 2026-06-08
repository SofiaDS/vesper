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
  blockedIds: React.MutableRefObject<Set<string>>
  nicknameCache: React.MutableRefObject<Map<string, string>>
  loadBlockedIds: () => Promise<void>
  cacheNicknames: (ids: string[]) => Promise<void>
}

export function useChatMessages({
  roomId,
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
  // Evita auto-scroll quando si prependono messaggi vecchi.
  const skipAutoScroll = useRef(false)

  function appendMessage(msg: ChatMessage) {
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
    )
  }

  useEffect(() => {
    let active = true
    setMessages([])
    setLoading(true)
    setError(null)
    setHasMore(false)

    async function init() {
      const { data: rows, error: msgErr } = await supabase
        .from('messages')
        .select('id, body, created_at, sender_id, reply_to_id')
        .eq('chatroom_id', roomId)
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
  }, [roomId])

  async function loadOlder(oldestCreatedAt: string) {
    if (loadingOlder) return
    setLoadingOlder(true)
    setError(null)
    try {
      const { data: rows, error: olderErr } = await supabase
        .from('messages')
        .select('id, body, created_at, sender_id, reply_to_id')
        .eq('chatroom_id', roomId)
        .lt('created_at', oldestCreatedAt)
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
  }
}
