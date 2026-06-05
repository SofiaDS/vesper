import { useEffect, useState } from 'react'
import { listBlockedUsers, unblockUser, type BlockedUser } from '../lib/blocks'

// Gestione dei propri blocchi: elenco delle persone bloccate con sblocco.
export function BlockedUsersScreen({ onBack }: { onBack: () => void }) {
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
      <header className="rooms-header">
        <button type="button" className="link back" onClick={onBack}>
          ‹ Profilo
        </button>
        <h1 className="rooms-brand">Utenti bloccati</h1>
        <span className="link-placeholder" />
      </header>

      {loading && <p className="muted">Carico…</p>}
      {error && <p className="err chat-error">{error}</p>}

      {!loading && !error && users.length === 0 && (
        <p className="hint">Non hai bloccato nessuno.</p>
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
