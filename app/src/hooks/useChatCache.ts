import { useRef } from 'react'
import { supabase } from '../lib/supabase'
import { listBlockedIds } from '../lib/blocks'

export function useChatCache() {
  const nicknameCache = useRef<Map<string, string>>(new Map())
  const blockedIds = useRef<Set<string>>(new Set())

  async function loadBlockedIds(): Promise<void> {
    try {
      blockedIds.current = await listBlockedIds()
    } catch {
      blockedIds.current = new Set()
    }
  }

  async function cacheNicknames(senderIds: string[]): Promise<void> {
    const missing = senderIds.filter((id) => !nicknameCache.current.has(id))
    if (missing.length === 0) return
    const { data: profs } = await supabase
      .from('public_profiles')
      .select('id, nickname')
      .in('id', missing)
    for (const p of profs ?? []) {
      nicknameCache.current.set(p.id, p.nickname)
    }
  }

  async function resolveNickname(senderId: string): Promise<string> {
    const cached = nicknameCache.current.get(senderId)
    if (cached) return cached
    const { data } = await supabase
      .from('public_profiles')
      .select('nickname')
      .eq('id', senderId)
      .maybeSingle()
    const nick = data?.nickname ?? '—'
    nicknameCache.current.set(senderId, nick)
    return nick
  }

  return { nicknameCache, blockedIds, loadBlockedIds, cacheNicknames, resolveNickname }
}
