import { useState } from 'react'
import type { Chatroom } from '../types'
import { useAuth } from '../auth/AuthProvider'
import { usePendingDmCount } from '../hooks/usePendingDmCount'
import { useAdminPendingCounts } from '../hooks/useAdminPendingCounts'
import { useBackNavigation } from '../hooks/useBackNavigation'
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
import { LegalScreen, LEGAL_DOC_LABELS, type LegalDoc } from './LegalScreen'
import { openSupportEmail } from '../lib/support'

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
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null)

  // Chiude ogni schermata aperta prima di aprirne (eventualmente) una nuova:
  // evita che una vecchia voce di stato (es. showSearch) resti "true" e prenda
  // la precedenza nella catena if/else qui sotto, lasciando la nuova schermata
  // nascosta "sotto" quella precedente finché non si torna indietro.
  function openScreen(open?: () => void) {
    setRoom(null)
    setShowProfile(false)
    setShowAdmin(false)
    setShowBlocked(false)
    setShowSearch(false)
    setShowDm(false)
    setShowSettings(false)
    setViewUserId(null)
    setLegalDoc(null)
    open?.()
  }

  function goToRooms() {
    openScreen()
  }

  function openAdmin(tab: AdminTab) {
    openScreen(() => {
      setAdminTab(tab)
      setShowAdmin(true)
    })
  }

  function openLegal(doc: LegalDoc) {
    openScreen(() => setLegalDoc(doc))
  }

  const onLobby =
    !room &&
    !showProfile &&
    !showAdmin &&
    !showBlocked &&
    !showSearch &&
    !showDm &&
    !showSettings &&
    !viewUserId &&
    !legalDoc

  // Etichetta della schermata corrente: usata solo per dare contesto a chi
  // legge le email di "Segnala un bug" / "Dacci un suggerimento" — stessa
  // catena di precedenza dello switch dello schermo qui sotto.
  const currentScreenLabel = showAdmin
    ? `Moderazione · ${ADMIN_TAB_LABELS[adminTab]}`
    : showSettings
    ? 'Impostazioni'
    : viewUserId
    ? 'Profilo pubblico'
    : showBlocked
    ? 'Utenti bloccati'
    : showSearch
    ? 'Ricerca'
    : showDm
    ? 'Messaggi'
    : showProfile
    ? 'Il mio profilo'
    : legalDoc
    ? LEGAL_DOC_LABELS[legalDoc]
    : room
    ? room.name
    : 'Stanze'

  const menuItems: BurgerMenuItem[] = [
    { label: 'Stanze', onClick: goToRooms, active: onLobby },
    { label: 'Ricerca', onClick: () => openScreen(() => setShowSearch(true)), active: showSearch },
    ...((profile?.strato ?? 0) >= 2
      ? [{ label: 'Messaggi', onClick: () => openScreen(() => setShowDm(true)), active: showDm, badge: pendingDmCount }]
      : []),
    { label: 'Il Mio Profilo', onClick: () => openScreen(() => setShowProfile(true)), active: showProfile },
    ...(isStaff
      ? [{
          label: 'Admin Tab',
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
    { label: 'Impostazioni', onClick: () => openScreen(() => setShowSettings(true)), active: showSettings },
    { label: LEGAL_DOC_LABELS.privacy, onClick: () => openLegal('privacy'), active: legalDoc === 'privacy' },
    { label: LEGAL_DOC_LABELS.terms, onClick: () => openLegal('terms'), active: legalDoc === 'terms' },
    { label: 'Segnala un bug', onClick: () => openSupportEmail({ type: 'bug', screen: currentScreenLabel, userId: myId }) },
    { label: 'Dacci un suggerimento', onClick: () => openSupportEmail({ type: 'feedback', screen: currentScreenLabel, userId: myId }) },
    { label: 'Sostieni Vesper ↗', onClick: () => window.open(PAYPAL_URL, '_blank', 'noopener,noreferrer') },
  ]

  // Quante "schermate" sono aperte una sull'altra in questo momento (es.
  // Ricerca → Profilo pubblico = 2): serve a sapere se il prossimo `goBack`
  // riporta alla lobby, per decidere se ri-armare la guardia sulla history
  // (vedi useBackNavigation).
  const stackDepth = [room, showProfile, showAdmin, showBlocked, showSearch, showDm, showSettings, viewUserId, legalDoc]
    .filter(Boolean).length

  let screen: React.ReactNode
  let goBack = goToRooms
  if (showAdmin) {
    goBack = () => setShowAdmin(false)
    screen = <AdminScreen tab={adminTab} onBack={goBack} />
  } else if (showSettings) {
    goBack = () => setShowSettings(false)
    screen = <SettingsScreen onBack={goBack} onOpenBlocked={() => setShowBlocked(true)} />
  } else if (legalDoc) {
    goBack = () => setLegalDoc(null)
    screen = <LegalScreen doc={legalDoc} onBack={goBack} />
  } else if (viewUserId) {
    goBack = () => setViewUserId(null)
    screen = <PublicProfileScreen userId={viewUserId} onBack={goBack} />
  } else if (showBlocked) {
    goBack = () => setShowBlocked(false)
    screen = <BlockedUsersScreen onBack={goBack} />
  } else if (showSearch) {
    goBack = () => setShowSearch(false)
    screen = <SearchScreen onBack={goBack} onOpenProfile={setViewUserId} />
  } else if (showDm) {
    goBack = () => setShowDm(false)
    screen = <DmScreen onBack={goBack} onOpenProfile={setViewUserId} />
  } else if (showProfile) {
    goBack = () => setShowProfile(false)
    screen = <ProfileScreen onBack={goBack} />
  } else if (room) {
    goBack = () => setRoom(null)
    screen = <ChatScreen room={room} onBack={goBack} onOpenProfile={setViewUserId} />
  } else {
    screen = <RoomsScreen onOpen={setRoom} />
  }

  useBackNavigation({ active: !onLobby, exitsOnBack: stackDepth <= 1, onBack: goBack })

  return (
    <BurgerMenu items={menuItems} onSignOut={signOut}>
      {screen}
    </BurgerMenu>
  )
}
