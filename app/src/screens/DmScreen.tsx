import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { AppHeader } from '../components/AppHeader'
import { MessageComposer } from '../components/MessageComposer'
import { MessageReactions } from '../components/MessageReactions'
import { QuotePreview } from '../components/QuotePreview'
import { useMessageReactions } from '../hooks/useMessageReactions'
import {
  listDmConversations,
  acceptDmRequest,
  rejectDmRequest,
  getDmMessages,
  sendDmMessage,
  type DmConversation,
  type DmMessage,
} from '../lib/dm'
import { isBlocked } from '../lib/blocks'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

// ─── Vista conversazione singola ──────────────────────────────────────────────

function ConversationView({
  conversation,
  myId,
  onBack,
  onOpenProfile,
}: {
  conversation: DmConversation
  myId: string
  onBack: () => void
  onOpenProfile: (userId: string) => void
}) {
  const [messages, setMessages] = useState<DmMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otherBlocked, setOtherBlocked] = useState(false)
  const [replyTo, setReplyTo] = useState<DmMessage | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const skipScroll = useRef(false)

  const otherId =
    conversation.from_user_id === myId
      ? conversation.to_user_id
      : conversation.from_user_id

  const reactions = useMessageReactions({ scope: 'dm', scopeId: conversation.id, myId })

  useEffect(() => {
    let alive = true
    setLoading(true)
    setMessages([])
    Promise.all([getDmMessages(conversation.id), isBlocked(otherId)])
      .then(([msgs, blocked]) => {
        if (!alive) return
        setMessages(msgs)
        setHasMore(msgs.length === 50)
        setOtherBlocked(blocked)
        setLoading(false)
      })
      .catch(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [conversation.id, otherId])

  useEffect(() => {
    const ch = supabase
      .channel(`dm:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const r = payload.new as DmMessage
          setMessages((prev) =>
            prev.some((m) => m.id === r.id) ? prev : [...prev, r],
          )
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [conversation.id])

  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false
      return
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function loadOlder() {
    if (loadingOlder || messages.length === 0) return
    setLoadingOlder(true)
    try {
      const older = await getDmMessages(conversation.id, messages[0].created_at)
      skipScroll.current = true
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id))
        return [...older.filter((m) => !ids.has(m.id)), ...prev]
      })
      setHasMore(older.length === 50)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore.')
    } finally {
      setLoadingOlder(false)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body || otherBlocked) return
    setSending(true)
    setError(null)
    try {
      const msg = await sendDmMessage(conversation.id, myId, body, otherId, replyTo?.id ?? null)
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      )
      setText('')
      setReplyTo(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invio non riuscito.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="chat">
      <AppHeader
        backLabel="‹ Messaggi"
        onBack={onBack}
        title={
          <button
            type="button"
            className="link"
            style={{ margin: 0, fontSize: '1.1rem', textDecoration: 'none' }}
            onClick={() => onOpenProfile(otherId)}
          >
            @{conversation.other_nickname}
          </button>
        }
      />

      <section className="messages">
        {loading && <p className="muted">Carico i messaggi…</p>}
        {!loading && hasMore && (
          <button
            type="button"
            className="link load-older"
            onClick={loadOlder}
            disabled={loadingOlder}
          >
            {loadingOlder ? 'Carico…' : 'Carica precedenti'}
          </button>
        )}
        {!loading && messages.length === 0 && (
          <p className="muted">Nessun messaggio. Scrivi il primo.</p>
        )}
        {messages.map((m) => {
          const nicknameOf = (senderId: string) => (senderId === myId ? 'tu' : conversation.other_nickname)
          const quoted = m.reply_to_id != null ? messages.find((q) => q.id === m.reply_to_id) : null
          return (
            <div key={m.id} className={m.sender_id === myId ? 'msg-row msg-row-mine' : 'msg-row'}>
              <div className="msg-col">
                <div className={m.sender_id === myId ? 'msg msg-mine' : 'msg'}>
                  {m.reply_to_id != null && (
                    quoted ? (
                      <QuotePreview nickname={nicknameOf(quoted.sender_id)} body={quoted.body} />
                    ) : (
                      <span className="msg-quote msg-quote-missing">Messaggio originale non disponibile</span>
                    )
                  )}
                  <span className="msg-body">{m.body}</span>
                </div>
                <MessageReactions
                  reactions={reactions.forMessage(m.id)}
                  myId={myId}
                  onToggle={(emoji) => reactions.toggle(m.id, emoji)}
                />
                <span className="msg-footer">
                  <span className="msg-time">{formatTime(m.created_at)}</span>
                  <button
                    type="button"
                    className="msg-reply"
                    title="Rispondi citando"
                    aria-label="Rispondi citando"
                    onClick={() => setReplyTo(m)}
                  >
                    ↩
                  </button>
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </section>

      {error && <p className="err chat-error">{error}</p>}

      <MessageComposer
        value={text}
        onChange={setText}
        onSubmit={handleSend}
        sending={sending}
        disabledMessage={otherBlocked ? 'Hai bloccato questa utente. Non puoi inviare messaggi.' : undefined}
        replyTo={
          replyTo
            ? { nickname: replyTo.sender_id === myId ? 'tu' : conversation.other_nickname, body: replyTo.body }
            : null
        }
        onCancelReply={() => setReplyTo(null)}
      />
    </main>
  )
}

// ─── Lista conversazioni ──────────────────────────────────────────────────────

function ListView({
  myId,
  onBack,
  onOpen,
}: {
  myId: string
  onBack: () => void
  onOpen: (conv: DmConversation) => void
}) {
  const [convs, setConvs] = useState<DmConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const list = await listDmConversations(myId)
        if (alive) {
          setConvs(list)
          setError(null)
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Errore.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    // Aggiorna la lista quando arriva una nuova richiesta o cambia lo stato di una conversazione
    const ch = supabase
      .channel('dm_list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_conversations',
          filter: `to_user_id=eq.${myId}`,
        },
        () => { if (alive) load() },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'dm_conversations' },
        () => { if (alive) load() },
      )
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(ch)
    }
  }, [myId])

  async function accept(id: string) {
    setBusy(id)
    setError(null)
    try {
      await acceptDmRequest(id)
      const list = await listDmConversations(myId)
      setConvs(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore.')
    } finally {
      setBusy(null)
    }
  }

  async function reject(id: string) {
    setBusy(id)
    setError(null)
    try {
      await rejectDmRequest(id)
      setConvs((prev) => prev.filter((c) => c.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore.')
    } finally {
      setBusy(null)
    }
  }

  const incoming = convs.filter((c) => c.to_user_id === myId && c.status === 'pending')
  const accepted = convs.filter((c) => c.status === 'accepted')
  const outgoing = convs.filter((c) => c.from_user_id === myId && c.status === 'pending')

  return (
    <main className="app rooms">
      <AppHeader backLabel="‹ Stanze" onBack={onBack} title="Messaggi" />

      {error && <p className="err">{error}</p>}

      {loading ? (
        <p className="muted">Carico…</p>
      ) : (
        <>
          {incoming.length > 0 && (
            <section className="dm-section">
              <p className="dm-section-title">Richieste ({incoming.length})</p>
              {incoming.map((c) => (
                <div key={c.id} className="dm-conv">
                  <span className="dm-conv-name">@{c.other_nickname}</span>
                  <span className="dm-conv-meta hint">{formatDate(c.created_at)}</span>
                  <div className="dm-request-actions">
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => accept(c.id)}
                      disabled={busy === c.id}
                    >
                      {busy === c.id ? 'Attendi…' : 'Accetta'}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => reject(c.id)}
                      disabled={busy === c.id}
                    >
                      Rifiuta
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {accepted.length > 0 && (
            <section className="dm-section">
              {incoming.length > 0 && (
                <p className="dm-section-title">Conversazioni</p>
              )}
              {accepted.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="dm-conv"
                  onClick={() => onOpen(c)}
                >
                  <span className="dm-conv-name">@{c.other_nickname}</span>
                  <span className="dm-conv-meta hint">
                    {formatDate(c.updated_at)}
                  </span>
                </button>
              ))}
            </section>
          )}

          {outgoing.length > 0 && (
            <section className="dm-section">
              <p className="dm-section-title">In attesa di risposta</p>
              {outgoing.map((c) => (
                <div key={c.id} className="dm-conv">
                  <span className="dm-conv-name">@{c.other_nickname}</span>
                  <span className="dm-conv-meta hint">
                    In attesa · {formatDate(c.created_at)}
                  </span>
                </div>
              ))}
            </section>
          )}

          {convs.length === 0 && (
            <p className="hint" style={{ marginTop: '2rem', textAlign: 'center' }}>
              Nessun messaggio ancora. Visita il profilo di un'utente per iniziare.
            </p>
          )}
        </>
      )}
    </main>
  )
}

// ─── Screen principale ────────────────────────────────────────────────────────

export function DmScreen({
  onBack,
  onOpenProfile,
}: {
  onBack: () => void
  onOpenProfile: (userId: string) => void
}) {
  const { session } = useAuth()
  const myId = session!.user.id
  const [activeConv, setActiveConv] = useState<DmConversation | null>(null)

  if (activeConv) {
    return (
      <ConversationView
        conversation={activeConv}
        myId={myId}
        onBack={() => setActiveConv(null)}
        onOpenProfile={onOpenProfile}
      />
    )
  }

  return <ListView myId={myId} onBack={onBack} onOpen={setActiveConv} />
}
