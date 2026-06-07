import { AppHeader } from '../components/AppHeader'
import { NotificationSettings } from '../components/NotificationSettings'

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  return (
    <main className="app profile">
      <AppHeader backLabel="‹ Stanze" onBack={onBack} title="Impostazioni" />

      <section className="card">
        <h2 className="pf-section-title">Notifiche</h2>
        <NotificationSettings />
      </section>
    </main>
  )
}
