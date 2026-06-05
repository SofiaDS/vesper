import { useState } from 'react'
import type { Chatroom } from '../lib/types'
import { RoomsScreen } from './RoomsScreen'
import { ChatScreen } from './ChatScreen'
import { ProfileScreen } from './ProfileScreen'
import { AdminScreen } from './AdminScreen'

// Shell post-login: gestisce la navigazione fra la lobby (elenco stanze), la
// chat di una singola stanza, il proprio profilo e l'area di moderazione.
// Nessun router esterno: basta uno stato locale.
export function Home() {
  const [room, setRoom] = useState<Chatroom | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  if (showAdmin) {
    return <AdminScreen onBack={() => setShowAdmin(false)} />
  }
  if (showProfile) {
    return <ProfileScreen onBack={() => setShowProfile(false)} />
  }
  if (room) {
    return <ChatScreen room={room} onBack={() => setRoom(null)} />
  }
  return (
    <RoomsScreen
      onOpen={setRoom}
      onOpenProfile={() => setShowProfile(true)}
      onOpenAdmin={() => setShowAdmin(true)}
    />
  )
}
