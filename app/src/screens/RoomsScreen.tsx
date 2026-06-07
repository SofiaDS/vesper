import { useAuth } from '../auth/AuthProvider'
import { useRooms } from '../hooks/useRooms'
import { useRoomOnlineCount } from '../hooks/useRoomOnlineCount'
import { MAX_TEMATICHE } from '../constants/limits'
import type { Chatroom } from '../types'

function RoomOnlineBadge({ roomId }: { roomId: string }) {
  const online = useRoomOnlineCount(roomId)
  return <span className="room-online">{online} online</span>
}

export function RoomsScreen({ onOpen }: { onOpen: (room: Chatroom) => void }) {
  const { session, profile } = useAuth()
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
                  <RoomOnlineBadge roomId={room.id} />
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
