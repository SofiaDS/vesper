// Reazioni emoji ai messaggi — condiviso tra chat di gruppo (message_reactions)
// e DM (dm_message_reactions): stesse operazioni, tabella e colonna di
// scoping diverse, esattamente come messages/dm_messages.

import { supabase } from '../supabase'

export type ReactionScope = 'room' | 'dm'

export interface MessageReaction {
  message_id: number
  user_id: string
  emoji: string
}

const TABLE: Record<ReactionScope, string> = {
  room: 'message_reactions',
  dm: 'dm_message_reactions',
}

const SCOPE_COLUMN: Record<ReactionScope, 'chatroom_id' | 'conversation_id'> = {
  room: 'chatroom_id',
  dm: 'conversation_id',
}

export function reactionTable(scope: ReactionScope): string {
  return TABLE[scope]
}

export function reactionScopeColumn(scope: ReactionScope): 'chatroom_id' | 'conversation_id' {
  return SCOPE_COLUMN[scope]
}

export async function listReactions(scope: ReactionScope, scopeId: string): Promise<MessageReaction[]> {
  const { data, error } = await supabase
    .from(TABLE[scope])
    .select('message_id, user_id, emoji')
    .eq(SCOPE_COLUMN[scope], scopeId)
  if (error) throw error
  return (data ?? []) as MessageReaction[]
}

export async function addReaction(
  scope: ReactionScope,
  scopeId: string,
  messageId: number,
  userId: string,
  emoji: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE[scope])
    .insert({ message_id: messageId, [SCOPE_COLUMN[scope]]: scopeId, user_id: userId, emoji })
  // 23505 = reazione già presente (vincolo unique): nessun problema, è già nello stato voluto.
  if (error && error.code !== '23505') throw error
}

export async function removeReaction(
  scope: ReactionScope,
  messageId: number,
  userId: string,
  emoji: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE[scope])
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
  if (error) throw error
}
