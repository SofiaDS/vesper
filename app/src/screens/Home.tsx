import { useState } from 'react'
import type { Chatroom } from '../lib/types'
import { RoomsScreen } from './RoomsScreen'
import { ChatScreen } from './ChatScreen'

// Shell post-login: gestisce la navigazione fra la lobby (elenco stanze) e la
// chat di una singola stanza. Nessun router esterno: basta uno stato locale.
export function Home() {
  const [room, setRoom] = useState<Chatroom | null>(null)

  if (room) {
    return <ChatScreen room={room} onBack={() => setRoom(null)} />
  }
  return <RoomsScreen onOpen={setRoom} />
}
