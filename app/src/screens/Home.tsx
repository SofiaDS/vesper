import { useState } from 'react'
import type { Chatroom } from '../lib/types'
import { RoomsScreen } from './RoomsScreen'
import { ChatScreen } from './ChatScreen'
import { ProfileScreen } from './ProfileScreen'

// Shell post-login: gestisce la navigazione fra la lobby (elenco stanze), la
// chat di una singola stanza e il proprio profilo. Nessun router esterno:
// basta uno stato locale.
export function Home() {
  const [room, setRoom] = useState<Chatroom | null>(null)
  const [showProfile, setShowProfile] = useState(false)

  if (showProfile) {
    return <ProfileScreen onBack={() => setShowProfile(false)} />
  }
  if (room) {
    return <ChatScreen room={room} onBack={() => setRoom(null)} />
  }
  return (
    <RoomsScreen onOpen={setRoom} onOpenProfile={() => setShowProfile(true)} />
  )
}
