// Buca di raccolta per il deep-link del tap su una notifica NATIVA (FCM).
//
// Perché non basta registrare il listener dentro un hook di Home: al tap su una
// notifica ad app chiusa Android lancia l'activity, Capacitor consegna
// l'evento 'pushNotificationActionPerformed' e lo trattiene finché NON viene
// aggiunto il primo listener — ma lo consegna una volta sola. Se in quel
// momento la pagina è ancora in avvio (WebView che carica il sito remoto,
// sessione Supabase da ripristinare, blocco PIN) e Home non è montata, il
// listener di Home non esiste ancora... e quando l'evento arriva a un listener
// che poi sparisce (Home smontata da un lock PIN, oppure la WebView che
// ricarica la pagina) l'intento è perso e l'app resta sull'elenco stanze /
// elenco DM. È il bug "a volte non apre la conversazione giusta".
//
// Qui il listener si registra al boot del modulo (importato da main.tsx, prima
// del render di React) e l'intento resta parcheggiato in memoria + in
// sessionStorage finché qualcuno lo consuma. sessionStorage e non localStorage:
// deve sopravvivere a un reload della pagina, non a un riavvio dell'app (un
// intento vecchio di giorni non va più aperto).
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { parseDeepLink, type DeepLinkIntent } from './deepLink'

const STORAGE_KEY = 'vesper:pending-deep-link'

let pending: DeepLinkIntent | null = null
const listeners = new Set<(intent: DeepLinkIntent) => void>()

function readStored(): DeepLinkIntent | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DeepLinkIntent) : null
  } catch {
    return null
  }
}

function store(intent: DeepLinkIntent | null) {
  try {
    if (intent) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Modalità privata / storage pieno: restiamo con la sola copia in memoria.
  }
}

function push(intent: DeepLinkIntent) {
  pending = intent
  store(intent)
  for (const l of listeners) l(intent)
}

/** L'intento in attesa, se c'è. Non lo consuma: serve `clearPendingDeepLink`. */
export function getPendingDeepLink(): DeepLinkIntent | null {
  if (!pending) pending = readStored()
  return pending
}

/** Da chiamare DOPO aver navigato, così un reload non riapre la destinazione. */
export function clearPendingDeepLink() {
  pending = null
  store(null)
}

/** Notifica chi è già montato quando arriva un nuovo tap. */
export function onPendingDeepLink(cb: (intent: DeepLinkIntent) => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

/**
 * Registra il listener nativo il prima possibile. Idempotente: chiamarlo due
 * volte (StrictMode in dev) non raddoppia le registrazioni.
 */
let started = false
export function initPushDeepLink() {
  if (started || !Capacitor.isNativePlatform()) return
  started = true
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const url = action.notification.data?.url
    if (typeof url !== 'string') return
    const intent = parseDeepLink(url)
    if (intent) push(intent)
  })
}
