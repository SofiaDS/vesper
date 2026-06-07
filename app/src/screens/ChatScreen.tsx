import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useChatCache } from '../hooks/useChatCache'
import { useChatMessages } from '../hooks/useChatMessages'
import { useChatRealtime } from '../hooks/useChatRealtime'
import { ReportDialog } from '../components/ReportDialog'
import { RoomRoster } from '../components/RoomRoster'
import { promoteLayer } from '../lib/layers'
import { glyphFor } from '../lib/profile/formatters'
import type { Chatroom } from '../types'
import type { ChatMessage } from '../hooks/useChatMessages'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatScreen({
  room,
  onBack,
  onOpenProfile,
}: {
  room: Chatroom
  onBack: () => void
  onOpenProfile: (userId: string) => void
}) {
  const { session, profile, refreshProfile } = useAuth()
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [reportMsg, setReportMsg] = useState<ChatMessage | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const myId = session?.user.id

  const { blockedIds, nicknameCache, avatarCache, loadBlockedIds, cacheNicknames, resolveNickname } =
    useChatCache()

  const {
    messages,
    loading,
    error,
    hasMore,
    loadingOlder,
    skipAutoScroll,
    appendMessage,
    loadOlder,
    setError,
  } = useChatMessages({
    roomId: room.id,
    blockedIds,
    nicknameCache,
    loadBlockedIds,
    cacheNicknames,
  })

  useChatRealtime({
    roomId: room.id,
    blockedIds,
    resolveNickname,
    onMessage: appendMessage,
  })

  useEffect(() => {
    if (skipAutoScroll.current) {
      skipAutoScroll.current = false
      return
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body || !myId) return

    setSending(true)
    setError(null)
    try {
      const { data, error: sendErr } = await supabase
        .from('messages')
        .insert({ chatroom_id: room.id, sender_id: myId, body })
        .select('id, body, created_at, sender_id')
        .single()
      if (sendErr) throw sendErr
      if (data) {
        appendMessage({
          id: data.id,
          body: data.body,
          created_at: data.created_at,
          sender_id: data.sender_id,
          nickname: profile?.nickname ?? 'tu',
        })
      }
      setText('')
      promoteLayer().then((newLayer) => {
        if (newLayer !== profile?.strato) refreshProfile()
      }).catch(() => { /* promozione fallita silenziosamente */ })
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
        <RoomRoster
          room={room}
          myId={myId}
          myNickname={profile?.nickname}
          showOnline={profile?.show_online ?? true}
        />
      </header>

      <section className="messages">
        {loading && <p className="muted">Carico i messaggi…</p>}
        {!loading && hasMore && (
          <button
            type="button"
            className="link load-older"
            onClick={() => messages.length > 0 && loadOlder(messages[0].created_at)}
            disabled={loadingOlder}
          >
            {loadingOlder ? 'Carico…' : 'Carica messaggi precedenti'}
          </button>
        )}
        {!loading && messages.length === 0 && (
          <p className="muted">Ancora nessun messaggio. Scrivi tu il primo. 👋</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.sender_id === myId ? 'msg msg-mine' : 'msg'}
          >
            {m.sender_id !== myId && (
              <button
                type="button"
                className="msg-author"
                onClick={() => onOpenProfile(m.sender_id)}
              >
                <span
                  className="msg-avatar"
                  style={{ background: avatarCache.current.get(m.sender_id)?.color ?? 'var(--accent)' }}
                >
                  {glyphFor(avatarCache.current.get(m.sender_id)?.preset ?? null, m.nickname)}
                </span>
                {m.nickname}
              </button>
            )}
            <span className="msg-body">{m.body}</span>
            <span className="msg-footer">
              <span className="msg-time">{formatTime(m.created_at)}</span>
              {m.sender_id !== myId && (
                <button
                  type="button"
                  className="msg-report"
                  title="Segnala messaggio"
                  aria-label="Segnala messaggio"
                  onClick={() => setReportMsg(m)}
                >
                  ⚑
                </button>
              )}
            </span>
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

      {reportMsg && (
        <ReportDialog
          targetType="message"
          targetUserId={reportMsg.sender_id}
          targetMessageId={reportMsg.id}
          targetLabel="messaggio"
          onClose={() => setReportMsg(null)}
        />
      )}
    </main>
  )
}
