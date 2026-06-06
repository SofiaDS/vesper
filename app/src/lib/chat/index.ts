import { supabase } from '../supabase'

export interface RoomMember {
  id: string
  nickname: string
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
