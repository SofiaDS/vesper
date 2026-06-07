import { useState } from 'react'
import type { Chatroom } from '../types'
import { useAuth } from '../auth/AuthProvider'
import { usePendingDmCount } from '../hooks/usePendingDmCount'
import { useAdminPendingCounts } from '../hooks/useAdminPendingCounts'
import { BurgerMenu, type BurgerMenuItem } from '../components/BurgerMenu'
import { RoomsScreen } from './RoomsScreen'
import { ChatScreen } from './ChatScreen'
import { ProfileScreen } from './profile/ProfileScreen'
import { BlockedUsersScreen } from './BlockedUsersScreen'
import { PublicProfileScreen } from './PublicProfileScreen'
import { SearchScreen } from './SearchScreen'
import { SettingsScreen } from './SettingsScreen'
import { AdminScreen, ADMIN_TAB_LABELS, type AdminTab } from './admin/AdminScreen'
import { DmScreen } from './DmScreen'

const PAYPAL_URL = 'https://paypal.me/vesperapp'

// Shell post-login: gestisce la navigazione fra lobby, chat, profilo e moderazione.
// Nessun router esterno: basta uno stato locale, raccolto nel burger menu fisso.
export function Home() {
  const { session, profile, signOut, isStaff, isAdmin } = useAuth()
  const myId = session?.user.id
  const pendingDmCount = usePendingDmCount((profile?.strato ?? 0) >= 2 ? myId : undefined)
  const adminCounts = useAdminPendingCounts(isStaff)

  const [room, setRoom] = useState<Chatroom | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminTab, setAdminTab] = useState<AdminTab>('stats')
  const [showBlocked, setShowBlocked] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showDm, setShowDm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [viewUserId, setViewUserId] = useState<string | null>(null)

  function openAdmin(tab: AdminTab) {
    setAdminTab(tab)
    setShowAdmin(true)
  }

  function goToRooms() {
    setRoom(null)
    setShowProfile(false)
    setShowAdmin(false)
    setShowBlocked(false)
    setShowSearch(false)
    setShowDm(false)
    setShowSettings(false)
    setViewUserId(null)
  }

  const onLobby =
    !room &&
    !showProfile &&
    !showAdmin &&
    !showBlocked &&
    !showSearch &&
    !showDm &&
    !showSettings &&
    !viewUserId

  const menuItems: BurgerMenuItem[] = [
    { label: 'Stanze', onClick: goToRooms, active: onLobby },
    { label: 'Esplora', onClick: () => setShowSearch(true), active: showSearch },
    ...((profile?.strato ?? 0) >= 2
      ? [{ label: 'Messaggi', onClick: () => setShowDm(true), active: showDm, badge: pendingDmCount }]
      : []),
    { label: 'Profilo', onClick: () => setShowProfile(true), active: showProfile },
    ...(isStaff
      ? [{
          label: 'Moderazione',
          active: showAdmin,
          children: [
            { label: ADMIN_TAB_LABELS.stats, onClick: () => openAdmin('stats'), active: showAdmin && adminTab === 'stats' },
            { label: ADMIN_TAB_LABELS.verifiche, onClick: () => openAdmin('verifiche'), active: showAdmin && adminTab === 'verifiche', badge: adminCounts.verifiche },
            { label: ADMIN_TAB_LABELS.foto, onClick: () => openAdmin('foto'), active: showAdmin && adminTab === 'foto', badge: adminCounts.foto },
            { label: ADMIN_TAB_LABELS.segnalazioni, onClick: () => openAdmin('segnalazioni'), active: showAdmin && adminTab === 'segnalazioni', badge: adminCounts.segnalazioni },
            { label: ADMIN_TAB_LABELS.ai, onClick: () => openAdmin('ai'), active: showAdmin && adminTab === 'ai', badge: adminCounts.ai },
            { label: ADMIN_TAB_LABELS.reputazione, onClick: () => openAdmin('reputazione'), active: showAdmin && adminTab === 'reputazione' },
            ...(isAdmin
              ? [{ label: ADMIN_TAB_LABELS.moderatori, onClick: () => openAdmin('moderatori'), active: showAdmin && adminTab === 'moderatori' }]
              : []),
          ],
        }]
      : []),
    { label: 'Impostazioni', onClick: () => setShowSettings(true), active: showSettings },
    { label: 'Sostieni Vesper ↗', onClick: () => window.open(PAYPAL_URL, '_blank', 'noopener,noreferrer') },
  ]

  let screen: React.ReactNode
  if (showAdmin) {
    screen = <AdminScreen tab={adminTab} onBack={() => setShowAdmin(false)} />
  } else if (showSettings) {
    screen = <SettingsScreen onBack={() => setShowSettings(false)} />
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
    <BurgerMenu items={menuItems} onSignOut={signOut}>
      {screen}
    </BurgerMenu>
  )
}
