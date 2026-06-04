import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import type { Chatroom } from '../lib/types'

interface ChatMessage {
  id: number
  body: string
  created_at: string
  sender_id: string
  nickname: string
}

// Quanti messaggi caricare per pagina (iniziale e "carica più vecchi").
const PAGE_SIZE = 50

// Formatta l'orario di un messaggio come HH:MM (locale).
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatScreen({
  room,
  onBack,
}: {
  room: Chatroom
  onBack: () => void
}) {
  const { session, profile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // C'e' ancora storia piu' vecchia da caricare?
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)

  // Cache id-profilo -> nickname, per non interrogare il DB a ogni messaggio.
  const nicknameCache = useRef<Map<string, string>>(new Map())
  const bottomRef = useRef<HTMLDivElement>(null)
  // Evita l'auto-scroll quando stiamo prependendo messaggi vecchi.
  const skipAutoScroll = useRef(false)

  const myId = session?.user.id

  // Aggiunge un messaggio in coda evitando i duplicati (stesso id puo' arrivare
  // sia dalla insert locale sia dalla notifica realtime).
  function appendMessage(msg: ChatMessage) {
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
    )
  }

  // Risolve i nickname di un set di mittenti in un colpo solo, popolando la cache.
  async function cacheNicknames(senderIds: string[]) {
    const missing = senderIds.filter((id) => !nicknameCache.current.has(id))
    if (missing.length === 0) return
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, nickname')
      .in('id', missing)
    for (const p of profs ?? []) {
      nicknameCache.current.set(p.id, p.nickname)
    }
  }

  // Risolve il nickname di un singolo sender (per il realtime).
  async function resolveNickname(senderId: string): Promise<string> {
    const cached = nicknameCache.current.get(senderId)
    if (cached) return cached
    const { data } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', senderId)
      .maybeSingle()
    const nick = data?.nickname ?? '—'
    nicknameCache.current.set(senderId, nick)
    return nick
  }

  useEffect(() => {
    let active = true
    let channel: ReturnType<typeof supabase.channel> | null = null

    // Reset stato quando si cambia stanza.
    setMessages([])
    setLoading(true)
    setError(null)
    setHasMore(false)

    async function init() {
      // Carica gli ultimi PAGE_SIZE messaggi (RLS: solo se sei membro).
      // Prendiamo i piu' recenti in DESC e poi invertiamo per mostrarli
      // in ordine cronologico.
      const { data: rows, error: msgErr } = await supabase
        .from('messages')
        .select('id, body, created_at, sender_id')
        .eq('chatroom_id', room.id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
      if (msgErr) {
        if (active) {
          setError(msgErr.message)
          setLoading(false)
        }
        return
      }

      const ordered = (rows ?? []).slice().reverse()
      await cacheNicknames([...new Set(ordered.map((r) => r.sender_id))])

      if (!active) return
      setMessages(
        ordered.map((r) => ({
          id: r.id,
          body: r.body,
          created_at: r.created_at,
          sender_id: r.sender_id,
          nickname: nicknameCache.current.get(r.sender_id) ?? '—',
        })),
      )
      setHasMore((rows ?? []).length === PAGE_SIZE)
      setLoading(false)

      // Sottoscrizione realtime ai nuovi messaggi della stanza.
      channel = supabase
        .channel(`room:${room.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chatroom_id=eq.${room.id}`,
          },
          async (payload) => {
            const r = payload.new as {
              id: number
              body: string
              created_at: string
              sender_id: string
            }
            const nickname = await resolveNickname(r.sender_id)
            appendMessage({
              id: r.id,
              body: r.body,
              created_at: r.created_at,
              sender_id: r.sender_id,
              nickname,
            })
          },
        )
        .subscribe()
    }

    init()

    return () => {
      active = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [room.id])

  // Auto-scroll verso il fondo quando arrivano nuovi messaggi, ma non quando
  // stiamo caricando storia piu' vecchia (prepend in cima).
  useEffect(() => {
    if (skipAutoScroll.current) {
      skipAutoScroll.current = false
      return
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Carica una pagina di messaggi piu' vecchi (prima del piu' vecchio in lista).
  async function loadOlder() {
    if (loadingOlder || messages.length === 0) return
    setLoadingOlder(true)
    setError(null)
    try {
      const oldest = messages[0]
      const { data: rows, error: olderErr } = await supabase
        .from('messages')
        .select('id, body, created_at, sender_id')
        .eq('chatroom_id', room.id)
        .lt('created_at', oldest.created_at)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
      if (olderErr) throw olderErr

      const older = (rows ?? []).slice().reverse()
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body || !myId) return

    setSending(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chatroom_id: room.id,
          sender_id: myId,
          body,
        })
        .select('id, body, created_at, sender_id')
        .single()
      if (error) throw error
      if (data) {
        // Append immediato (la notifica realtime verra' deduplicata per id).
        appendMessage({
          id: data.id,
          body: data.body,
          created_at: data.created_at,
          sender_id: data.sender_id,
          nickname: profile?.nickname ?? 'tu',
        })
      }
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invio non riuscito.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="chat">
      <header className="chat-header">
        <button type="button" className="link back" onClick={onBack}>
          ‹ Stanze
        </button>
        <div className="chat-title">
          <h1>{room.name}</h1>
          <p className="muted small-inline">Ciao {profile?.nickname}</p>
        </div>
      </header>

      <section className="messages">
        {loading && <p className="muted">Carico i messaggi…</p>}
        {!loading && hasMore && (
          <button
            type="button"
            className="link load-older"
            onClick={loadOlder}
            disabled={loadingOlder}
          >
            {loadingOlder ? 'Carico…' : 'Carica messaggi precedenti'}
          </button>
        )}
        {!loading && messages.length === 0 && (
          <p className="muted">
            Ancora nessun messaggio. Scrivi tu il primo. 👋
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.sender_id === myId ? 'msg msg-mine' : 'msg'}
          >
            {m.sender_id !== myId && (
              <span className="msg-author">{m.nickname}</span>
            )}
            <span className="msg-body">{m.body}</span>
            <span className="msg-time">{formatTime(m.created_at)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </section>

      {error && <p className="err chat-error">{error}</p>}

      <form className="composer" onSubmit={handleSend}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Scrivi un messaggio…"
          maxLength={2000}
          aria-label="Messaggio"
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={sending || !text.trim()}
        >
          Invia
        </button>
      </form>
    </main>
  )
}
