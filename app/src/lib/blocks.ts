// Blocco utente one-directional: io blocco una persona e non vedo piu' i suoi
// messaggi. La tabella user_blocks ha RLS own-only (vedo/gestisco solo i miei
// blocchi); la persona bloccata non sa di esserlo.
import { supabase } from './supabase'

export async function listBlockedIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
  if (error) throw error
  return new Set(
    ((data as { blocked_id: string }[]) ?? []).map((r) => r.blocked_id),
  )
}

export async function isBlocked(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocked_id', userId)
    .maybeSingle()
  return Boolean(data)
}

export async function blockUser(userId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato.')
  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: user.id, blocked_id: userId })
  // 23505 = gia' bloccato (race): lo trattiamo come successo.
  if (error && error.code !== '23505') throw error
}

export async function unblockUser(userId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato.')
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', userId)
  if (error) throw error
}

// --- Elenco dei propri bloccati con nickname (per la schermata di gestione) ---
export interface BlockedUser {
  id: string
  nickname: string
}

export async function listBlockedUsers(): Promise<BlockedUser[]> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = (data as { blocked_id: string }[]) ?? []
  const ids = rows.map((r) => r.blocked_id)
  if (ids.length === 0) return []
  const { data: profs } = await supabase
    .from('public_profiles')
    .select('id, nickname')
    .in('id', ids)
  const names: Record<string, string> = {}
  for (const p of (profs as { id: string; nickname: string }[]) ?? [])
    names[p.id] = p.nickname
  return rows.map((r) => ({
    id: r.blocked_id,
    nickname: names[r.blocked_id] ?? '—',
  }))
}
