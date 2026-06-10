import { AppHeader } from '../components/AppHeader'
import { NotificationSettings } from '../components/NotificationSettings'
import { PinSetupSection } from './profile/PinSetupSection'
import { LEGAL_DOC_LABELS, type LegalDoc } from './LegalScreen'

export function SettingsScreen({
  onBack,
  onOpenBlocked,
  onOpenLegal,
}: {
  onBack: () => void
  onOpenBlocked: () => void
  onOpenLegal: (doc: LegalDoc) => void
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
        <button type="button" className="link" style={{ display: 'block' }} onClick={onOpenBlocked}>
          Persone bloccate
        </button>
        <button type="button" className="link" style={{ display: 'block' }} onClick={() => onOpenLegal('privacy')}>
          {LEGAL_DOC_LABELS.privacy}
        </button>
        <button type="button" className="link" style={{ display: 'block' }} onClick={() => onOpenLegal('terms')}>
          {LEGAL_DOC_LABELS.terms}
        </button>
      </section>
    </main>
  )
}
