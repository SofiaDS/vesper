import { useRef, useState } from 'react'
import { Sun, Moon } from '@phosphor-icons/react'
import { AppHeader } from '../components/AppHeader'
import { useTheme } from '../hooks/useTheme'
import { useModalA11y } from '../hooks/useModalA11y'
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
  const [confirmLogout, setConfirmLogout] = useState(false)
  const logoutModalRef = useRef<HTMLDivElement | null>(null)
  useModalA11y(logoutModalRef, confirmLogout, () => setConfirmLogout(false))

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
          <span className="link-icon" aria-hidden="true">
            {isDark ? <Sun size={20} weight="duotone" /> : <Moon size={20} weight="duotone" />}
          </span>
          {isDark ? 'Tema chiaro' : 'Tema scuro'}
        </button>
        <button type="button" className="link link-row link-danger" onClick={() => setConfirmLogout(true)}>
          Esci
        </button>
      </section>

      {confirmLogout && (
        <div className="modal-overlay" onClick={() => setConfirmLogout(false)}>
          <div
            ref={logoutModalRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Vuoi uscire?</h2>
            <p className="muted small-inline">
              Verrai disconnessa e tornerai alla schermata di accesso.
            </p>
            <div className="modal-actions modal-actions-col">
              <button type="button" className="btn-danger" onClick={onSignOut}>
                Esci
              </button>
              <button type="button" className="btn-ghost" onClick={() => setConfirmLogout(false)}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
