import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface AdminPendingCounts {
  verifiche: number
  foto: number
  segnalazioni: number
  ai: number
}

const EMPTY: AdminPendingCounts = { verifiche: 0, foto: 0, segnalazioni: 0, ai: 0 }

function loadCounts(): Promise<AdminPendingCounts> {
  return Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('verification_status', 'pending'),
    supabase.from('profile_photos').select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('reports').select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
    supabase.from('messages').select('id', { count: 'exact', head: true })
      .eq('flagged_by_ai', true)
      .eq('ai_flag_archived', false),
  ]).then(([verifiche, foto, segnalazioni, ai]) => ({
    verifiche: verifiche.count ?? 0,
    foto: foto.count ?? 0,
    segnalazioni: segnalazioni.count ?? 0,
    ai: ai.count ?? 0,
  }))
}

// Conteggi "da revisionare" per le voci di moderazione nel burger menu.
// Live via realtime (come usePendingDmCount): un cambiamento su una delle
// tabelle coinvolte fa ricalcolare i 4 conteggi, così lo staff vede i numeri
// aggiornati subito invece che solo al refresh dell'app. I filtri sui singoli
// valori (es. verification_status=eq.pending) non bastano perché un evento
// "esce dallo stato pending" andrebbe perso: si riascoltano INSERT/UPDATE
// per intero sulle tabelle di moderazione (basso traffico) e solo UPDATE su
// messages, dove il flag AI viene impostato dopo l'inserimento del messaggio.
export function useAdminPendingCounts(enabled: boolean): AdminPendingCounts {
  const [counts, setCounts] = useState<AdminPendingCounts>(EMPTY)
  const active = useRef(true)

  useEffect(() => {
    if (!enabled) { setCounts(EMPTY); return }
    active.current = true

    function refresh() {
      loadCounts().then((c) => { if (active.current) setCounts(c) }).catch(() => {})
    }

    refresh()

    const ch = supabase
      .channel('admin_pending_counts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profile_photos' }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profile_photos' }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports' }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, refresh)
      .subscribe()

    return () => {
      active.current = false
      supabase.removeChannel(ch)
    }
  }, [enabled])

  return counts
}
