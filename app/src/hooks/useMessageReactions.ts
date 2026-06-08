import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  addReaction,
  listReactions,
  reactionScopeColumn,
  reactionTable,
  removeReaction,
  type MessageReaction,
  type ReactionScope,
} from '../lib/reactions'

interface Options {
  scope: ReactionScope
  scopeId: string
  myId: string | undefined
}

function sameReaction(a: MessageReaction, b: MessageReaction): boolean {
  return a.message_id === b.message_id && a.user_id === b.user_id && a.emoji === b.emoji
}

// Stato condiviso delle reazioni emoji per una stanza o una conversazione DM:
// caricamento iniziale, sincronizzazione realtime e toggle ottimistico.
// Usato sia da ChatScreen che da DmScreen (stesso pattern di useChatRealtime).
export function useMessageReactions({ scope, scopeId, myId }: Options) {
  const [reactions, setReactions] = useState<MessageReaction[]>([])
  const table = reactionTable(scope)
  const column = reactionScopeColumn(scope)

  useEffect(() => {
    let alive = true
    setReactions([])
    listReactions(scope, scopeId)
      .then((rows) => { if (alive) setReactions(rows) })
      .catch(() => {})
    return () => { alive = false }
  }, [scope, scopeId])

  useEffect(() => {
    const channel = supabase
      .channel(`${table}:${scopeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table, filter: `${column}=eq.${scopeId}` },
        (payload) => {
          const r = payload.new as MessageReaction
          setReactions((prev) => (prev.some((x) => sameReaction(x, r)) ? prev : [...prev, r]))
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table, filter: `${column}=eq.${scopeId}` },
        (payload) => {
          const r = payload.old as MessageReaction
          setReactions((prev) => prev.filter((x) => !sameReaction(x, r)))
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [scope, scopeId, table, column])

  function forMessage(messageId: number): MessageReaction[] {
    return reactions.filter((r) => r.message_id === messageId)
  }

  async function toggle(messageId: number, emoji: string) {
    if (!myId) return
    const mine: MessageReaction = { message_id: messageId, user_id: myId, emoji }
    const hasIt = reactions.some((r) => sameReaction(r, mine))

    setReactions((prev) =>
      hasIt ? prev.filter((r) => !sameReaction(r, mine)) : [...prev, mine],
    )
    try {
      if (hasIt) await removeReaction(scope, messageId, myId, emoji)
      else await addReaction(scope, scopeId, messageId, myId, emoji)
    } catch {
      setReactions((prev) =>
        hasIt
          ? (prev.some((r) => sameReaction(r, mine)) ? prev : [...prev, mine])
          : prev.filter((r) => !sameReaction(r, mine)),
      )
    }
  }

  return { forMessage, toggle }
}
