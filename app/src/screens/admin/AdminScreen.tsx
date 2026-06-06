import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { PhotoModeration } from './PhotoModeration'
import { ReportsModeration } from './ReportsModeration'
import { ModeratorManagement } from './ModeratorManagement'
import { ReputationModeration } from './ReputationModeration'
import { VerificationModeration } from './VerificationModeration'
import { AiFlags } from './AiFlags'
import { AdminStats } from './AdminStats'

type Tab = 'stats' | 'verifiche' | 'foto' | 'segnalazioni' | 'ai' | 'reputazione' | 'moderatori'

export function AdminScreen({ onBack }: { onBack: () => void }) {
  const { isAdmin, isStaff } = useAuth()
  const [tab, setTab] = useState<Tab>('stats')

  return (
    <main className="app admin">
      <header className="rooms-header">
        <button type="button" className="link back" onClick={onBack}>
          ‹ Stanze
        </button>
        <h1 className="rooms-brand">Moderazione</h1>
        <span />
      </header>

      <nav className="admin-tabs">
        <button
          type="button"
          className={tab === 'stats' ? 'admin-tab on' : 'admin-tab'}
          onClick={() => setTab('stats')}
        >
          Statistiche
        </button>
        <button
          type="button"
          className={tab === 'verifiche' ? 'admin-tab on' : 'admin-tab'}
          onClick={() => setTab('verifiche')}
        >
          Verifiche
        </button>
        <button
          type="button"
          className={tab === 'foto' ? 'admin-tab on' : 'admin-tab'}
          onClick={() => setTab('foto')}
        >
          Foto
        </button>
        <button
          type="button"
          className={tab === 'segnalazioni' ? 'admin-tab on' : 'admin-tab'}
          onClick={() => setTab('segnalazioni')}
        >
          Segnalazioni
        </button>
        {isStaff && (
          <button
            type="button"
            className={tab === 'ai' ? 'admin-tab on' : 'admin-tab'}
            onClick={() => setTab('ai')}
          >
            Flag AI
          </button>
        )}
        {isStaff && (
          <button
            type="button"
            className={tab === 'reputazione' ? 'admin-tab on' : 'admin-tab'}
            onClick={() => setTab('reputazione')}
          >
            Reputazione
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            className={tab === 'moderatori' ? 'admin-tab on' : 'admin-tab'}
            onClick={() => setTab('moderatori')}
          >
            Moderatori
          </button>
        )}
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
