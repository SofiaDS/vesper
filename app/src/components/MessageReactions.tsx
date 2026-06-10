import { useState } from 'react'
import { REACTION_EMOJIS } from '../constants/limits'
import type { MessageReaction } from '../lib/reactions'

// Barra delle reazioni emoji sotto un messaggio: badge raggruppati per
// emoji (con conteggio, evidenziando le proprie) + selettore per
// aggiungerne una nuova. Riusato da ChatScreen e DmScreen.
export function MessageReactions({
  reactions,
  myId,
  onToggle,
}: {
  reactions: MessageReaction[]
  myId: string | undefined
  onToggle: (emoji: string) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const groups: { emoji: string; count: number; mine: boolean }[] = []
  for (const r of reactions) {
    let g = groups.find((x) => x.emoji === r.emoji)
    if (!g) { g = { emoji: r.emoji, count: 0, mine: false }; groups.push(g) }
    g.count += 1
    if (r.user_id === myId) g.mine = true
  }

  function pick(emoji: string) {
    setPickerOpen(false)
    onToggle(emoji)
  }

  return (
    <div className="msg-reactions">
      {groups.map((g) => (
        <button
          key={g.emoji}
          type="button"
          className={g.mine ? 'msg-reaction msg-reaction-mine' : 'msg-reaction'}
          onClick={() => onToggle(g.emoji)}
          title={g.mine ? 'Rimuovi la tua reazione' : 'Reagisci con questa emoji'}
        >
          <span>{g.emoji}</span>
          <span className="msg-reaction-count">{g.count}</span>
        </button>
      ))}
      <div className="msg-reaction-picker-wrap">
        <button
          type="button"
          className="msg-reaction-add"
          title="Aggiungi una reazione"
          aria-label="Aggiungi una reazione"
          onClick={() => setPickerOpen((v) => !v)}
          onBlur={() => window.setTimeout(() => setPickerOpen(false), 150)}
        >
          +
        </button>
        {pickerOpen && (
          <ul className="reaction-picker">
            {REACTION_EMOJIS.map((emoji) => (
              <li key={emoji}>
                <button
                  type="button"
                  className="reaction-picker-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(emoji)}
                >
                  {emoji}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
