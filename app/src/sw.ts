/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
// __WB_MANIFEST viene iniettato da vite-plugin-pwa al build
precacheAndRoute(self.__WB_MANIFEST)

// Attiva subito il nuovo SW e prende il controllo dei client già aperti, senza
// aspettare la chiusura di tutte le schede. Con strategy 'injectManifest' il SW
// custom deve farlo da sé: registerType:'autoUpdate' in vite.config NON basta.
// Senza questo, dopo un deploy il vecchio SW continua a servire gli asset in
// cache → al reload si vede ancora la versione vecchia (es. il tema vecchio).
self.skipWaiting()
clientsClaim()

interface PushSource { kind: 'room' | 'dm'; id?: string; label?: string; group?: string }

// Quante righe di anteprima tenere nella notifica raggruppata. Android mostra
// una riga sola da chiusa ed espande il resto al tocco; oltre una manciata di
// righe il testo viene comunque troncato dal sistema.
const MAX_LINES = 5
// Risposta di una finestra aperta alla domanda "cosa stai mostrando?".
interface ActiveView { roomId: string | null; dmOpen: boolean }

// Quanto aspettare la risposta di una finestra prima di rinunciare. Se scade,
// la notifica viene mostrata: meglio una notifica ridondante che una persa.
const ASK_TIMEOUT_MS = 400

// Chiede a una finestra quale conversazione ha aperta. Il canale di risposta è
// una MessageChannel monouso: la finestra risponde sulla porta che le passiamo,
// così non serve nessuno stato condiviso e il service worker può essere stato
// riavviato un istante prima senza aver perso niente.
function askClient(client: Client): Promise<ActiveView | null> {
  return new Promise((resolve) => {
    const ch = new MessageChannel()
    const timer = setTimeout(() => resolve(null), ASK_TIMEOUT_MS)
    ch.port1.onmessage = (e: MessageEvent) => {
      clearTimeout(timer)
      resolve(e.data as ActiveView)
    }
    client.postMessage({ type: 'query-active-view' }, [ch.port2])
  })
}

function viewCovers(view: ActiveView | null, source: PushSource): boolean {
  if (!view) return false
  return source.kind === 'dm' ? view.dmOpen : view.roomId === source.id
}

// true se l'utente sta già guardando, in primo piano, ciò di cui parla la
// notifica. Solo le finestre 'visible' contano: se l'app è in background o il
// telefono è bloccato la notifica serve eccome.
async function isAlreadyOnScreen(source: PushSource): Promise<boolean> {
  const clients = (await self.clients.matchAll({ type: 'window' })) as WindowClient[]
  const visible = clients.filter((c) => c.visibilityState === 'visible')
  if (visible.length === 0) return false
  const views = await Promise.all(visible.map(askClient))
  return views.some((v) => viewCovers(v, source))
}

interface PushPayload {
  title?: string
  body?: string
  url?: string
  source?: PushSource
  line?: string
}

// Stato accumulato che una notifica si porta dietro, per poterlo rileggere
// quando arriva il messaggio successivo della stessa conversazione.
interface NotifData { url: string; count: number; lines: string[] }

// `renotify` fa parte della specifica Web Notifications (ed è supportata dai
// browser che ci interessano) ma non è ancora nei tipi DOM di TypeScript.
// Dichiararla qui è più onesto di un cast a `any`, che spegnerebbe i controlli
// anche sul resto delle opzioni.
interface NotificationOptionsWithRenotify extends NotificationOptions {
  renotify?: boolean
}

// Chiave di raggruppamento: notifiche con lo stesso `tag` si sostituiscono a
// vicenda invece di impilarsi. È il meccanismo che la specifica Web Push mette
// a disposizione per questo, e l'unico: non esiste un'API per una notifica
// "riassunto" separata dalle singole.
function groupTag(source: PushSource): string {
  return source.group ?? `${source.kind}:${source.id ?? 'all'}`
}

// Titolo della notifica raggruppata. Senza etichetta si ripiega su una frase
// generica, che è sempre meglio di "undefined".
function groupTitle(source: PushSource, count: number): string {
  const label = source.label
  if (!label) return `${count} nuovi messaggi`
  return source.kind === 'dm'
    ? `${count} messaggi da ${label}`
    : `${count} messaggi in ${label}`
}

self.addEventListener('push', (event: PushEvent) => {
  const data: PushPayload = event.data?.json() ?? {}
  event.waitUntil(
    (async () => {
      // Notifica ridondante: stai già leggendo quella stanza / i DM. Uscendo
      // senza showNotification non compare nulla.
      if (data.source && (await isAlreadyOnScreen(data.source))) return

      const url = data.url ?? '/'
      if (!data.source) {
        await self.registration.showNotification(data.title ?? 'Vesper', {
          body: data.body ?? '',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: { url, count: 1, lines: [] } satisfies NotifData,
        })
        return
      }

      const tag = groupTag(data.source)
      // Notifica ancora a schermo per questa conversazione: ne recuperiamo il
      // conteggio e le anteprime già mostrate. Se l'utente l'ha scartata, si
      // riparte da capo — ed è giusto: ha già visto quelle precedenti.
      const [existing] = await self.registration.getNotifications({ tag })
      const prev = existing?.data as NotifData | undefined
      const count = (prev?.count ?? 0) + 1
      const lines = [...(prev?.lines ?? []), data.line ?? data.body ?? ''].slice(-MAX_LINES)

      const grouped = count > 1
      // Assegnato a una variabile tipata, non passato come letterale: così
      // `renotify` non incappa nel controllo sulle proprietà in eccesso, che
      // TypeScript applica solo agli oggetti scritti in linea.
      const options: NotificationOptionsWithRenotify = {
        // Da chiusa Android mostra la prima riga, al tocco espande l'elenco.
        body: grouped ? lines.join('\n') : (data.body ?? ''),
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag,
        // Senza questo la sostituzione è silenziosa: la notifica si
        // aggiornerebbe senza avvisare che è arrivato un altro messaggio.
        renotify: true,
        data: { url, count, lines } satisfies NotifData,
      }
      await self.registration.showNotification(
        grouped ? groupTitle(data.source, count) : (data.title ?? 'Vesper'),
        options,
      )
    })(),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string }).url ?? '/'
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      // App già aperta: portala in primo piano e dille dove navigare. L'app è
      // una SPA a stato (non rilegge l'URL da sola), quindi passiamo il path
      // via postMessage → lo raccoglie useDeepLink.
      for (const client of clients) {
        await client.focus()
        client.postMessage({ type: 'deep-link', path: url })
        return
      }
      // Nessuna finestra aperta: aprine una sul path. Il rewrite SPA di Vercel
      // serve index.html e useDeepLink legge il path all'avvio.
      await self.clients.openWindow(url)
    })(),
  )
})
