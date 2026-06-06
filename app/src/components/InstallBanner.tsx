import { useInstallPrompt } from '../hooks/useInstallPrompt'

export function InstallBanner() {
  const { show, isIOS, install, dismiss } = useInstallPrompt()
  if (!show) return null

  return (
    <div className="install-banner" role="banner">
      <div className="install-banner-body">
        {isIOS ? (
          <p className="install-banner-text">
            Tocca <span className="install-share-icon">⎙</span> poi{' '}
            <strong>Aggiungi alla schermata Home</strong> per installare Vesper.
          </p>
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
