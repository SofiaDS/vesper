import { useAuth } from '../../auth/AuthProvider'
import { AppHeader } from '../../components/AppHeader'
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

// La navigazione fra le sezioni di moderazione vive ora nel burger menu
// (sottovoci di "Moderazione"): qui mostriamo solo il contenuto della
// sezione attiva, scelta altrove e passata come prop.
export function AdminScreen({ tab, onBack }: { tab: AdminTab; onBack: () => void }) {
  const { isAdmin, isStaff } = useAuth()

  return (
    <main className="app admin">
      <AppHeader backLabel="‹ Stanze" onBack={onBack} title={`Moderazione · ${ADMIN_TAB_LABELS[tab]}`} />

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
