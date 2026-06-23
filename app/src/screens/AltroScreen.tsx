import { useRef, useState } from 'react'
import {
  Sun,
  Moon,
  Gear,
  Prohibit,
  Info,
  ShieldCheck,
  FileText,
  ShieldStar,
  Bug,
  Lightbulb,
  Heart,
  SignOut,
  CaretRight,
  ArrowUpRight,
} from '@phosphor-icons/react'
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
        <button type="button" className="nav-row" onClick={onOpenSettings}>
          <span className="nav-row-ico" aria-hidden="true">
            <Gear size={20} weight="duotone" />
          </span>
          <span className="nav-row-label">Impostazioni</span>
          <CaretRight className="nav-row-chev" size={16} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className="nav-row" onClick={onOpenBlocked}>
          <span className="nav-row-ico" aria-hidden="true">
            <Prohibit size={20} weight="duotone" />
          </span>
          <span className="nav-row-label">Utenti bloccati</span>
          <CaretRight className="nav-row-chev" size={16} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className="nav-row" onClick={() => onOpenLegal('about')}>
          <span className="nav-row-ico" aria-hidden="true">
            <Info size={20} weight="duotone" />
          </span>
          <span className="nav-row-label">{LEGAL_DOC_LABELS.about}</span>
          <CaretRight className="nav-row-chev" size={16} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className="nav-row" onClick={() => onOpenLegal('privacy')}>
          <span className="nav-row-ico" aria-hidden="true">
            <ShieldCheck size={20} weight="duotone" />
          </span>
          <span className="nav-row-label">{LEGAL_DOC_LABELS.privacy}</span>
          <CaretRight className="nav-row-chev" size={16} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className="nav-row" onClick={() => onOpenLegal('terms')}>
          <span className="nav-row-ico" aria-hidden="true">
            <FileText size={20} weight="duotone" />
          </span>
          <span className="nav-row-label">{LEGAL_DOC_LABELS.terms}</span>
          <CaretRight className="nav-row-chev" size={16} weight="bold" aria-hidden="true" />
        </button>
      </section>

      {isStaff && (
        <section className="card box-shadow" style={{ marginTop: '1rem' }}>
          <h2 className="pf-section-title">Moderazione (staff)</h2>
          <button type="button" className="nav-row" onClick={onOpenAdmin}>
            <span className="nav-row-ico" aria-hidden="true">
              <ShieldStar size={20} weight="duotone" />
            </span>
            <span className="nav-row-label">Apri pannello Admin</span>
            <CaretRight className="nav-row-chev" size={16} weight="bold" aria-hidden="true" />
          </button>
        </section>
      )}

      <section className="card box-shadow" style={{ marginTop: '1rem' }}>
        <h2 className="pf-section-title">Supporto</h2>
        <button type="button" className="nav-row" onClick={onReportBug}>
          <span className="nav-row-ico" aria-hidden="true">
            <Bug size={20} weight="duotone" />
          </span>
          <span className="nav-row-label">Segnala un bug</span>
          <CaretRight className="nav-row-chev" size={16} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className="nav-row" onClick={onSuggest}>
          <span className="nav-row-ico" aria-hidden="true">
            <Lightbulb size={20} weight="duotone" />
          </span>
          <span className="nav-row-label">Dacci un suggerimento</span>
          <CaretRight className="nav-row-chev" size={16} weight="bold" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="nav-row"
          onClick={onSupportLink}
          aria-label="Sostieni Vesper, si apre in una nuova scheda"
        >
          <span className="nav-row-ico" aria-hidden="true">
            <Heart size={20} weight="duotone" />
          </span>
          <span className="nav-row-label">Sostieni Vesper</span>
          <ArrowUpRight className="nav-row-chev" size={16} weight="bold" aria-hidden="true" />
        </button>
      </section>

      <section className="card box-shadow" style={{ marginTop: '1rem' }}>
        <h2 className="pf-section-title">Sessione</h2>
        <button
          type="button"
          className="nav-row"
          onClick={toggleTheme}
          aria-label={isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
        >
          <span className="nav-row-ico" aria-hidden="true">
            {isDark ? <Sun size={20} weight="duotone" /> : <Moon size={20} weight="duotone" />}
          </span>
          <span className="nav-row-label">{isDark ? 'Tema chiaro' : 'Tema scuro'}</span>
        </button>
        <button
          type="button"
          className="nav-row nav-row-danger"
          onClick={() => setConfirmLogout(true)}
        >
          <span className="nav-row-ico" aria-hidden="true">
            <SignOut size={20} weight="duotone" />
          </span>
          <span className="nav-row-label">Esci</span>
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
