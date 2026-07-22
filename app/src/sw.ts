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

self.addEventListener('push', (event: PushEvent) => {
  interface PushPayload { title?: string; body?: string; url?: string }
  const data: PushPayload = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Vesper', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url ?? '/' },
    }),
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
