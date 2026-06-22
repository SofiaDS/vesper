// Stato "ultima lettura" e conteggi non letti (badge Stanze/DM).
// Si appoggia alla tabella read_markers e alle RPC create dalla migration
// 20260622000000_read_markers.sql. Se la migration non è ancora applicata, le
// chiamate falliscono: chi le usa (gli hook) tratta l'errore come "nessun non
// letto", così l'app funziona comunque.

import { supabase } from './supabase'

export type ReadScope = 'room' | 'dm'

export interface RoomUnread {
  unread: number
  hasMention: boolean
}

// Segna una conversazione (stanza o DM) come letta "fino ad adesso".
// Non solleva: una lettura mancata è ininfluente (al massimo un badge resta).
export async function markRead(scope: ReadScope, scopeId: string): Promise<void> {
  await supabase.rpc('mark_read', { p_scope: scope, p_scope_id: scopeId })
}

// Conteggi non letti per stanza (solo le stanze con almeno 1 non letto).
export async function getRoomUnread(): Promise<Map<string, RoomUnread>> {
  const { data, error } = await supabase.rpc('room_unread_counts')
  if (error || !data) return new Map()
  const out = new Map<string, RoomUnread>()
  for (const r of data as { chatroom_id: string; unread: number; has_mention: boolean }[]) {
    out.set(r.chatroom_id, { unread: r.unread, hasMention: r.has_mention })
  }
  return out
}

// Conteggi non letti per conversazione DM (solo quelle con almeno 1 non letto).
export async function getDmUnread(): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc('dm_unread_counts')
  if (error || !data) return new Map()
  const out = new Map<string, number>()
  for (const r of data as { conversation_id: string; unread: number }[]) {
    out.set(r.conversation_id, r.unread)
  }
  return out
}
