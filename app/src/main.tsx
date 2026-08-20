import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'
import { initFont } from './hooks/useFont'
import { initTextSize } from './hooks/useTextSize'
import { initPushDeepLink } from './lib/pushDeepLink'

// Applica le preferenze di accessibilità salvate prima del render (font ad alta
// leggibilità + dimensione testo), così valgono su tutte le schermate: i
// controlli vivono solo in Impostazioni.
initFont()
initTextSize()

// Marca il guscio nativo Capacitor su <html>. Serve al CSS per garantire un
// margine minimo sotto la status bar: nella WebView Android `env(safe-area-inset-top)`
// a volte resta 0 (non espone l'inset), quindi solo qui applichiamo un fallback.
// Sul web NON mettiamo l'attributo, così il layout browser/PWA resta invariato.
if (Capacitor.isNativePlatform()) {
  document.documentElement.dataset.native = 'true'
}

// Aggancia SUBITO il tap sulle notifiche native: Capacitor consegna l'evento
// del tap una volta sola, al primo listener registrato. Registrarlo qui (prima
// del render) evita di perderlo quando la schermata che lo consuma monta tardi
// — avvio a freddo, sessione da ripristinare, blocco PIN. Vedi pushDeepLink.ts.
initPushDeepLink()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
