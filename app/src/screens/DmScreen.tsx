import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { AppHeader } from '../components/AppHeader'
import { HeaderMenu } from '../components/HeaderMenu'
import { ReportDialog } from '../components/ReportDialog'
import { BlockConfirmDialog } from '../components/BlockConfirmDialog'
import { MessageComposer } from '../components/MessageComposer'
import { MessageReactions } from '../components/MessageReactions'
import { QuotePreview } from '../components/QuotePreview'
import { useMessageReactions } from '../hooks/useMessageReactions'
import { useTypingIndicator } from '../hooks/useTypingIndicator'
import { Avatar } from '../components/Avatar'
import {
  listDmConversations,
  acceptDmRequest,
  rejectDmRequest,
  getDmMessages,
  getDmMessagesAfter,
  sendDmMessage,
  deleteDmConversation,
  type DmConversation,
  type DmMessage,
} from '../lib/dm'
import { isBlocked, blockUser, unblockUser } from '../lib/blocks'
import { markRead } from '../lib/reads'
import { dayKey, dayLabel } from '../lib/dayLabel'
import { useDmUnread } from '../hooks/useUnreadCounts'
import { useOnlinePresence } from '../hooks/useOnlinePresence'
import { useAppResume } from '../hooks/useAppResume'

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
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false)
  const [blockBusy, setBlockBusy] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [replyTo, setReplyTo] = useState<DmMessage | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const skipScroll = useRef(false)
  // Messaggi leggibili dentro le callback senza rifare i listener a ogni render.
  const messagesRef = useRef<DmMessage[]>([])
  messagesRef.current = messages
  const catchingUp = useRef(false)

  const otherId =
    conversation.from_user_id === myId
      ? conversation.to_user_id
      : conversation.from_user_id

  const reactions = useMessageReactions({ scope: 'dm', scopeId: conversation.id, myId })
  const isOnline = useOnlinePresence([otherId]).has(otherId)

  // DM 1 a 1: l'indicatore dice chi sta scrivendo, perché la conversazione ha
  // una sola controparte e non rivela nulla che non si sappia già.
  //
  // broadcast sempre attivo, di proposito: a differenza delle stanze qui NON è
  // legato a show_online. Stai scrivendo a quella persona e fra un istante
  // riceverà il messaggio, quindi l'indicatore anticipa di due secondi una
  // presenza che sta comunque per dichiararsi. Lo stato "online" invece è un
  // segnale passivo e continuo, che espone le proprie abitudini nel tempo: è
  // quello che show_online protegge. Nelle stanze il vincolo resta perché lì
  // un indicatore anonimo tradirebbe la presenza di chi ha scelto di non
  // comparire nell'elenco (vedi ChatScreen).
  const { profile } = useAuth()
  const typing = useTypingIndicator({
    scope: 'dm',
    scopeId: conversation.id,
    myId,
    myNickname: profile?.nickname,
    broadcast: true,
  })

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

  // Ripesca i messaggi arrivati mentre l'app era in background: lì la WebView
  // è sospesa e il websocket realtime cade, così i messaggi di quel periodo non
  // arrivano mai (aprendo la chat dal tap sulla notifica il messaggio non
  // c'era finché non si usciva e rientrava).
  async function catchUp() {
    if (catchingUp.current) return
    const last = messagesRef.current[messagesRef.current.length - 1]
    catchingUp.current = true
    try {
      // Conversazione ancora vuota a schermo: non c'è un "dopo" da cui partire,
      // ricarichiamo la prima pagina.
      const missed = last
        ? await getDmMessagesAfter(conversation.id, last.created_at)
        : await getDmMessages(conversation.id)
      if (missed.length === 0) return
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id))
        const added = missed.filter((m) => !known.has(m.id))
        return added.length > 0 ? [...prev, ...added] : prev
      })
    } catch {
      // Rete ancora assente al risveglio: riproverà al prossimo resume.
    } finally {
      catchingUp.current = false
    }
  }

  useAppResume(() => { void catchUp() })

  useEffect(() => {
    let subscribedOnce = false
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
      .subscribe((status) => {
        // Il primo SUBSCRIBED è l'iscrizione iniziale; i successivi sono
        // riagganci dopo una caduta → lì può esserci un buco da recuperare.
        if (status !== 'SUBSCRIBED') return
        if (subscribedOnce) void catchUp()
        subscribedOnce = true
      })
    return () => {
      supabase.removeChannel(ch)
    }
    // catchUp legge lo stato via ref: non serve rifare il canale quando cambia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id])

  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false
      return
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Segna la conversazione come letta entrando e uscendo (Step 5).
  useEffect(() => {
    markRead('dm', conversation.id)
    return () => { markRead('dm', conversation.id) }
  }, [conversation.id])

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

  // Stessa semantica del profilo pubblico: sbloccare è immediato, bloccare
  // passa dalla conferma che offre anche di cancellare la conversazione.
  async function handleBlockClick() {
    if (!otherBlocked) {
      setBlockConfirmOpen(true)
      return
    }
    setBlockBusy(true)
    try {
      await unblockUser(otherId)
      setOtherBlocked(false)
    } catch {
      // silenzioso: si può riprovare
    } finally {
      setBlockBusy(false)
    }
  }

  async function confirmBlock(deleteConversation: boolean) {
    setBlockBusy(true)
    try {
      await blockUser(otherId)
      setOtherBlocked(true)
      setBlockConfirmOpen(false)
      // Cancellata la conversazione non c'è più niente da guardare qui:
      // torniamo all'elenco invece di lasciare a schermo messaggi fantasma.
      if (deleteConversation) {
        await deleteDmConversation(conversation.id)
        onBack()
      }
    } catch {
      setBlockConfirmOpen(false)
    } finally {
      setBlockBusy(false)
    }
  }

  return (
    <main className="chat chat-focus">
      <AppHeader
        backLabel="‹ Messaggi"
        onBack={onBack}
        title={
          <span className="dm-title">
            <button
              type="button"
              className="link"
              style={{ margin: 0, fontSize: '1.1rem', textDecoration: 'none' }}
              onClick={() => onOpenProfile(otherId)}
            >
              @{conversation.other_nickname}
            </button>
            {isOnline && (
              <span className="dm-title-online">
                <span className="presence-dot presence-dot-inline" aria-hidden="true" />
                online
              </span>
            )}
          </span>
        }
        action={
          <HeaderMenu
            label="Opzioni conversazione"
            /* La voce distruttiva sta in fondo e staccata: scorrendo la
               lista non la si tocca per sbaglio al posto di «Segnala». */
            items={[
              {
                key: 'report',
                label: `Segnala @${conversation.other_nickname}`,
                onClick: () => setReporting(true),
              },
              {
                key: 'block',
                label: otherBlocked
                  ? `Sblocca @${conversation.other_nickname}`
                  : `Blocca @${conversation.other_nickname}`,
                danger: !otherBlocked,
                onClick: handleBlockClick,
              },
            ]}
          />
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
        {messages.map((m, i) => {
          const nicknameOf = (senderId: string) => (senderId === myId ? 'tu' : conversation.other_nickname)
          const quoted = m.reply_to_id != null ? messages.find((q) => q.id === m.reply_to_id) : null
          const showDivider = i === 0 || dayKey(messages[i - 1].created_at) !== dayKey(m.created_at)
          return (
            <div key={m.id} className="msg-group">
            {showDivider && (
              <div className="day-divider" role="separator">
                <span>{dayLabel(m.created_at)}</span>
              </div>
            )}
            <div className={m.sender_id === myId ? 'msg-row msg-row-mine' : 'msg-row'}>
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
                <div className="msg-meta">
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
            </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </section>

      {error && <p className="err chat-error" role="alert">{error}</p>}

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
        typingLabel={typing.label}
        onTyping={typing.notifyTyping}
        onStopTyping={typing.stopTyping}
      />

      {blockConfirmOpen && (
        <BlockConfirmDialog
          nickname={conversation.other_nickname}
          busy={blockBusy}
          onCancel={() => setBlockConfirmOpen(false)}
          onConfirm={confirmBlock}
        />
      )}

      {reporting && (
        <ReportDialog
          targetType="user"
          targetUserId={otherId}
          targetLabel={`@${conversation.other_nickname}`}
          onClose={() => setReporting(false)}
        />
      )}
    </main>
  )
}

// ─── Lista conversazioni ──────────────────────────────────────────────────────

function ListView({
  myId,
  onBack,
  onOpen,
  openConversationId,
  onConversationOpened,
}: {
  myId: string
  onBack: () => void
  onOpen: (conv: DmConversation) => void
  /** Conversazione da aprire appena la lista è carica (deep-link notifica). */
  openConversationId?: string | null
  onConversationOpened?: () => void
}) {
  const [convs, setConvs] = useState<DmConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const unread = useDmUnread(myId)
  // L'apertura automatica da notifica vale una volta sola: dopo, l'utente è
  // libero di tornare all'elenco senza che la conversazione si riapra da sé.
  const autoOpened = useRef(false)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const list = await listDmConversations(myId)
        if (alive) {
          setConvs(list)
          setError(null)
          // Deep-link "/?dm=1&c=<id>": la notifica indica la conversazione, non
          // solo la sezione. Senza questo si finiva sempre sull'elenco.
          if (openConversationId && !autoOpened.current) {
            const target = list.find((c) => c.id === openConversationId)
            if (target && target.status === 'accepted') {
              autoOpened.current = true
              onConversationOpened?.()
              onOpen(target)
            }
          }
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
    // onOpen/onConversationOpened stabili nella pratica: ricaricare la lista a
    // ogni render del genitore sarebbe peggio del rischio di una closure vecchia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, openConversationId])

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

  const otherIdOf = (c: DmConversation) => (c.from_user_id === myId ? c.to_user_id : c.from_user_id)
  const onlineIds = useOnlinePresence(accepted.map(otherIdOf))

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
                  <div className="dm-row">
                    <span className="avatar-bubble avatar-bubble-sm dm-avatar">
                      <Avatar preset={c.other_avatar} nickname={c.other_nickname} />
                    </span>
                    <div className="dm-info">
                      <div className="dm-info-top">
                        <span className="dm-conv-name">@{c.other_nickname}</span>
                        <span className="dm-conv-meta hint">{formatDate(c.created_at)}</span>
                      </div>
                      <div className="dm-info-bottom">
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
                    </div>
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
              {accepted.map((c) => {
                const n = unread.get(c.id) ?? 0
                const isOnline = onlineIds.has(otherIdOf(c))
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={n > 0 ? 'dm-conv has-unread' : 'dm-conv'}
                    onClick={() => onOpen(c)}
                  >
                    <div className="dm-row">
                      <span className="avatar-bubble avatar-bubble-sm dm-avatar">
                        <Avatar preset={c.other_avatar} nickname={c.other_nickname} />
                        {isOnline && (
                          <>
                            <span className="presence-dot" aria-hidden="true" />
                            <span className="visually-hidden">online</span>
                          </>
                        )}
                      </span>
                      <div className="dm-info">
                        <div className="dm-info-top">
                          <span className={n > 0 ? 'dm-conv-name unread' : 'dm-conv-name'}>
                            {n > 0 && <span className="dm-unread-dot" aria-hidden="true">● </span>}
                            @{c.other_nickname}
                          </span>
                          <span className="dm-conv-meta hint">
                            {formatDate(c.updated_at)}
                          </span>
                        </div>
                      </div>
                      {n > 0 && (
                        <>
                          <span className="unread-pill" aria-hidden="true">{n}</span>
                          <span className="visually-hidden">{n} messaggi non letti</span>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </section>
          )}

          {outgoing.length > 0 && (
            <section className="dm-section">
              <p className="dm-section-title">In attesa di risposta</p>
              {outgoing.map((c) => (
                <div key={c.id} className="dm-conv">
                  <div className="dm-row">
                    <span className="avatar-bubble avatar-bubble-sm dm-avatar">
                      <Avatar preset={c.other_avatar} nickname={c.other_nickname} />
                    </span>
                    <div className="dm-info">
                      <div className="dm-info-top">
                        <span className="dm-conv-name">@{c.other_nickname}</span>
                        <span className="dm-conv-meta hint">
                          In attesa · {formatDate(c.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
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
  openConversationId,
  onConversationOpened,
  onConversationOpenChange,
}: {
  onBack: () => void
  onOpenProfile: (userId: string) => void
  /** Conversazione indicata dal deep-link di una notifica push, se c'è. */
  openConversationId?: string | null
  onConversationOpened?: () => void
  /**
   * Segnala a Home se siamo dentro una conversazione (true) o sull'elenco
   * "Messaggi" (false): serve a nascondere la tab bar solo nel primo caso.
   * Deve essere una funzione stabile (un setter di stato).
   */
  onConversationOpenChange?: (open: boolean) => void
}) {
  const { session } = useAuth()
  const myId = session!.user.id
  const [activeConv, setActiveConv] = useState<DmConversation | null>(null)

  useEffect(() => {
    onConversationOpenChange?.(activeConv != null)
    // Uscendo dai DM la tab bar deve tornare anche se si esce dalla
    // conversazione senza passare dall'elenco (es. tap su un toast).
    return () => onConversationOpenChange?.(false)
  }, [activeConv, onConversationOpenChange])

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

  return (
    <ListView
      myId={myId}
      onBack={onBack}
      onOpen={setActiveConv}
      openConversationId={openConversationId}
      onConversationOpened={onConversationOpened}
    />
  )
}
