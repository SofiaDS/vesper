import { useRef } from 'react'
import { supabase } from '../lib/supabase'
import { listBlockedIds } from '../lib/blocks'

export interface AvatarData {
  preset: string | null
  color: string | null
}

export function useChatCache() {
  const nicknameCache = useRef<Map<string, string>>(new Map())
  const avatarCache   = useRef<Map<string, AvatarData>>(new Map())
  const blockedIds    = useRef<Set<string>>(new Set())

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
      .select('id, nickname, avatar_preset, accent_color')
      .in('id', missing)
    for (const p of (profs ?? []) as {
      id: string
      nickname: string
      avatar_preset: string | null
      accent_color: string | null
    }[]) {
      nicknameCache.current.set(p.id, p.nickname)
      avatarCache.current.set(p.id, { preset: p.avatar_preset, color: p.accent_color })
    }
  }

  async function resolveNickname(senderId: string): Promise<string> {
    const cached = nicknameCache.current.get(senderId)
    if (cached) return cached
    const { data } = await supabase
      .from('public_profiles')
      .select('nickname, avatar_preset, accent_color')
      .eq('id', senderId)
      .maybeSingle()
    const nick = (data as { nickname: string } | null)?.nickname ?? '—'
    nicknameCache.current.set(senderId, nick)
    avatarCache.current.set(senderId, {
      preset: (data as { avatar_preset: string | null } | null)?.avatar_preset ?? null,
      color:  (data as { accent_color: string | null } | null)?.accent_color ?? null,
    })
    return nick
  }

  return { nicknameCache, avatarCache, blockedIds, loadBlockedIds, cacheNicknames, resolveNickname }
}
