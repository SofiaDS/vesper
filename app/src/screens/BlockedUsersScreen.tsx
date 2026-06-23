import { useEffect, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { AnimatedLoader } from '../components/AnimatedLoader'
import { listBlockedUsers, unblockUser, type BlockedUser } from '../lib/blocks'

// Fluent Emoji (Microsoft, MIT) servito da CDN: nessun peso nel bundle.
const SHIELD_EMOJI = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji/assets/Shield/Flat/shield_flat.svg'

// Gestione dei propri blocchi: elenco delle persone bloccate con sblocco.
export function BlockedUsersScreen({ onBack, backLabel = '‹ Profilo' }: { onBack: () => void; backLabel?: string }) {
  const [users, setUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await listBlockedUsers()
        if (alive) setUsers(list)
      } catch {
        if (alive) setError('Impossibile caricare l’elenco.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  async function handleUnblock(id: string) {
    setBusy(id)
    try {
      await unblockUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch {
      setError('Sblocco non riuscito. Riprova.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="app profile">
      <AppHeader backLabel={backLabel} onBack={onBack} title="Utenti bloccati" />

      {loading && <AnimatedLoader />}
      {error && <p className="err chat-error" role="alert">{error}</p>}

      {!loading && !error && users.length === 0 && (
        <div className="empty-state">
          <img src={SHIELD_EMOJI} alt="" width={64} height={64} loading="lazy" />
          <p className="hint">Non hai bloccato nessuno.</p>
        </div>
      )}

      {users.length > 0 && (
        <ul className="mod-people">
          {users.map((u) => (
            <li key={u.id} className="mod-row">
              <span>@{u.nickname}</span>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => handleUnblock(u.id)}
                disabled={busy === u.id}
              >
                {busy === u.id ? 'Sblocco…' : 'Sblocca'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
