import { useInstallPrompt } from '../hooks/useInstallPrompt'

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
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 15V3" />
      <path d="m8 7 4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  )
}

export function InstallBanner() {
  const { show, isIOS, install, dismiss } = useInstallPrompt()
  if (!show) return null

  // Su iOS non esiste `beforeinstallprompt`: l'installazione si fa a mano dal
  // menu Condividi, quindi non c'è nessun bottone "Installa" da offrire e
  // l'unica azione resta "Non ora". Per questo il layout è diverso: le
  // istruzioni diventano il contenuto principale, incolonnate e leggibili,
  // invece di stare di fianco a un bottone di rifiuto che sarebbe l'unica
  // cosa a saltare all'occhio.
  return (
    <div className={`install-banner${isIOS ? ' install-banner-ios' : ''}`} role="banner">
      <div className="install-banner-body">
        {isIOS ? (
          <>
            <p className="install-banner-title">Installa Vesper sul tuo iPhone</p>
            <p className="install-banner-text">
              Tocca <ShareIcon /> nella barra di Safari, poi{' '}
              <strong>Aggiungi alla schermata Home</strong>.
            </p>
          </>
        ) : (
          <p className="install-banner-text">
            Installa <strong>Vesper</strong> sul tuo dispositivo per un'esperienza migliore.
          </p>
        )}
      </div>
      <div className="install-banner-actions">
        {!isIOS && (
          <button type="button" className="btn-primary btn-sm" onClick={install}>
            Installa
          </button>
        )}
        <button type="button" className="link install-banner-dismiss" onClick={dismiss}>
          Non ora
        </button>
      </div>
    </div>
  )
}
