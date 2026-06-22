import { useState } from 'react'
import { House, ChatCircleDots, MagnifyingGlass, User, DotsThreeOutline } from '@phosphor-icons/react'
import type { Chatroom } from '../types'
import { useAuth } from '../auth/AuthProvider'
import { usePendingDmCount } from '../hooks/usePendingDmCount'
import { useAdminPendingCounts } from '../hooks/useAdminPendingCounts'
import { useBackNavigation } from '../hooks/useBackNavigation'
import { TabBar, type TabBarItem } from '../components/TabBar'
import { AltroScreen } from './AltroScreen'
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

// TODO(P30): sostituire con il link definitivo (Ko-fi / Liberapay / PayPal) quando disponibile.
const SUPPORT_URL = 'https://www.example.com'

// Shell post-login: gestisce la navigazione fra lobby, chat, profilo e moderazione.
// Nessun router esterno: basta uno stato locale, raccolto nel burger menu fisso.
export function Home() {
  const { session, profile, signOut, isStaff } = useAuth()
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
  const [showAltro, setShowAltro] = useState(false)
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
    setShowAltro(false)
    setViewUserId(null)
    setLegalDoc(null)
    open?.()
  }

  function goToRooms() {
    openScreen()
  }

  // Apertura da dentro Impostazioni: non resetta showSettings, così il tasto
  // "indietro" dalla schermata legale torna ad Impostazioni e non alla lobby.
  function openLegalFromSettings(doc: LegalDoc) {
    setLegalDoc(doc)
  }

  // Nessuna delle schermate "secondarie" (raggiunte solo dal burger menu /
  // tab "Altro") è aperta: la sezione "Stanze" (lista o chat) è quella attiva.
  const inStanze =
    !showProfile &&
    !showAdmin &&
    !showBlocked &&
    !showSearch &&
    !showDm &&
    !showSettings &&
    !showAltro &&
    !viewUserId &&
    !legalDoc

  const onLobby = inStanze && !room

  // Etichetta della schermata corrente: usata solo per dare contesto a chi
  // legge le email di "Segnala un bug" / "Dacci un suggerimento" — stessa
  // catena di precedenza dello switch dello schermo qui sotto.
  const currentScreenLabel = showAdmin
    ? `Moderazione · ${ADMIN_TAB_LABELS[adminTab]}`
    : legalDoc
    ? LEGAL_DOC_LABELS[legalDoc]
    : showBlocked
    ? 'Utenti bloccati'
    : showSettings
    ? 'Impostazioni'
    : showAltro
    ? 'Altro'
    : viewUserId
    ? 'Profilo pubblico'
    : showSearch
    ? 'Ricerca'
    : showDm
    ? 'Messaggi'
    : showProfile
    ? 'Il mio profilo'
    : room
    ? room.name
    : 'Stanze'

  const canDm = (profile?.strato ?? 0) >= 2
  const altroBadge = isStaff
    ? adminCounts.verifiche + adminCounts.foto + adminCounts.segnalazioni + adminCounts.ai
    : undefined
  const tabItems: TabBarItem[] = [
    { key: 'stanze', label: 'Stanze', icon: <House size={22} weight="duotone" />, onClick: goToRooms, active: inStanze },
    ...(canDm
      ? [{ key: 'dm', label: 'DM', icon: <ChatCircleDots size={22} weight="duotone" />, onClick: () => openScreen(() => setShowDm(true)), active: showDm, badge: pendingDmCount, badgeLabel: 'messaggi non letti' } as TabBarItem]
      : []),
    { key: 'ricerca', label: 'Ricerca', icon: <MagnifyingGlass size={22} weight="duotone" />, onClick: () => openScreen(() => setShowSearch(true)), active: showSearch },
    { key: 'profilo', label: 'Profilo', icon: <User size={22} weight="duotone" />, onClick: () => openScreen(() => setShowProfile(true)), active: showProfile },
    { key: 'altro', label: 'Altro', icon: <DotsThreeOutline size={22} weight="duotone" />, onClick: () => openScreen(() => setShowAltro(true)), active: showAltro, badge: altroBadge, mention: true, badgeLabel: 'elementi in attesa di moderazione' },
  ]

  // Quante "schermate" sono aperte una sull'altra in questo momento (es.
  // Ricerca → Profilo pubblico = 2): serve a sapere se il prossimo `goBack`
  // riporta alla lobby, per decidere se ri-armare la guardia sulla history
  // (vedi useBackNavigation).
  const stackDepth = [room, showProfile, showAdmin, showBlocked, showSearch, showDm, showSettings, showAltro, viewUserId, legalDoc]
    .filter(Boolean).length

  let screen: React.ReactNode
  let goBack = goToRooms
  if (showAdmin) {
    goBack = () => setShowAdmin(false)
    screen = <AdminScreen tab={adminTab} onBack={goBack} />
  } else if (legalDoc) {
    goBack = () => setLegalDoc(null)
    screen = <LegalScreen doc={legalDoc} onBack={goBack} backLabel={showSettings ? '‹ Impostazioni' : showAltro ? '‹ Altro' : '‹ Stanze'} />
  } else if (showBlocked) {
    goBack = () => setShowBlocked(false)
    screen = <BlockedUsersScreen onBack={goBack} backLabel={showSettings ? '‹ Impostazioni' : showAltro ? '‹ Altro' : '‹ Profilo'} />
  } else if (showSettings) {
    goBack = () => setShowSettings(false)
    screen = <SettingsScreen onBack={goBack} onOpenBlocked={() => setShowBlocked(true)} onOpenLegal={openLegalFromSettings} />
  } else if (viewUserId) {
    goBack = () => setViewUserId(null)
    screen = <PublicProfileScreen userId={viewUserId} onBack={goBack} />
  } else if (showSearch) {
    goBack = () => setShowSearch(false)
    screen = <SearchScreen onBack={goBack} onOpenProfile={setViewUserId} />
  } else if (showDm) {
    goBack = () => setShowDm(false)
    screen = <DmScreen onBack={goBack} onOpenProfile={setViewUserId} />
  } else if (showProfile) {
    goBack = () => setShowProfile(false)
    screen = <ProfileScreen onBack={goBack} />
  } else if (showAltro) {
    goBack = goToRooms
    screen = (
      <AltroScreen
        isStaff={isStaff}
        onBack={goToRooms}
        onOpenSettings={() => setShowSettings(true)}
        onOpenBlocked={() => setShowBlocked(true)}
        onOpenLegal={(doc) => setLegalDoc(doc)}
        onOpenAdmin={() => {
          setAdminTab('stats')
          setShowAdmin(true)
        }}
        onReportBug={() => openSupportEmail({ type: 'bug', screen: currentScreenLabel, userId: myId })}
        onSuggest={() => openSupportEmail({ type: 'feedback', screen: currentScreenLabel, userId: myId })}
        onSupportLink={() => window.open(SUPPORT_URL, '_blank', 'noopener,noreferrer')}
        onSignOut={signOut}
      />
    )
  } else if (room) {
    goBack = () => setRoom(null)
    screen = <ChatScreen room={room} onBack={goBack} onOpenProfile={setViewUserId} />
  } else {
    screen = <RoomsScreen onOpen={setRoom} />
  }

  useBackNavigation({ active: !onLobby, exitsOnBack: stackDepth <= 1, onBack: goBack })

  return (
    <>
      <TabBar items={tabItems} />
      {screen}
    </>
  )
}
