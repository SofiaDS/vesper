import { AppHeader } from '../components/AppHeader'
import { NotificationSettings } from '../components/NotificationSettings'
import { PinSetupSection } from './profile/PinSetupSection'

export function SettingsScreen({
  onBack,
  onOpenBlocked,
}: {
  onBack: () => void
  onOpenBlocked: () => void
}) {
  return (
    <main className="app profile">
      <AppHeader backLabel="‹ Stanze" onBack={onBack} title="Impostazioni" />

      <section className="card box-shadow">
        <h2 className="pf-section-title">Notifiche</h2>
        <NotificationSettings />
      </section>

      <section className="card box-shadow" style={{ marginTop: '1rem' }}>
        <h2 className="pf-section-title">Blocco con PIN</h2>
        <PinSetupSection />
      </section>

      <section className="card box-shadow" style={{ marginTop: '1rem' }}>
        <h2 className="pf-section-title">Privacy</h2>
        <button type="button" className="link" onClick={onOpenBlocked}>
          Persone bloccate
        </button>
      </section>
    </main>
  )
}
