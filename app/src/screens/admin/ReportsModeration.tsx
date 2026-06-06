import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import {
  listReports,
  resolveReport,
  type ReportRow,
  type ReportStatus,
} from '../../lib/admin'
import {
  applyReputationEvent,
  REPUTATION_EVENTS,
  type ReputationEventType,
} from '../../lib/reputation'

const REPORT_TARGET_LABEL: Record<string, string> = {
  user:    'Utente',
  message: 'Messaggio',
  photo:   'Foto',
}

const REPORT_STATUS_LABEL: Record<string, string> = {
  actioned: 'Confermata',
  dismissed: 'Rigettata',
  reviewed: 'In revisione',
}

const REP_EVENT_LABELS: Record<ReputationEventType, string> = {
  warning:   'Warning (−1)',
  mute_temp: 'Mute (−3)',
}

interface PendingRep {
  reportId: string
  targetUserId: string
  targetNick: string
}

export function ReportsModeration() {
  const { session } = useAuth()
  const [filter, setFilter] = useState<ReportStatus | 'all'>('open')
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // Dopo aver segnato un report come "actioned", chiede se registrare un evento reputazione
  const [pendingRep, setPendingRep] = useState<PendingRep | null>(null)
  const [repBusy, setRepBusy] = useState(false)
  const [repErr, setRepErr] = useState<string | null>(null)

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
    return () => { alive = false }
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

      // Dopo "Azione presa", propone di registrare un evento di reputazione
      if (status === 'actioned') {
        const report = reports.find((r) => r.id === id)
        if (report?.target_user_id) {
          setPendingRep({
            reportId:     id,
            targetUserId: report.target_user_id,
            targetNick:   report.target_nick ?? '—',
          })
        }
      }

      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Operazione non riuscita.')
    } finally {
      setBusy(null)
    }
  }

  async function applyRep(type: ReputationEventType) {
    if (!pendingRep || !session?.user) return
    setRepBusy(true)
    setRepErr(null)
    try {
      await applyReputationEvent(
        pendingRep.targetUserId,
        type,
        session.user.id,
        pendingRep.reportId,
      )
      setPendingRep(null)
    } catch (e) {
      setRepErr(e instanceof Error ? e.message : 'Errore nel registrare l\'evento.')
    } finally {
      setRepBusy(false)
    }
  }

  return (
    <div className="mod-list">
      {/* Prompt reputazione — appare dopo aver segnato un report come "actioned" */}
      {pendingRep && (
        <div className="rep-prompt">
          <p className="rep-prompt-title">
            Registra evento di reputazione per <strong>@{pendingRep.targetNick}</strong>?
          </p>
          <div className="rep-prompt-actions">
            {(Object.keys(REPUTATION_EVENTS) as ReputationEventType[]).map((t) => (
              <button
                key={t}
                type="button"
                className="btn-primary btn-sm"
                onClick={() => applyRep(t)}
                disabled={repBusy}
              >
                {REP_EVENT_LABELS[t]}
              </button>
            ))}
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => setPendingRep(null)}
              disabled={repBusy}
            >
              Salta
            </button>
          </div>
          {repErr && <p className="err">{repErr}</p>}
        </div>
      )}

      <div className="admin-filter">
        <label>
          Stato:{' '}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ReportStatus | 'all')}
          >
            <option value="open">Aperte</option>
            <option value="reviewed">In revisione</option>
            <option value="actioned">Confermate</option>
            <option value="dismissed">Rigettate</option>
            <option value="all">Tutte</option>
          </select>
        </label>
      </div>

      {err && <p className="err">{err}</p>}

      {loading ? (
        <p className="muted">Carico le segnalazioni…</p>
      ) : reports.length === 0 ? (
        <p className="hint">Nessuna segnalazione.</p>
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
              <div className="report-actions">
                <button
                  type="button"
                  className="btn-approve"
                  onClick={() => resolve(r.id, 'actioned')}
                  disabled={busy === r.id}
                  title="Violazione confermata — verrà applicata un'azione"
                >
                  {busy === r.id ? 'Attendi…' : 'Conferma segnalazione'}
                </button>
                <button
                  type="button"
                  className="btn-reject"
                  onClick={() => resolve(r.id, 'dismissed')}
                  disabled={busy === r.id}
                  title="Nessuna violazione riscontrata — segnalazione archiviata"
                >
                  Rigetta segnalazione
                </button>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => resolve(r.id, 'reviewed')}
                  disabled={busy === r.id}
                  title="Caso borderline o grave — richiede secondo parere"
                >
                  Richiedi ulteriore verifica
                </button>
              </div>
            ) : (
              <p className="muted small-inline">
                {REPORT_STATUS_LABEL[r.status] ?? r.status}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  )
}
