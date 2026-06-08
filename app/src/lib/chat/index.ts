import { supabase } from '../supabase'

export interface RoomMember {
  id: string
  nickname: string
}

// Menzione "@nickname" in corso di digitazione subito prima del cursore
// (usata dall'autocomplete del composer). Si interrompe a spazio/a-capo.
export interface MentionTrigger {
  start: number
  query: string
}

export function matchMentionTrigger(text: string, caret: number): MentionTrigger | null {
  const head = text.slice(0, caret)
  const at = head.lastIndexOf('@')
  if (at === -1) return null
  const query = head.slice(at + 1)
  if (/[\s@]/.test(query)) return null
  return { start: at, query }
}

// Sostituisce la menzione in corso con "@nickname " e riposiziona il cursore.
export function applyMention(
  text: string,
  trigger: MentionTrigger,
  nickname: string,
): { text: string; caret: number } {
  const before = text.slice(0, trigger.start)
  const after = text.slice(trigger.start + 1 + trigger.query.length)
  const inserted = `@${nickname} `
  return { text: before + inserted + after, caret: (before + inserted).length }
}

export async function getRoomMembers(roomId: string): Promise<RoomMember[]> {
  const { data: memRows, error: memErr } = await supabase
    .from('chat_membership')
    .select('user_id')
    .eq('chatroom_id', roomId)
  if (memErr) throw memErr

  const ids = (memRows ?? []).map((r: { user_id: string }) => r.user_id)
  if (ids.length === 0) return []

  const { data: profiles, error: profErr } = await supabase
    .from('public_profiles')
    .select('id, nickname')
    .in('id', ids)
  if (profErr) throw profErr

  return (profiles ?? []) as RoomMember[]
}
