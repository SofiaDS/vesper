import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { findUserIdByNickname } from '../../lib/admin'
import { UserReputation } from './UserReputation'

export function ReputationModeration() {
  const { session, isAdmin } = useAuth()
  const moderatorId = session!.user.id

  const [query, setQuery]           = useState('')
  const [targetId, setTargetId]     = useState<string | null>(null)
  const [targetNick, setTargetNick] = useState('')
  const [searching, setSearching]   = useState(false)
  const [searchErr, setSearchErr]   = useState<string | null>(null)

  async function search(e: React.FormEvent) {
    e.preventDefault()
    const nick = query.trim()
    if (!nick) return
    setSearching(true)
    setSearchErr(null)
    setTargetId(null)
    try {
      const id = await findUserIdByNickname(nick)
      if (!id) setSearchErr('Utente non trovata.')
      else { setTargetId(id); setTargetNick(nick) }
    } catch (e) {
      setSearchErr(e instanceof Error ? e.message : 'Errore.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="mod-list">
      <form className="rep-search" onSubmit={search}>
        <input
          type="text"
          placeholder="Cerca per nickname…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Nickname"
        />
        <button type="submit" className="btn-primary btn-sm" disabled={searching}>
          {searching ? 'Cerco…' : 'Cerca'}
        </button>
      </form>

      {searchErr && <p className="err">{searchErr}</p>}

      {targetId && (
        <UserReputation
          key={targetId}
          userId={targetId}
          nickname={targetNick}
          moderatorId={moderatorId}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
