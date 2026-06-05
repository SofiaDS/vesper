import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import {
  listPendingPhotos,
  moderatePhoto,
  listReports,
  resolveReport,
  listModerators,
  grantModerator,
  revokeModerator,
  findUserIdByNickname,
  type PendingPhoto,
  type ReportRow,
  type ReportStatus,
  type Moderator,
} from '../lib/admin'

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

// --- Tab Foto: approva / rifiuta le foto in attesa ---

function PhotoModeration() {
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await listPendingPhotos()
        if (alive) setPhotos(list)
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : 'Errore.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  async function decide(p: PendingPhoto, status: 'approved' | 'rejected') {
    setBusy(p.id)
    setErr(null)
    try {
      await moderatePhoto(p.id, status)
      setPhotos((prev) => prev.filter((x) => x.id !== p.id))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Operazione non riuscita.')
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <p className="muted">Carico le foto in attesa…</p>
  if (photos.length === 0)
    return <p className="hint">Nessuna foto in attesa di revisione.</p>

  return (
    <div className="mod-list">
      {err && <p className="err">{err}</p>}
      {photos.map((p) => (
        <div key={p.id} className="mod-photo">
          {p.url ? (
            <img className="mod-photo-img" src={p.url} alt="" />
          ) : (
            <div className="mod-photo-img ph" />
          )}
          <div className="mod-photo-body">
            <p className="mod-photo-who">
              @{p.nickname}{' '}
              {p.is_primary && <span className="muted">· principale</span>}
            </p>
            <p className="muted small-inline">
              {new Date(p.created_at).toLocaleString('it-IT')}
            </p>
            <div className="mod-photo-actions">
              <button
                type="button"
                className="btn-approve"
                onClick={() => decide(p, 'approved')}
                disabled={busy === p.id}
              >
                Approva
              </button>
              <button
                type="button"
                className="btn-reject"
                onClick={() => decide(p, 'rejected')}
                disabled={busy === p.id}
              >
                Rifiuta
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Tab Segnalazioni (scaffold): elenca e risolve le segnalazioni ---

const REPORT_TARGET_LABEL: Record<string, string> = {
  user: 'Utente',
  message: 'Messaggio',
  photo: 'Foto',
}

function ReportsModeration() {
  const { session } = useAuth()
  const [filter, setFilter] = useState<ReportStatus | 'all'>('open')
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setReports(await listReports(filter))
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Errore.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await listReports(filter)
        if (alive) setReports(list)
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : 'Errore.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [filter])

  async function resolve(
    id: string,
    status: 'reviewed' | 'actioned' | 'dismissed',
  ) {
    if (!session?.user) return
    setBusy(id)
    setErr(null)
    try {
      await resolveReport(id, status, session.user.id)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Operazione non riuscita.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mod-list">
      <div className="admin-filter">
        <label>
          Stato:{' '}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ReportStatus | 'all')}
          >
            <option value="open">Aperte</option>
            <option value="reviewed">Riviste</option>
            <option value="actioned">Con azione</option>
            <option value="dismissed">Archiviate</option>
            <option value="all">Tutte</option>
          </select>
        </label>
      </div>
      {err && <p className="err">{err}</p>}
      {loading ? (
        <p className="muted">Carico le segnalazioni…</p>
      ) : reports.length === 0 ? (
        <p className="hint">
          Nessuna segnalazione. I pulsanti “Segnala” lato utente arriveranno in
          un prossimo step.
        </p>
      ) : (
        reports.map((r) => (
          <div key={r.id} className="report-card">
            <p className="report-head">
              <span className="report-type">
                {REPORT_TARGET_LABEL[r.target_type] ?? r.target_type}
              </span>
              <span className="muted small-inline">
                {new Date(r.created_at).toLocaleString('it-IT')}
              </span>
            </p>
            <p>
              Da <strong>@{r.reporter_nick}</strong>
              {r.target_nick && <> · su <strong>@{r.target_nick}</strong></>}
            </p>
            {r.reason && <p className="report-reason">{r.reason}</p>}
            {r.status === 'open' ? (
              <div className="mod-photo-actions">
                <button
                  type="button"
                  className="btn-approve"
                  onClick={() => resolve(r.id, 'actioned')}
                  disabled={busy === r.id}
                >
                  Azione presa
                </button>
                <button
                  type="button"
                  className="link"
                  onClick={() => resolve(r.id, 'reviewed')}
                  disabled={busy === r.id}
                >
                  Rivista
                </button>
                <button
                  type="button"
                  className="link"
                  onClick={() => resolve(r.id, 'dismissed')}
                  disabled={busy === r.id}
                >
                  Archivia
                </button>
              </div>
            ) : (
              <p className="muted small-inline">Stato: {r.status}</p>
            )}
          </div>
        ))
      )}
    </div>
  )
}

// --- Tab Moderatori (solo admin): assegna / revoca il ruolo ---

function ModeratorManagement() {
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
    return () => {
      alive = false
    }
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
    <div className="mod-list">
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
      {info && <p className="hint">{info}</p>}
      {err && <p className="err">{err}</p>}

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
