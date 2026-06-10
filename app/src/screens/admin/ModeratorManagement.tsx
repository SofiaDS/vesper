import { useEffect, useState } from 'react'
import {
  listModerators,
  grantModerator,
  revokeModerator,
  findUserIdByNickname,
  type Moderator,
} from '../../lib/admin'

export function ModeratorManagement() {
  const [mods, setMods] = useState<Moderator[]>([])
  const [loading, setLoading] = useState(true)
  const [nick, setNick] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function load() {
    setMods(await listModerators())
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await listModerators()
        if (alive) setMods(list)
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : 'Errore.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setInfo(null)
    const name = nick.trim()
    if (!name) return
    setBusy(true)
    try {
      const id = await findUserIdByNickname(name)
      if (!id) {
        setErr('Nessun utente con questo nickname.')
        return
      }
      await grantModerator(id)
      setNick('')
      setInfo(`@${name} è ora moderatore.`)
      await load()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Operazione non riuscita.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(m: Moderator) {
    setErr(null)
    setInfo(null)
    setBusy(true)
    try {
      await revokeModerator(m.user_id)
      await load()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Operazione non riuscita.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mod-list box-shadow border-radius padding">
      <form className="composer inline-add" onSubmit={add}>
        <input
          type="text"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="nickname da nominare moderatore…"
          autoComplete="off"
        />
        <button
          type="submit"
          className="btn-primary btn-sm"
          disabled={busy || !nick.trim()}
        >
          Nomina
        </button>
      </form>
      {info && <p className="hint" role="status">{info}</p>}
      {err && <p className="err" role="alert">{err}</p>}
      {loading ? (
        <p className="muted">Carico i moderatori…</p>
      ) : mods.length === 0 ? (
        <p className="hint">Nessun moderatore al momento.</p>
      ) : (
        <ul className="mod-people">
          {mods.map((m) => (
            <li key={m.user_id} className="mod-row">
              <span>@{m.nickname}</span>
              <button
                type="button"
                className="link clear-sel"
                onClick={() => remove(m)}
                disabled={busy}
              >
                Revoca
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
