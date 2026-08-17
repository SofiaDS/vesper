import type { CapacitorConfig } from '@capacitor/cli'

// Guscio nativo Capacitor per Android (Play Store). L'app carica il sito live
// vespercommunity.com nella WebView — come faceva la TWA — così i deploy su
// Vercel restano istantanei (nessuna review Play per un fix web). La differenza
// rispetto alla TWA è che le notifiche passano da FCM NATIVO (@capacitor/
// push-notifications), gestite da Google Play Services e non più da Chrome:
// arrivano anche a WebView chiusa e non dipendono dal browser installato.
//
// appId IMMUTABILE su Play = com.vespercommunity.app (vedi memoria TWA): va
// firmato con lo stesso keystore per aggiornare la scheda esistente.
const config: CapacitorConfig = {
  appId: 'com.vespercommunity.app',
  appName: 'Vesper',
  // Usato solo da `cap sync`/`copy`; con server.url il contenuto vero è remoto.
  webDir: 'dist',
  server: {
    // Carica il sito live invece del bundle locale → deploy istantaneo mantenuto.
    url: 'https://vespercommunity.com',
    // Solo pagine servite in HTTPS dal nostro dominio.
    cleartext: false,
  },
  android: {
    // Consente al bridge Capacitor di caricare l'origine remota.
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: {
      // Mostra badge, suono e alert quando la notifica arriva in foreground (iOS);
      // su Android il comportamento foreground è gestito lato codice.
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
