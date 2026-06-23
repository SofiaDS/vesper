// Presenza online (approccio last_seen, vedi migration 20260623000000).
// touchLastSeen(): heartbeat del proprio stato. getOnlineUsers(): chiede quali
// fra un insieme di utenti sono online (e hanno show_online attivo). Se la
// migration non è applicata, le chiamate falliscono e chi le usa tratta il
// risultato come "nessuno online", così l'app funziona comunque.

import { supabase } from './supabase'

// Segna l'utente corrente come attivo adesso.
export async function touchLastSeen(): Promise<void> {
  await supabase.rpc('touch_last_seen')
}

// Sottoinsieme di `ids` attualmente online e visibili.
export async function getOnlineUsers(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set()
  const { data, error } = await supabase.rpc('users_online', { p_ids: ids })
  if (error || !data) return new Set()
  return new Set((data as { user_id: string }[]).map((r) => r.user_id))
}
