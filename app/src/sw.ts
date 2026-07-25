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

interface PushSource { kind: 'room' | 'dm'; id?: string }
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

self.addEventListener('push', (event: PushEvent) => {
  interface PushPayload { title?: string; body?: string; url?: string; source?: PushSource }
  const data: PushPayload = event.data?.json() ?? {}
  event.waitUntil(
    (async () => {
      // Notifica ridondante: stai già leggendo quella stanza / i DM. Uscendo
      // senza showNotification non compare nulla.
      if (data.source && (await isAlreadyOnScreen(data.source))) return
      await self.registration.showNotification(data.title ?? 'Vesper', {
        body: data.body ?? '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url: data.url ?? '/' },
      })
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
