import { useAuth } from '../auth/AuthProvider'
import { useRooms } from '../hooks/useRooms'
import { MAX_TEMATICHE } from '../constants/limits'
import type { Chatroom } from '../types'

export function RoomsScreen({
  onOpen,
  onOpenProfile,
  onOpenAdmin,
  onOpenSearch,
}: {
  onOpen: (room: Chatroom) => void
  onOpenProfile: () => void
  onOpenAdmin: () => void
  onOpenSearch: () => void
}) {
  const { session, profile, signOut, isStaff } = useAuth()
  const myId = session?.user.id

  const {
    rooms,
    joined,
    loading,
    error,
    busyRoom,
    tematicheJoined,
    capReached,
    handleJoin,
    handleLeave,
  } = useRooms(myId)

  return (
    <main className="app rooms">
      <header className="rooms-header">
        <div>
          <h1 className="rooms-brand">Vesper</h1>
          <p className="muted small-inline">Ciao {profile?.nickname}</p>
        </div>
        <div className="rooms-actions">
          {isStaff && (
            <button type="button" className="link" onClick={onOpenAdmin}>
              Moderazione
            </button>
          )}
          <button type="button" className="link" onClick={onOpenSearch}>
            Esplora
          </button>
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
