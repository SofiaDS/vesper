import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { countPendingDmRequests } from '../lib/dm'

export function usePendingDmCount(userId: string | undefined): number {
  const [count, setCount] = useState(0)
  const active = useRef(true)

  useEffect(() => {
    if (!userId) { setCount(0); return }
    active.current = true

    function refresh() {
      countPendingDmRequests(userId!)
        .then((n) => { if (active.current) setCount(n) })
        .catch(() => {})
    }

    refresh()

    const ch = supabase
      .channel(`pending_dm_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_conversations',
        filter: `to_user_id=eq.${userId}`,
      }, refresh)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'dm_conversations',
        filter: `to_user_id=eq.${userId}`,
      }, refresh)
      .subscribe()

    return () => {
      active.current = false
      supabase.removeChannel(ch)
    }
  }, [userId])

  return count
}
