import { useState } from 'react'
import type { Chatroom } from '../types'
import { RoomsScreen } from './RoomsScreen'
import { ChatScreen } from './ChatScreen'
import { ProfileScreen } from './profile/ProfileScreen'
import { BlockedUsersScreen } from './BlockedUsersScreen'
import { PublicProfileScreen } from './PublicProfileScreen'
import { SearchScreen } from './SearchScreen'
import { AdminScreen } from './admin/AdminScreen'

// Shell post-login: gestisce la navigazione fra lobby, chat, profilo e moderazione.
// Nessun router esterno: basta uno stato locale.
export function Home() {
  const [room, setRoom] = useState<Chatroom | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [viewUserId, setViewUserId] = useState<string | null>(null)

  if (showAdmin) {
    return <AdminScreen onBack={() => setShowAdmin(false)} />
  }
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
  if (showSearch) {
    return (
      <SearchScreen
        onBack={() => setShowSearch(false)}
        onOpenProfile={setViewUserId}
      />
    )
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
      onOpenSearch={() => setShowSearch(true)}
    />
  )
}
