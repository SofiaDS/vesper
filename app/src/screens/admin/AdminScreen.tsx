import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { PhotoModeration } from './PhotoModeration'
import { ReportsModeration } from './ReportsModeration'
import { ModeratorManagement } from './ModeratorManagement'

type Tab = 'foto' | 'segnalazioni' | 'moderatori'

export function AdminScreen({ onBack }: { onBack: () => void }) {
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState<Tab>('foto')

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

      {tab === 'foto' && <PhotoModeration />}
      {tab === 'segnalazioni' && <ReportsModeration />}
      {tab === 'moderatori' && isAdmin && <ModeratorManagement />}
    </main>
  )
}
