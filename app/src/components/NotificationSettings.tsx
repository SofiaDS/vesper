import { usePushNotifications } from '../hooks/usePushNotifications'
import { isIOS, isStandalone } from '../lib/platform'

// Dove sbloccare le notifiche negate, che cambia con sistema e modalità.
function unblockHint(): React.ReactNode {
  if (isIOS) {
    return <strong>Impostazioni di iPhone › Notifiche › Vesper</strong>
  }
  if (isStandalone()) {
    return <strong>Impostazioni di Android › App › Vesper › Notifiche</strong>
  }
  return <>impostazioni del sito nel browser (icona a sinistra dell'indirizzo › <strong>Notifiche</strong>)</>
}

export function NotificationSettings() {
  const { supported, subscribed, busy, blocked, error, subscribe, unsubscribe } = usePushNotifications()

  if (!supported) {
    // Su iPhone le notifiche web esistono solo nell'app installata sulla
    // schermata Home (iOS 16.4+). Dal browser l'API non c'è proprio: invece di
    // nascondere la voce, spieghiamo come ottenerle.
    if (!isIOS) return null
    return (
      <div className="theme-toggle-row">
        <span className="toggle-label">
          Notifiche push
          <span className="hint" style={{ display: 'block', marginTop: '0.15rem' }}>
            {isStandalone()
              ? 'Per ricevere le notifiche aggiorna iPhone almeno a iOS 16.4.'
              : 'Su iPhone le notifiche arrivano solo dall’app installata: aggiungi Vesper alla schermata Home da Safari e aprila da lì.'}
          </span>
        </span>
      </div>
    )
  }

  return (
    <>
      <div className="theme-toggle-row">
        <span className="toggle-label">
          Notifiche push
          <span className="hint" style={{ display: 'block', marginTop: '0.15rem' }}>
            Messaggi privati, chat, aggiornamenti verifica
          </span>
        </span>
        <button
          type="button"
          className={subscribed ? 'toggle-pill on' : 'toggle-pill'}
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={busy || blocked}
          aria-label={subscribed ? 'Disattiva notifiche' : 'Attiva notifiche'}
        >
          <span className="toggle-knob" />
        </button>
      </div>
      {blocked && (
        <p className="hint" role="alert" style={{ marginTop: '0.5rem' }}>
          Le notifiche sono bloccate. Per attivarle vai in {unblockHint()} e
          consenti le notifiche, poi torna qui.
        </p>
      )}
      {!blocked && error && (
        <p className="hint" role="alert" style={{ marginTop: '0.5rem' }}>
          Non è stato possibile attivare le notifiche. Riprova; se il problema
          resta, segnala questo dettaglio: <code>{error}</code>
        </p>
      )}
    </>
  )
}
