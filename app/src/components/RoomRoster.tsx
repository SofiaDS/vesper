import { useState } from 'react'
import { useChatPresence } from '../hooks/useChatPresence'
import { useChatMembers } from '../hooks/useChatMembers'
import type { Chatroom } from '../types'

export function RoomRoster({
  room,
  myId,
  myNickname,
  showOnline,
}: {
  room: Chatroom
  myId: string | undefined
  myNickname: string | undefined
  showOnline: boolean
}) {
  const [open, setOpen] = useState(false)
  const online = useChatPresence(room.id, myId, myNickname, showOnline)
  const members = useChatMembers(room.id)

  return (
    <div className="roster-wrap">
      <button
        type="button"
        className="link roster-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? 'Chiudi' : `${online.length} online`}
      </button>

      {open && (
        <aside className="roster" aria-label="Utenti in questa stanza">
          <section className="roster-section">
            <p className="roster-title">Online ({online.length})</p>
            {online.length === 0 ? (
              <p className="hint">Nessuna online ora.</p>
            ) : (
              online.map((u) => (
                <div key={u.userId} className="roster-user">@{u.nickname}</div>
              ))
            )}
          </section>

          {room.kind === 'tematica' && (
            <section className="roster-section">
              <p className="roster-title">Iscritte ({members.length})</p>
              {members.length === 0 ? (
                <p className="hint">Nessuna iscritta.</p>
              ) : (
                members.map((m) => (
                  <div key={m.id} className="roster-user">@{m.nickname}</div>
                ))
              )}
            </section>
          )}
        </aside>
      )}
    </div>
  )
}
