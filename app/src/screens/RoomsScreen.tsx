import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { MAX_TEMATICHE, type Chatroom } from '../lib/types'

export function RoomsScreen({
  onOpen,
  onOpenProfile,
}: {
  onOpen: (room: Chatroom) => void
  onOpenProfile: () => void
}) {
  const { session, profile, signOut } = useAuth()
  const [rooms, setRooms] = useState<Chatroom[]>([])
  // Insieme degli id delle stanze a cui l'utente e' gia' iscritto.
  const [joined, setJoined] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Id della stanza per cui e' in corso un'operazione (join o leave).
  const [busyRoom, setBusyRoom] = useState<string | null>(null)

  const myId = session?.user.id
  const active = useRef(true)

  async function load() {
    // Stanze attive (RLS filtra is_active) + membership dell'utente.
    const [{ data: roomRows, error: roomErr }, { data: memRows }] =
      await Promise.all([
        supabase
          .from('chatrooms')
          .select('id, slug, name, description, kind')
          .order('kind', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase.from('chat_membership').select('chatroom_id'),
      ])

    if (!active.current) return
    if (roomErr) {
      setError(roomErr.message)
      setLoading(false)
      return
    }
    // Foyer prima, poi le tematiche.
    const sorted = (roomRows ?? []).slice().sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'foyer' ? -1 : 1
      return a.name.localeCompare(b.name, 'it')
    })
    setRooms(sorted as Chatroom[])
    setJoined(new Set((memRows ?? []).map((m) => m.chatroom_id as string)))
    setLoading(false)
  }

  useEffect(() => {
    active.current = true
    load()
    return () => {
      active.current = false
    }
  }, [])

  const tematicheJoined = rooms.filter(
    (r) => r.kind === 'tematica' && joined.has(r.id),
  ).length
  const capReached = tematicheJoined >= MAX_TEMATICHE

  async function handleJoin(room: Chatroom) {
    if (!myId || busyRoom) return
    setBusyRoom(room.id)
    setError(null)
    try {
      const { error: insErr } = await supabase
        .from('chat_membership')
        .insert({ user_id: myId, chatroom_id: room.id })
      // 23505 = gia' iscritta (race): la trattiamo come successo.
      if (insErr && insErr.code !== '23505') throw insErr
      setJoined((prev) => new Set(prev).add(room.id))
    } catch (err) {
      // Il trigger DB blocca oltre le 3 tematiche.
      const msg = err instanceof Error ? err.message : ''
      setError(
        msg.includes('Limite di 3')
          ? 'Hai raggiunto il limite di 3 stanze tematiche.'
          : 'Iscrizione non riuscita. Riprova.',
      )
    } finally {
      setBusyRoom(null)
    }
  }

  async function handleLeave(room: Chatroom) {
    if (!myId || busyRoom) return
    setBusyRoom(room.id)
    setError(null)
    try {
      const { error: delErr } = await supabase
        .from('chat_membership')
        .delete()
        .eq('user_id', myId)
        .eq('chatroom_id', room.id)
      // Il trigger DB impedisce di lasciare il Foyer (qui non lo offriamo
      // comunque), per le tematiche e' sempre permesso.
      if (delErr) throw delErr
      setJoined((prev) => {
        const next = new Set(prev)
        next.delete(room.id)
        return next
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        msg.includes('Foyer')
          ? 'La Foyer non può essere abbandonata.'
          : 'Operazione non riuscita. Riprova.',
      )
    } finally {
      setBusyRoom(null)
    }
  }

  return (
    <main className="app rooms">
      <header className="rooms-header">
        <div>
          <h1 className="rooms-brand">Vesper</h1>
          <p className="muted small-inline">Ciao {profile?.nickname}</p>
        </div>
        <div className="rooms-actions">
          <button type="button" className="link" onClick={onOpenProfile}>
            Profilo
          </button>
          <button type="button" className="link" onClick={signOut}>
            Esci
          </button>
        </div>
      </header>

      {loading && <p className="muted">Carico le stanze…</p>}
      {error && <p className="err chat-error">{error}</p>}

      {!loading && (
        <ul className="room-list">
          {rooms.map((room) => {
            const isJoined = joined.has(room.id)
            const isFoyer = room.kind === 'foyer'
            // Foyer: sempre accessibile. Tematica: apribile se iscritta.
            const canOpen = isFoyer || isJoined
            const blockedByCap = !isJoined && !isFoyer && capReached
            const working = busyRoom === room.id
            return (
              <li key={room.id} className="room-card">
                <button
                  type="button"
                  className="room-main"
                  onClick={() => canOpen && onOpen(room)}
                  disabled={!canOpen}
                >
                  <span className="room-name">{room.name}</span>
                  {room.description && (
                    <span className="room-desc">{room.description}</span>
                  )}
                </button>
                <div className="room-action">
                  {canOpen ? (
                    <>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => onOpen(room)}
                      >
                        Apri
                      </button>
                      {/* La Foyer non si puo' lasciare: niente "Esci". */}
                      {isJoined && !isFoyer && (
                        <button
                          type="button"
                          className="btn-ghost btn-sm"
                          onClick={() => handleLeave(room)}
                          disabled={working}
                        >
                          {working ? 'Esco…' : 'Esci'}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => handleJoin(room)}
                      disabled={working || blockedByCap}
                      title={
                        blockedByCap
                          ? 'Hai raggiunto il limite di 3 stanze tematiche'
                          : undefined
                      }
                    >
                      {working ? 'Entro…' : 'Unisciti'}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {!loading && (
        <p className="hint rooms-hint">
          Stanze tematiche: {tematicheJoined}/{MAX_TEMATICHE}.
        </p>
      )}
    </main>
  )
}
