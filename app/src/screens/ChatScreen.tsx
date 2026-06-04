import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { FOYER_SLUG } from '../lib/types'

interface ChatMessage {
  id: number
  body: string
  created_at: string
  sender_id: string
  nickname: string
}

export function ChatScreen() {
  const { session, profile, signOut } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Id della stanza Foyer, risolto al mount e usato anche nell'invio.
  const foyerId = useRef<string | null>(null)
  // Cache id-profilo -> nickname, per non interrogare il DB a ogni messaggio.
  const nicknameCache = useRef<Map<string, string>>(new Map())
  const bottomRef = useRef<HTMLDivElement>(null)

  const myId = session?.user.id

  // Aggiunge un messaggio evitando i duplicati (stesso id puo' arrivare sia
  // dalla insert locale sia dalla notifica realtime).
  function appendMessage(msg: ChatMessage) {
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
    )
  }

  // Risolve il nickname di un sender: prima dalla cache, poi dal DB.
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

    async function init() {
      // 1) Trova la stanza Foyer.
      const { data: foyer, error: foyerErr } = await supabase
        .from('chatrooms')
        .select('id')
        .eq('slug', FOYER_SLUG)
        .single()
      if (foyerErr || !foyer) {
        if (active) {
          setError('Impossibile aprire il Foyer.')
          setLoading(false)
        }
        return
      }
      foyerId.current = foyer.id as string

      // 2) Carica gli ultimi messaggi (RLS: solo se sei membro).
      const { data: rows, error: msgErr } = await supabase
        .from('messages')
        .select('id, body, created_at, sender_id')
        .eq('chatroom_id', foyerId.current)
        .order('created_at', { ascending: true })
        .limit(100)
      if (msgErr) {
        if (active) {
          setError(msgErr.message)
          setLoading(false)
        }
        return
      }

      // 3) Risolvi i nickname dei mittenti in un colpo solo.
      const senderIds = [...new Set((rows ?? []).map((r) => r.sender_id))]
      if (senderIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, nickname')
          .in('id', senderIds)
        for (const p of profs ?? []) {
          nicknameCache.current.set(p.id, p.nickname)
        }
      }

      if (!active) return
      setMessages(
        (rows ?? []).map((r) => ({
          id: r.id,
          body: r.body,
          created_at: r.created_at,
          sender_id: r.sender_id,
          nickname: nicknameCache.current.get(r.sender_id) ?? '—',
        })),
      )
      setLoading(false)

      // 4) Sottoscrizione realtime ai nuovi messaggi del Foyer.
      channel = supabase
        .channel(`foyer:${foyerId.current}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chatroom_id=eq.${foyerId.current}`,
          },
          async (payload) => {
            const row = payload.new as {
              id: number
              body: string
              created_at: string
              sender_id: string
            }
            const nickname = await resolveNickname(row.sender_id)
            appendMessage({
              id: row.id,
              body: row.body,
              created_at: row.created_at,
              sender_id: row.sender_id,
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
  }, [])

  // Auto-scroll verso il fondo quando arrivano messaggi.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body || !myId || !foyerId.current) return

    setSending(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chatroom_id: foyerId.current,
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
        <div>
          <h1>Foyer</h1>
          <p className="muted small-inline">Ciao {profile?.nickname}</p>
        </div>
        <button type="button" className="link" onClick={signOut}>
          Esci
        </button>
      </header>

      <section className="messages">
        {loading && <p className="muted">Carico i messaggi…</p>}
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
