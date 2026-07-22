// Messaggi privati 1:1 (DM) — accessibili da Strato 2 (permessi_e_strati.md §1).
// La destinataria deve accettare la richiesta prima che i messaggi possano fluire.

import { supabase } from '../supabase'
import { isBlocked } from '../blocks'

export interface DmConversation {
  id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  other_nickname: string
  other_avatar: string | null
  other_accent: string | null
}

export interface DmMessage {
  id: number
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  reply_to_id: number | null
}

const DM_PAGE_SIZE = 50

// In v1 il filtro DM avanzato (citta/intenti/verificatə) non è ancora applicato:
// la struttura è qui per uso futuro (permessi_e_strati.md §1.1).
export async function checkDmFilter(_toUserId: string): Promise<boolean> {
  return true
}

export async function sendDmRequest(
  fromUserId: string,
  toUserId: string,
): Promise<DmConversation> {
  await checkDmFilter(toUserId)

  const { data, error } = await supabase
    .from('dm_conversations')
    .insert({ from_user_id: fromUserId, to_user_id: toUserId })
    .select('id, from_user_id, to_user_id, status, created_at, updated_at')
    .single()
  if (error) {
    if (error.code === '23505') throw new Error('Hai già una conversazione con questa utente.')
    throw error
  }
  return {
    ...(data as Omit<DmConversation, 'other_nickname' | 'other_avatar' | 'other_accent'>),
    other_nickname: '',
    other_avatar: null,
    other_accent: null,
  }
}

export async function acceptDmRequest(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('dm_conversations')
    .update({ status: 'accepted' })
    .eq('id', conversationId)
  if (error) throw error
}

export async function rejectDmRequest(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('dm_conversations')
    .update({ status: 'rejected' })
    .eq('id', conversationId)
  if (error) throw error
}

export async function listDmConversations(userId: string): Promise<DmConversation[]> {
  const { data, error } = await supabase
    .from('dm_conversations')
    .select('id, from_user_id, to_user_id, status, created_at, updated_at')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .neq('status', 'rejected')
    .order('updated_at', { ascending: false })
  if (error) throw error

  const rows = (data ?? []) as Omit<
    DmConversation,
    'other_nickname' | 'other_avatar' | 'other_accent'
  >[]
  const otherIds = rows.map((r) =>
    r.from_user_id === userId ? r.to_user_id : r.from_user_id,
  )
  const uniq = [...new Set(otherIds)].filter(Boolean)
  if (uniq.length === 0) return []

  const { data: profs } = await supabase
    .from('public_profiles')
    .select('id, nickname, avatar_preset, accent_color')
    .in('id', uniq)

  const profMap: Record<
    string,
    { nickname: string; avatar_preset: string | null; accent_color: string | null }
  > = {}
  for (const p of (profs ?? []) as {
    id: string
    nickname: string
    avatar_preset: string | null
    accent_color: string | null
  }[]) {
    profMap[p.id] = {
      nickname: p.nickname,
      avatar_preset: p.avatar_preset,
      accent_color: p.accent_color,
    }
  }

  return rows.map((r) => {
    const other = profMap[r.from_user_id === userId ? r.to_user_id : r.from_user_id]
    return {
      ...r,
      other_nickname: other?.nickname ?? '—',
      other_avatar: other?.avatar_preset ?? null,
      other_accent: other?.accent_color ?? null,
    }
  })
}

export async function getDmMessages(
  conversationId: string,
  before?: string,
): Promise<DmMessage[]> {
  let q = supabase
    .from('dm_messages')
    .select('id, conversation_id, sender_id, body, created_at, reply_to_id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(DM_PAGE_SIZE)

  if (before) q = q.lt('created_at', before)

  const { data, error } = await q
  if (error) throw error
  return ((data ?? []) as DmMessage[]).reverse()
}

// Trova la conversazione DM (in qualunque stato) tra l'utente corrente e
// un'altra persona, se esiste.
export async function findDmConversation(
  userId: string,
  otherUserId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('dm_conversations')
    .select('id')
    .or(
      `and(from_user_id.eq.${userId},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${userId})`,
    )
    .maybeSingle()
  if (error) throw error
  return (data as { id: string } | null)?.id ?? null
}

// Cancella una conversazione DM (e i suoi messaggi, in cascata) per entrambe.
export async function deleteDmConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('dm_conversations')
    .delete()
    .eq('id', conversationId)
  if (error) throw error
}

export async function countPendingDmRequests(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('dm_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('to_user_id', userId)
    .eq('status', 'pending')
  if (error) throw error
  return count ?? 0
}

export async function sendDmMessage(
  conversationId: string,
  senderId: string,
  body: string,
  receiverId?: string,
  replyToId?: number | null,
): Promise<DmMessage> {
  if (receiverId && (await isBlocked(receiverId))) {
    throw new Error('Non puoi inviare messaggi a questa utente.')
  }
  const { data, error } = await supabase
    .from('dm_messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body, reply_to_id: replyToId ?? null })
    .select('id, conversation_id, sender_id, body, created_at, reply_to_id')
    .single()
  if (error) throw error
  return data as DmMessage
}
