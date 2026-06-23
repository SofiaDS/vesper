import { useEffect, useState } from 'react'
import { getOnlineUsers } from '../lib/presence'

// Ogni quanto ri-chiedere lo stato online degli utenti osservati.
const POLL_MS = 45_000

// Dato un insieme di userId, restituisce quali sono online adesso. Aggiorna su
// montaggio, quando cambia l'insieme di id e a intervalli regolari (lo stato
// online "scade" col tempo lato server). Vuoto finché la migration presenza non
// è applicata.
export function useOnlinePresence(userIds: string[]): Set<string> {
  const [online, setOnline] = useState<Set<string>>(new Set())
  // Chiave stabile: l'effect dipende dal *contenuto* dell'insieme, non
  // dall'identità dell'array (che cambia a ogni render del chiamante).
  const key = [...new Set(userIds)].sort().join(',')

  useEffect(() => {
    const ids = key ? key.split(',') : []
    if (ids.length === 0) { setOnline(new Set()); return }
    let alive = true

    function refresh() {
      getOnlineUsers(ids).then((s) => { if (alive) setOnline(s) }).catch(() => {})
    }
    refresh()
    const timer = setInterval(refresh, POLL_MS)

    return () => { alive = false; clearInterval(timer) }
  }, [key])

  return online
}
