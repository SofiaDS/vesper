import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'
import { initFont } from './hooks/useFont'

// Applica la preferenza font salvata prima del render, così il carattere ad
// alta leggibilità vale su tutte le schermate (il toggle vive solo in Impostazioni).
initFont()

// Marca il guscio nativo Capacitor su <html>. Serve al CSS per garantire un
// margine minimo sotto la status bar: nella WebView Android `env(safe-area-inset-top)`
// a volte resta 0 (non espone l'inset), quindi solo qui applichiamo un fallback.
// Sul web NON mettiamo l'attributo, così il layout browser/PWA resta invariato.
if (Capacitor.isNativePlatform()) {
  document.documentElement.dataset.native = 'true'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
