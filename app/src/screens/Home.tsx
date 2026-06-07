import { useState } from 'react'
import type { Chatroom } from '../types'
import { useAuth } from '../auth/AuthProvider'
import { usePendingDmCount } from '../hooks/usePendingDmCount'
import { BurgerMenu, type BurgerMenuItem } from '../components/BurgerMenu'
import { RoomsScreen } from './RoomsScreen'
import { ChatScreen } from './ChatScreen'
import { ProfileScreen } from './profile/ProfileScreen'
import { BlockedUsersScreen } from './BlockedUsersScreen'
import { PublicProfileScreen } from './PublicProfileScreen'
import { SearchScreen } from './SearchScreen'
import { AdminScreen } from './admin/AdminScreen'
import { DmScreen } from './DmScreen'

// Shell post-login: gestisce la navigazione fra lobby, chat, profilo e moderazione.
// Nessun router esterno: basta uno stato locale, raccolto nel burger menu fisso.
export function Home() {
  const { session, profile, signOut, isStaff } = useAuth()
  const myId = session?.user.id
  const pendingDmCount = usePendingDmCount((profile?.strato ?? 0) >= 2 ? myId : undefined)

  const [room, setRoom] = useState<Chatroom | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showDm, setShowDm] = useState(false)
  const [viewUserId, setViewUserId] = useState<string | null>(null)

  function goToRooms() {
    setRoom(null)
    setShowProfile(false)
    setShowAdmin(false)
    setShowBlocked(false)
    setShowSearch(false)
    setShowDm(false)
    setViewUserId(null)
  }

  const onLobby =
    !room && !showProfile && !showAdmin && !showBlocked && !showSearch && !showDm && !viewUserId

  const menuItems: BurgerMenuItem[] = [
    { label: 'Stanze', onClick: goToRooms, active: onLobby },
    { label: 'Esplora', onClick: () => setShowSearch(true), active: showSearch },
    ...((profile?.strato ?? 0) >= 2
      ? [{ label: 'Messaggi', onClick: () => setShowDm(true), active: showDm, badge: pendingDmCount }]
      : []),
    { label: 'Profilo', onClick: () => setShowProfile(true), active: showProfile },
    ...(isStaff
      ? [{ label: 'Moderazione', onClick: () => setShowAdmin(true), active: showAdmin }]
      : []),
  ]

  let screen: React.ReactNode
  if (showAdmin) {
    screen = <AdminScreen onBack={() => setShowAdmin(false)} />
  } else if (viewUserId) {
    screen = <PublicProfileScreen userId={viewUserId} onBack={() => setViewUserId(null)} />
  } else if (showBlocked) {
    screen = <BlockedUsersScreen onBack={() => setShowBlocked(false)} />
  } else if (showSearch) {
    screen = <SearchScreen onBack={() => setShowSearch(false)} onOpenProfile={setViewUserId} />
  } else if (showDm) {
    screen = <DmScreen onBack={() => setShowDm(false)} onOpenProfile={setViewUserId} />
  } else if (showProfile) {
    screen = (
      <ProfileScreen onBack={() => setShowProfile(false)} onOpenBlocked={() => setShowBlocked(true)} />
    )
  } else if (room) {
    screen = <ChatScreen room={room} onBack={() => setRoom(null)} onOpenProfile={setViewUserId} />
  } else {
    screen = <RoomsScreen onOpen={setRoom} />
  }

  return (
    <>
      <BurgerMenu items={menuItems} onSignOut={signOut} />
      {screen}
    </>
  )
}
