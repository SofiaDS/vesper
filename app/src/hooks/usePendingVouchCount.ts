import { useCallback, useEffect, useRef, useState } from 'react'
import { getPendingVouchRequests } from '../lib/vouching'

// Quante richieste di garanzia sono in attesa di una risposta da parte mia.
//
// Niente subscribe realtime, a differenza di useUnreadCounts & co.:
// `vouch_confirmations` non è nella pubblicazione `supabase_realtime`, quindi
// un canale postgres_changes non riceverebbe mai nulla e darebbe la falsa
// impressione di un contatore che si aggiorna da solo. Il conteggio si carica
// al mount e si rinfresca su richiesta (`refresh`), che la schermata chiama
// dopo ogni risposta. Le richieste scadono in 48 ore: un badge che si aggiorna
// all'apertura dell'app è abbastanza tempestivo.
export function usePendingVouchCount(userId: string | undefined): {
  count: number
  refresh: () => void
} {
  const [count, setCount] = useState(0)
  const active = useRef(true)

  const refresh = useCallback(() => {
    if (!userId) {
      setCount(0)
      return
    }
    getPendingVouchRequests()
      .then((list) => {
        if (active.current) setCount(list.length)
      })
      .catch(() => {})
  }, [userId])

  useEffect(() => {
    active.current = true
    refresh()
    return () => {
      active.current = false
    }
  }, [refresh])

  return { count, refresh }
}
