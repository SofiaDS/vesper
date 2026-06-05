import { useState } from 'react'
import type { Chatroom } from '../lib/types'
import { RoomsScreen } from './RoomsScreen'
import { ChatScreen } from './ChatScreen'
import { ProfileScreen } from './ProfileScreen'
import { BlockedUsersScreen } from './BlockedUsersScreen'
import { PublicProfileScreen } from './PublicProfileScreen'
import { AdminScreen } from './AdminScreen'

// Shell post-login: gestisce la navigazione fra la lobby (elenco stanze), la
// chat di una singola stanza, il proprio profilo, il profilo di altri utenti
// e l'area di moderazione. Nessun router esterno: basta uno stato locale.
export function Home() {
  const [room, setRoom] = useState<Chatroom | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  // Id dell'utente di cui stiamo guardando il profilo pubblico (da chat).
  const [viewUserId, setViewUserId] = useState<string | null>(null)

  if (showAdmin) {
    return <AdminScreen onBack={() => setShowAdmin(false)} />
  }
  // Il profilo altrui si sovrappone alla chat: tornando indietro la stanza
  // resta selezionata e si rientra nella conversazione.
  if (viewUserId) {
    return (
      <PublicProfileScreen
        userId={viewUserId}
        onBack={() => setViewUserId(null)}
      />
    )
  }
  if (showBlocked) {
    return <BlockedUsersScreen onBack={() => setShowBlocked(false)} />
  }
  if (showProfile) {
    return (
      <ProfileScreen
        onBack={() => setShowProfile(false)}
        onOpenBlocked={() => setShowBlocked(true)}
      />
    )
  }
  if (room) {
    return (
      <ChatScreen
        room={room}
        onBack={() => setRoom(null)}
        onOpenProfile={setViewUserId}
      />
    )
  }
  return (
    <RoomsScreen
      onOpen={setRoom}
      onOpenProfile={() => setShowProfile(true)}
      onOpenAdmin={() => setShowAdmin(true)}
    />
  )
}
