import { useEffect, useState } from 'react'
import { House, ChatCircleDots, MagnifyingGlass, User, DotsThreeOutline } from '@phosphor-icons/react'
import type { Chatroom } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useDeepLink } from '../hooks/useDeepLink'
import { usePendingDmCount } from '../hooks/usePendingDmCount'
import { usePendingVouchCount } from '../hooks/usePendingVouchCount'
import { useAdminPendingCounts } from '../hooks/useAdminPendingCounts'
import { useBackNavigation } from '../hooks/useBackNavigation'
import { useMessageNotifications } from '../hooks/useMessageNotifications'
import { useActiveViewReporter } from '../hooks/useActiveViewReporter'
import { useHeartbeat } from '../hooks/useHeartbeat'
import { TabBar, type TabBarItem } from '../components/TabBar'
import { GlobalToast } from '../components/GlobalToast'
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
import { SupportScreen } from './SupportScreen'
import { VouchRequestsScreen } from './VouchRequestsScreen'
import { openSupportEmail } from '../lib/support'

// Shell post-login: gestisce la navigazione fra lobby, chat, profilo e moderazione.
// Nessun router esterno: basta uno stato locale, guidato dalla TabBar fissa.
export function Home() {
  const { session, profile, signOut, isStaff } = useAuth()
  const myId = session?.user.id
  const pendingDmCount = usePendingDmCount((profile?.strato ?? 0) >= 2 ? myId : undefined)
  const adminCounts = useAdminPendingCounts(isStaff)
  // Garante si può essere solo dallo Strato 3 (permessi_e_strati.md §2), quindi
  // per tutte le altre non ha senso nemmeno interrogare il server.
  const canBeGuarantor = (profile?.strato ?? 0) >= 3
  const { count: vouchCount, refresh: refreshVouchCount } =
    usePendingVouchCount(canBeGuarantor ? myId : undefined)

  // Heartbeat di presenza online (per il pallino nei DM, Step 5).
  useHeartbeat(myId)

  // Deep-link al click di una notifica push (/dm, /room/<id>).
  const { intent: deepLink, consume: consumeDeepLink } = useDeepLink()

  const [room, setRoom] = useState<Chatroom | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminTab, setAdminTab] = useState<AdminTab>('stats')
  const [showBlocked, setShowBlocked] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showDm, setShowDm] = useState(false)
  // Conversazione DM da aprire subito, arrivata dal deep-link di una notifica
  // ("/?dm=1&c=<id>"). null = apri il solo elenco "Messaggi".
  const [dmConvId, setDmConvId] = useState<string | null>(null)
  // true mentre è aperta una conversazione DM (non l'elenco "Messaggi"):
  // lo riporta DmScreen, che è l'unico a saperlo.
  const [dmConversationOpen, setDmConversationOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAltro, setShowAltro] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [showVouch, setShowVouch] = useState(false)
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
    setDmConvId(null)
    setShowSettings(false)
    setShowAltro(false)
    setShowSupport(false)
    setShowVouch(false)
    setViewUserId(null)
    setLegalDoc(null)
    open?.()
  }

  function goToRooms() {
    openScreen()
  }

  // Toast globale per nuovi messaggi/menzioni mentre sei in un'altra schermata.
  // Sopprime i messaggi della stanza che stai leggendo e i DM mentre la sezione
  // "Messaggi" è aperta. Al click apre la conversazione relativa.
  const notif = useMessageNotifications({
    myId,
    myNickname: profile?.nickname,
    activeRoomId: room?.id ?? null,
    dmOpen: showDm,
  })

  // Stessa regola, applicata alle notifiche push di sistema: comunica al
  // service worker cosa c'è a schermo così può scartare quelle ridondanti.
  useActiveViewReporter(room?.id ?? null, showDm)

  function openFromToast() {
    const t = notif.toast
    if (!t) return
    notif.dismiss()
    if (t.kind === 'dm') openScreen(() => setShowDm(true))
    else if (t.room) openScreen(() => setRoom(t.room!))
  }

  // Apertura da dentro Impostazioni: non resetta showSettings, così il tasto
  // "indietro" dalla schermata legale torna ad Impostazioni e non alla lobby.
  function openLegalFromSettings(doc: LegalDoc) {
    setLegalDoc(doc)
  }

  // Nessuna delle schermate "secondarie" (raggiunte dalla tab "Altro" o da
  // link interni) è aperta: la sezione "Stanze" (lista o chat) è quella attiva.
  const inStanze =
    !showProfile &&
    !showAdmin &&
    !showBlocked &&
    !showSearch &&
    !showDm &&
    !showSettings &&
    !showAltro &&
    !showSupport &&
    !showVouch &&
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
    : showSupport
    ? 'Sostieni Vesper'
    : showVouch
    ? 'Richieste di garanzia'
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

  // Applica il deep-link della notifica: apre i DM o carica e apre la stanza
  // indicata. L'intento arriva sia da avvio a freddo sia da service worker
  // (app già aperta) — vedi useDeepLink. Consumato dopo la navigazione.
  useEffect(() => {
    if (!deepLink) return
    if (deepLink.type === 'dm') {
      if (canDm) {
        const convId = deepLink.conversationId ?? null
        openScreen(() => {
          setShowDm(true)
          setDmConvId(convId)
        })
      }
      consumeDeepLink()
      return
    }
    // Non filtriamo per Strato: chi ha ricevuto la notifica era garante quando è
    // partita. Se nel frattempo qualcosa è cambiato, la schermata mostra il suo
    // stato vuoto — meglio che ignorare il tocco sulla notifica.
    if (deepLink.type === 'vouch') {
      openScreen(() => setShowVouch(true))
      consumeDeepLink()
      return
    }
    const roomId = deepLink.id
    let alive = true
    let retry: ReturnType<typeof setTimeout> | undefined

    // Al tap su una notifica l'app spesso sta appena tornando dal background:
    // la rete può non essere ancora pronta e questa query fallire. Consumare
    // l'intento in quel caso lascerebbe l'utente sull'elenco stanze (bug
    // segnalato), quindi al primo errore riproviamo una volta.
    async function openRoom(attempt: number) {
      const { data, error } = await supabase
        .from('chatrooms')
        .select('id, slug, name, description, kind')
        .eq('id', roomId)
        .maybeSingle()
      if (!alive) return
      if (error && attempt === 0) {
        retry = setTimeout(() => { void openRoom(1) }, 1500)
        return
      }
      if (data) openScreen(() => setRoom(data as Chatroom))
      consumeDeepLink()
    }

    void openRoom(0)
    return () => {
      alive = false
      if (retry) clearTimeout(retry)
    }
    // openScreen/consumeDeepLink stabili nella pratica: dipendiamo dall'intento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink, canDm])

  const adminBadge = isStaff
    ? adminCounts.verifiche + adminCounts.foto + adminCounts.segnalazioni + adminCounts.ai
    : 0
  // Il badge della tab somma tutto ciò che dentro "Altro" aspetta una risposta:
  // moderazione (solo staff) e richieste di garanzia. `undefined` a zero, così
  // TabBar non disegna un pallino vuoto.
  const altroBadge = adminBadge + vouchCount || undefined
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
  const stackDepth = [room, showProfile, showAdmin, showBlocked, showSearch, showDm, showSettings, showAltro, showSupport, showVouch, viewUserId, legalDoc]
    .filter(Boolean).length

  let screen: React.ReactNode
  let goBack = goToRooms
  if (showAdmin) {
    goBack = () => setShowAdmin(false)
    screen = <AdminScreen tab={adminTab} counts={adminCounts} onTabChange={setAdminTab} onBack={goBack} />
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
    screen = (
      <DmScreen
        onBack={goBack}
        onOpenProfile={setViewUserId}
        openConversationId={dmConvId}
        onConversationOpened={() => setDmConvId(null)}
        onConversationOpenChange={setDmConversationOpen}
      />
    )
  } else if (showProfile) {
    goBack = () => setShowProfile(false)
    screen = <ProfileScreen onBack={goBack} />
  } else if (showSupport) {
    goBack = () => setShowSupport(false)
    screen = <SupportScreen onBack={goBack} />
  } else if (showVouch) {
    goBack = () => setShowVouch(false)
    screen = (
      <VouchRequestsScreen
        onBack={goBack}
        backLabel={showAltro ? '‹ Altro' : '‹ Stanze'}
        onChange={refreshVouchCount}
      />
    )
  } else if (showAltro) {
    goBack = goToRooms
    screen = (
      <AltroScreen
        isStaff={isStaff}
        adminBadge={adminBadge || undefined}
        showVouch={canBeGuarantor || vouchCount > 0}
        vouchBadge={vouchCount || undefined}
        onBack={goToRooms}
        onOpenSettings={() => setShowSettings(true)}
        onOpenBlocked={() => setShowBlocked(true)}
        onOpenLegal={(doc) => setLegalDoc(doc)}
        onOpenAdmin={() => {
          setAdminTab('stats')
          setShowAdmin(true)
        }}
        onOpenVouch={() => setShowVouch(true)}
        onReportBug={() => openSupportEmail({ type: 'bug', screen: currentScreenLabel, userId: myId })}
        onSuggest={() => openSupportEmail({ type: 'feedback', screen: currentScreenLabel, userId: myId })}
        onOpenSupport={() => setShowSupport(true)}
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

  // Dentro una conversazione (stanza o DM) la tab bar sparisce: su schermi
  // piccoli quei 3.4rem valgono una bolla di messaggio in più, e le azioni che
  // restano utili qui stanno nel menu ⋯ dell'header. Non la nascondiamo
  // sull'elenco "Messaggi", che è una schermata di navigazione come le altre.
  // Il recupero dello spazio lo fa `.chat-focus` (vedi index.css).
  const chatFocus = Boolean(room) || (showDm && dmConversationOpen)

  return (
    <>
      {!chatFocus && <TabBar items={tabItems} />}
      {screen}
      <GlobalToast toast={notif.toast} onOpen={openFromToast} onDismiss={notif.dismiss} />
    </>
  )
}
