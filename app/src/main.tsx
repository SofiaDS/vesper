import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'
import { initFont } from './hooks/useFont'

// Applica la preferenza font salvata prima del render, così il carattere ad
// alta leggibilità vale su tutte le schermate (il toggle vive solo in Impostazioni).
initFont()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
