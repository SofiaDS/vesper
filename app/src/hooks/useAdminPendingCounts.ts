import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface AdminPendingCounts {
  verifiche: number
  foto: number
  segnalazioni: number
  ai: number
}

const EMPTY: AdminPendingCounts = { verifiche: 0, foto: 0, segnalazioni: 0, ai: 0 }

// Conteggi "da revisionare" per le voci di moderazione nel burger menu.
// Caricati una volta quando lo staff entra in sessione (niente realtime: sono
// numeri di servizio per il menu, non un contatore da tenere live al secondo).
export function useAdminPendingCounts(enabled: boolean): AdminPendingCounts {
  const [counts, setCounts] = useState<AdminPendingCounts>(EMPTY)

  useEffect(() => {
    if (!enabled) { setCounts(EMPTY); return }
    let alive = true
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .eq('verification_status', 'pending'),
      supabase.from('profile_photos').select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase.from('reports').select('id', { count: 'exact', head: true })
        .eq('status', 'open'),
      supabase.from('messages').select('id', { count: 'exact', head: true })
        .eq('flagged_by_ai', true)
        .eq('ai_flag_archived', false),
    ]).then(([verifiche, foto, segnalazioni, ai]) => {
      if (!alive) return
      setCounts({
        verifiche: verifiche.count ?? 0,
        foto: foto.count ?? 0,
        segnalazioni: segnalazioni.count ?? 0,
        ai: ai.count ?? 0,
      })
    }).catch(() => {})
    return () => { alive = false }
  }, [enabled])

  return counts
}
