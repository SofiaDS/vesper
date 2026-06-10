import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Stats {
  totalUsers: number
  newLast7d: number
  pendingVerifications: number
  openReports: number
  reviewedReports: number
  flaggedAi: number
}

async function loadStats(): Promise<Stats> {
  const [
    { count: totalUsers },
    { count: newLast7d },
    { count: pendingVerifications },
    { count: openReports },
    { count: reviewedReports },
    { count: flaggedAi },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86_400_000).toISOString()),
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('verification_status', 'pending'),
    supabase.from('reports').select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
    supabase.from('reports').select('id', { count: 'exact', head: true })
      .eq('status', 'reviewed'),
    supabase.from('messages').select('id', { count: 'exact', head: true })
      .eq('flagged_by_ai', true)
      .eq('ai_flag_archived', false),
  ])
  return {
    totalUsers: totalUsers ?? 0,
    newLast7d: newLast7d ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
    openReports: openReports ?? 0,
    reviewedReports: reviewedReports ?? 0,
    flaggedAi: flaggedAi ?? 0,
  }
}

function StatRow({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className={warn && value > 0 ? 'stat-value warn' : 'stat-value'}>{value}</span>
    </div>
  )
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadStats()
      .then((s) => alive && setStats(s))
      .catch((e) => alive && setErr(e instanceof Error ? e.message : 'Errore nel caricamento.'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  if (loading) return <p className="muted">Carico le statistiche…</p>
  if (err) return <p className="err" role="alert">{err}</p>
  if (!stats) return null

  return (
    <div className="mod-list stats-panel">
      <div className="stats-section box-shadow">
        <h3 className="stats-title">Utenti</h3>
        <StatRow label="Totale iscritte" value={stats.totalUsers} />
        <StatRow label="Nuove (ultimi 7gg)" value={stats.newLast7d} />
        <StatRow label="Verifiche in attesa" value={stats.pendingVerifications} warn />
      </div>
      <div className="stats-section box-shadow">
        <h3 className="stats-title">Moderazione</h3>
        <StatRow label="Segnalazioni aperte" value={stats.openReports} warn />
        <StatRow label="In revisione (secondo parere)" value={stats.reviewedReports} warn />
        <StatRow label="Flag AI da esaminare" value={stats.flaggedAi} warn />
      </div>
    </div>
  )
}
