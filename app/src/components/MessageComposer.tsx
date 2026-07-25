import { useRef, useState } from 'react'
import { applyMention, matchMentionTrigger, type MentionTrigger, type RoomMember } from '../lib/chat'
import { QuotePreview } from './QuotePreview'

const MENTION_LIMIT = 6

// Composer di messaggi condiviso da chat di gruppo e DM: campo di testo +
// invio, anteprima "in risposta a" annullabile e — quando vengono forniti i
// membri della stanza — suggerimenti "@menzione" mentre si scrive.
export function MessageComposer({
  value,
  onChange,
  onSubmit,
  sending,
  disabledMessage,
  replyTo,
  onCancelReply,
  members,
  typingLabel,
  onTyping,
  onStopTyping,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  sending: boolean
  disabledMessage?: string
  replyTo?: { nickname: string; body: string } | null
  onCancelReply?: () => void
  members?: RoomMember[]
  // Frase "… sta scrivendo" già composta da useTypingIndicator, o null.
  typingLabel?: string | null
  onTyping?: () => void
  onStopTyping?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [trigger, setTrigger] = useState<MentionTrigger | null>(null)

  if (disabledMessage) {
    return (
      <div className="composer composer-blocked">
        <p className="muted" style={{ margin: 0, textAlign: 'center', fontSize: '0.85rem' }}>
          {disabledMessage}
        </p>
      </div>
    )
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target
    onChange(el.value)
    // Il campo svuotato non è più "sto scrivendo": ritira subito l'annuncio
    // invece di lasciarlo scadere da solo.
    if (el.value.trim()) onTyping?.()
    else onStopTyping?.()
    setTrigger(members ? matchMentionTrigger(el.value, el.selectionStart ?? el.value.length) : null)
  }

  function handleSubmit(e: React.FormEvent) {
    onStopTyping?.()
    onSubmit(e)
  }

  function pickMention(nickname: string) {
    if (!trigger || !inputRef.current) return
    const { text, caret } = applyMention(value, trigger, nickname)
    onChange(text)
    setTrigger(null)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(caret, caret)
    })
  }

  const suggestions = (() => {
    if (!trigger || !members) return []
    const q = trigger.query.toLowerCase()
    return members.filter((m) => m.nickname.toLowerCase().startsWith(q)).slice(0, MENTION_LIMIT)
  })()

  return (
    <div className="composer-wrap">
      {replyTo && (
        <div className="reply-bar">
          <span className="reply-bar-label">Rispondi a</span>
          <QuotePreview nickname={replyTo.nickname} body={replyTo.body} />
          <button type="button" className="reply-bar-cancel" onClick={onCancelReply} aria-label="Annulla risposta">
            ✕
          </button>
        </div>
      )}
      {/* Sempre nel DOM, anche vuota: riserva lo spazio così il composer non
          sobbalza quando qualcunə inizia a scrivere, e permette ad aria-live di
          annunciare il cambiamento (una regione aggiunta al DOM già piena non
          verrebbe letta). */}
      <p className="typing-indicator" aria-live="polite">
        {typingLabel ?? ''}
      </p>
      <form className="composer" onSubmit={handleSubmit}>
        <div className="autocomplete autocomplete-up">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onBlur={() => window.setTimeout(() => setTrigger(null), 150)}
            placeholder="Scrivi un messaggio…"
            maxLength={2000}
            aria-label="Messaggio"
            autoComplete="off"
          />
          {trigger && suggestions.length > 0 && (
            <ul className="ac-list">
              {suggestions.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="ac-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickMention(m.nickname)}
                  >
                    @{m.nickname}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="btn-primary" disabled={sending || !value.trim()}>
          Invia
        </button>
      </form>
    </div>
  )
}
