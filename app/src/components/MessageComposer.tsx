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
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  sending: boolean
  disabledMessage?: string
  replyTo?: { nickname: string; body: string } | null
  onCancelReply?: () => void
  members?: RoomMember[]
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
    setTrigger(members ? matchMentionTrigger(el.value, el.selectionStart ?? el.value.length) : null)
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
      <form className="composer" onSubmit={onSubmit}>
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
