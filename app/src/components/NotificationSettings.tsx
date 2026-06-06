import { usePushNotifications } from '../hooks/usePushNotifications'

export function NotificationSettings() {
  const { supported, subscribed, busy, subscribe, unsubscribe } = usePushNotifications()

  if (!supported) return null

  return (
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
        disabled={busy}
        aria-label={subscribed ? 'Disattiva notifiche' : 'Attiva notifiche'}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  )
}
