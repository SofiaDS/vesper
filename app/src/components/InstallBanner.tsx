import { useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { chromeIntentUrl, isAndroid, isIOS } from '../lib/platform'

// Icona "Condividi" di iOS (quadrato con freccia verso l'alto), disegnata
// inline. Prima qui c'era il carattere ⎙ (U+2399 PRINT SCREEN SYMBOL): oltre a
// non essere l'icona giusta, non è presente nei font di sistema iOS, quindi
// rischia di comparire come rettangolo vuoto proprio nell'istruzione che deve
// dire dove toccare. Un SVG si disegna sempre uguale ovunque.
function ShareIcon() {
  return (
    <svg
      className="install-share-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Condividi"
      role="img"
      focusable="false"
    >
      <path d="M12 15V3" />
      <path d="m8 7 4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  )
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setCopied(true)
    } catch {
      // Clipboard non disponibile in alcuni browser interni: mostriamo l'indirizzo.
      window.prompt('Copia questo indirizzo e aprilo nel browser:', window.location.origin)
    }
  }
  return (
    <button type="button" className="btn-secondary btn-sm" onClick={copy}>
      {copied ? 'Link copiato' : 'Copia link'}
    </button>
  )
}

export function InstallBanner() {
  const { show, mode, inAppName, install, dismiss } = useInstallPrompt()
  if (!show || !mode) return null

  // Con il prompt nativo basta una riga e il bottone "Installa". In tutti gli
  // altri casi l'installazione si fa a mano: le istruzioni diventano il
  // contenuto principale, in colonna, e "Non ora" scende sotto, defilato.
  const stacked = mode !== 'prompt'

  let content: React.ReactNode
  switch (mode) {
    case 'prompt':
      content = (
        <p className="install-banner-text">
          Installa <strong>Vesper</strong> sul tuo dispositivo per un'esperienza migliore.
        </p>
      )
      break
    case 'ios-safari':
      content = (
        <>
          <p className="install-banner-title">Installa Vesper sul tuo iPhone</p>
          <p className="install-banner-text">
            Tocca <ShareIcon /> nella barra di Safari, poi{' '}
            <strong>Aggiungi alla schermata Home</strong>.
          </p>
        </>
      )
      break
    case 'ios-other':
      content = (
        <>
          <p className="install-banner-title">Installa Vesper sul tuo iPhone</p>
          <p className="install-banner-text">
            Tocca <ShareIcon /> nella barra degli indirizzi, poi{' '}
            <strong>Aggiungi alla schermata Home</strong>. Non trovi l'opzione?
            Apri questo indirizzo in <strong>Safari</strong>.
          </p>
        </>
      )
      break
    case 'android-manual':
      content = (
        <>
          <p className="install-banner-title">Installa Vesper sul telefono</p>
          <p className="install-banner-text">
            Apri il menu <strong>⋮</strong> del browser e tocca{' '}
            <strong>Installa app</strong> (o <strong>Aggiungi a schermata Home</strong>).
          </p>
        </>
      )
      break
    case 'in-app':
      content = (
        <>
          <p className="install-banner-title">Apri Vesper nel browser</p>
          <p className="install-banner-text">
            Sei nel browser interno {inAppName ? <>di {inAppName}</> : <>di un'app</>}: da
            qui Vesper non si può installare e le notifiche non arrivano.{' '}
            {isIOS ? (
              <>Tocca il menu (<strong>⋯</strong>) e scegli <strong>Apri in Safari</strong>.</>
            ) : (
              <>Aprila in Chrome con il bottone qui sotto.</>
            )}
          </p>
        </>
      )
      break
  }

  return (
    <div className={`install-banner${stacked ? ' install-banner-stack' : ''}`} role="region" aria-label="Installa l'app">
      <div className="install-banner-body">{content}</div>
      <div className="install-banner-actions">
        {mode === 'prompt' && (
          <button type="button" className="btn-primary btn-sm" onClick={install}>
            Installa
          </button>
        )}
        {mode === 'in-app' && isAndroid && (
          <a className="btn-primary btn-sm" href={chromeIntentUrl()}>
            Apri in Chrome
          </a>
        )}
        {mode === 'in-app' && <CopyLinkButton />}
        <button type="button" className="link install-banner-dismiss" onClick={dismiss}>
          Non ora
        </button>
      </div>
    </div>
  )
}
