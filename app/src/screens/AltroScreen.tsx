import { AppHeader } from '../components/AppHeader'
import { useTheme } from '../hooks/useTheme'
import { LEGAL_DOC_LABELS, type LegalDoc } from './LegalScreen'

// Hub "Altro": sostituisce il vecchio burger menu (rimosso dagli header) con
// una schermata a card, come nei mockup. Raccoglie tutte le voci che non hanno
// una tab dedicata (Impostazioni, moderazione staff, supporto, sessione).
export function AltroScreen({
  isStaff,
  onBack,
  onOpenSettings,
  onOpenBlocked,
  onOpenLegal,
  onOpenAdmin,
  onReportBug,
  onSuggest,
  onSupportLink,
  onSignOut,
}: {
  isStaff: boolean
  onBack: () => void
  onOpenSettings: () => void
  onOpenBlocked: () => void
  onOpenLegal: (doc: LegalDoc) => void
  onOpenAdmin: () => void
  onReportBug: () => void
  onSuggest: () => void
  onSupportLink: () => void
  onSignOut: () => void
}) {
  const { theme, toggle: toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <main className="app profile">
      <AppHeader backLabel="‹ Stanze" onBack={onBack} title="Altro" />

      <section className="card box-shadow">
        <h2 className="pf-section-title">Account &amp; community</h2>
        <button type="button" className="link link-row" onClick={onOpenSettings}>
          Impostazioni
        </button>
        <button type="button" className="link link-row" onClick={onOpenBlocked}>
          Utenti bloccati
        </button>
        <button type="button" className="link link-row" onClick={() => onOpenLegal('about')}>
          {LEGAL_DOC_LABELS.about}
        </button>
        <button type="button" className="link link-row" onClick={() => onOpenLegal('privacy')}>
          {LEGAL_DOC_LABELS.privacy}
        </button>
        <button type="button" className="link link-row" onClick={() => onOpenLegal('terms')}>
          {LEGAL_DOC_LABELS.terms}
        </button>
      </section>

      {isStaff && (
        <section className="card box-shadow" style={{ marginTop: '1rem' }}>
          <h2 className="pf-section-title">Moderazione (staff)</h2>
          <button type="button" className="link link-row" onClick={onOpenAdmin}>
            Apri pannello Admin
          </button>
        </section>
      )}

      <section className="card box-shadow" style={{ marginTop: '1rem' }}>
        <h2 className="pf-section-title">Supporto</h2>
        <button type="button" className="link link-row" onClick={onReportBug}>
          Segnala un bug
        </button>
        <button type="button" className="link link-row" onClick={onSuggest}>
          Dacci un suggerimento
        </button>
        <button
          type="button"
          className="link link-row"
          onClick={onSupportLink}
          aria-label="Sostieni Vesper, si apre in una nuova scheda"
        >
          Sostieni Vesper ↗
        </button>
      </section>

      <section className="card box-shadow" style={{ marginTop: '1rem' }}>
        <h2 className="pf-section-title">Sessione</h2>
        <button
          type="button"
          className="link link-row"
          onClick={toggleTheme}
          aria-label={isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
        >
          <span aria-hidden="true">{isDark ? '☀' : '🌙'}</span>
          {isDark ? 'Tema chiaro' : 'Tema scuro'}
        </button>
        <button type="button" className="link link-row link-danger" onClick={onSignOut}>
          Esci
        </button>
      </section>
    </main>
  )
}
