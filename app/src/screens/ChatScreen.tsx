import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useChatCache } from '../hooks/useChatCache'
import { useChatMembers } from '../hooks/useChatMembers'
import { useChatMessages } from '../hooks/useChatMessages'
import { useChatRealtime } from '../hooks/useChatRealtime'
import { AppHeader } from '../components/AppHeader'
import { ReportDialog } from '../components/ReportDialog'
import { RoomRoster } from '../components/RoomRoster'
import { MessageComposer } from '../components/MessageComposer'
import { MentionText } from '../components/MentionText'
import { MessageReactions } from '../components/MessageReactions'
import { QuotePreview } from '../components/QuotePreview'
import { useMessageReactions } from '../hooks/useMessageReactions'
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
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const myId = session?.user.id

  const members = useChatMembers(room.id, room.kind)
  const reactions = useMessageReactions({ scope: 'room', scopeId: room.id, myId })

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
        .insert({ chatroom_id: room.id, sender_id: myId, body, reply_to_id: replyTo?.id ?? null })
        .select('id, body, created_at, sender_id, reply_to_id')
        .single()
      if (sendErr) throw sendErr
      if (data) {
        appendMessage({
          id: data.id,
          body: data.body,
          created_at: data.created_at,
          sender_id: data.sender_id,
          nickname: profile?.nickname ?? 'tu',
          reply_to_id: data.reply_to_id,
        })
      }
      setText('')
      setReplyTo(null)
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
      <AppHeader
        backLabel="‹ Stanze"
        onBack={onBack}
        title={room.name}
        extra={
          <RoomRoster
            room={room}
            myId={myId}
            myNickname={profile?.nickname}
            showOnline={profile?.show_online ?? true}
          />
        }
      />

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
            className={m.sender_id === myId ? 'msg-row msg-row-mine' : 'msg-row'}
          >
            {m.sender_id !== myId && (
              <button
                type="button"
                className="msg-avatar-btn"
                onClick={() => onOpenProfile(m.sender_id)}
                aria-label={`Apri profilo di ${m.nickname}`}
              >
                <span
                  className="msg-avatar"
                  style={{ background: avatarCache.current.get(m.sender_id)?.color ?? 'var(--accent)' }}
                >
                  {glyphFor(avatarCache.current.get(m.sender_id)?.preset ?? null, m.nickname)}
                </span>
              </button>
            )}
            <div className="msg-col">
              {m.sender_id !== myId && (
                <button
                  type="button"
                  className="msg-author"
                  onClick={() => onOpenProfile(m.sender_id)}
                >
                  {m.nickname}
                </button>
              )}
              <div className={m.sender_id === myId ? 'msg msg-mine' : 'msg'}>
                {m.reply_to_id != null && (() => {
                  const quoted = messages.find((q) => q.id === m.reply_to_id)
                  return quoted ? (
                    <QuotePreview nickname={quoted.nickname} body={quoted.body} />
                  ) : (
                    <span className="msg-quote msg-quote-missing">Messaggio originale non disponibile</span>
                  )
                })()}
                <span className="msg-body">
                  <MentionText body={m.body} members={members} onOpenProfile={onOpenProfile} />
                </span>
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
          </div>
        ))}
        <div ref={bottomRef} />
      </section>

      {error && <p className="err chat-error">{error}</p>}

      <MessageComposer
        value={text}
        onChange={setText}
        onSubmit={handleSend}
        sending={sending}
        replyTo={replyTo ? { nickname: replyTo.nickname, body: replyTo.body } : null}
        onCancelReply={() => setReplyTo(null)}
        members={members}
      />

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
