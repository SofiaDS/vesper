import { useAuth } from '../../auth/AuthProvider'
import { AppHeader } from '../../components/AppHeader'
import type { AdminPendingCounts } from '../../hooks/useAdminPendingCounts'
import { PhotoModeration } from './PhotoModeration'
import { ReportsModeration } from './ReportsModeration'
import { ModeratorManagement } from './ModeratorManagement'
import { ReputationModeration } from './ReputationModeration'
import { VerificationModeration } from './VerificationModeration'
import { AiFlags } from './AiFlags'
import { AdminStats } from './AdminStats'

export type AdminTab = 'stats' | 'verifiche' | 'foto' | 'segnalazioni' | 'ai' | 'reputazione' | 'moderatori'

export const ADMIN_TAB_LABELS: Record<AdminTab, string> = {
  stats: 'Statistiche',
  verifiche: 'Verifiche',
  foto: 'Foto',
  segnalazioni: 'Segnalazioni',
  ai: 'Flag AI',
  reputazione: 'Reputazione',
  moderatori: 'Moderatori',
}

// Una voce della sub-nav admin: la sezione, quante voci ha "da revisionare"
// (badge rosso, opzionale) e se è visibile per il ruolo corrente. L'ordine
// di `ADMIN_SUBNAV` definisce anche l'ordine dei pulsanti.
type SubnavSpec = { key: AdminTab; badge: (c: AdminPendingCounts) => number | undefined; staffOnly?: boolean; adminOnly?: boolean }
const ADMIN_SUBNAV: SubnavSpec[] = [
  { key: 'stats', badge: () => undefined },
  { key: 'verifiche', badge: (c) => c.verifiche },
  { key: 'foto', badge: (c) => c.foto },
  { key: 'segnalazioni', badge: (c) => c.segnalazioni },
  { key: 'ai', badge: (c) => c.ai, staffOnly: true },
  { key: 'reputazione', badge: () => undefined, staffOnly: true },
  { key: 'moderatori', badge: () => undefined, adminOnly: true },
]

// Pannello di moderazione: la sub-nav a pillole (sostituisce le sottovoci del
// vecchio burger menu) lascia scegliere la sezione; il contenuto attivo è
// scelto da `tab`. I badge "da revisionare" riusano i conteggi già calcolati
// in Home da useAdminPendingCounts, senza nuove query.
export function AdminScreen({
  tab,
  counts,
  onTabChange,
  onBack,
}: {
  tab: AdminTab
  counts: AdminPendingCounts
  onTabChange: (tab: AdminTab) => void
  onBack: () => void
}) {
  const { isAdmin, isStaff } = useAuth()

  const visibleTabs = ADMIN_SUBNAV.filter(
    (s) => (!s.staffOnly || isStaff) && (!s.adminOnly || isAdmin),
  )

  return (
    <main className="app admin">
      <AppHeader backLabel="‹ Altro" onBack={onBack} title={`Moderazione · ${ADMIN_TAB_LABELS[tab]}`} />

      <nav className="admin-subnav" aria-label="Sezioni di moderazione">
        {visibleTabs.map((s) => {
          const badge = s.badge(counts)
          const active = s.key === tab
          return (
            <button
              key={s.key}
              type="button"
              className={active ? 'active' : ''}
              onClick={() => onTabChange(s.key)}
              // Single-select switcher dentro un <nav>: `aria-current="page"`
              // segnala la sezione attiva. Niente `aria-pressed` in più, che
              // sarebbe ridondante (doppio annuncio "premuto, pagina corrente").
              aria-current={active ? 'page' : undefined}
              aria-label={badge ? `${ADMIN_TAB_LABELS[s.key]}, ${badge} da revisionare` : undefined}
            >
              {ADMIN_TAB_LABELS[s.key]}
              {!!badge && (
                <span className="badge-sm" aria-hidden="true">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {tab === 'stats' && <AdminStats />}
      {tab === 'verifiche' && <VerificationModeration />}
      {tab === 'foto' && <PhotoModeration />}
      {tab === 'segnalazioni' && <ReportsModeration />}
      {tab === 'ai' && isStaff && <AiFlags />}
      {tab === 'reputazione' && isStaff && <ReputationModeration />}
      {tab === 'moderatori' && isAdmin && <ModeratorManagement />}
    </main>
  )
}
