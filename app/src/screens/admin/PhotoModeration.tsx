import { useEffect, useState } from 'react'
import {
  listPendingPhotos,
  moderatePhoto,
  type PendingPhoto,
} from '../../lib/admin'

export function PhotoModeration() {
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
    return () => { alive = false }
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
