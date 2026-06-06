import { useEffect, useRef, useState } from 'react'
import { getRoomMembers, type RoomMember } from '../lib/chat'
import type { RoomKind } from '../types'

export function useChatMembers(roomId: string, kind: RoomKind): RoomMember[] {
  const [members, setMembers] = useState<RoomMember[]>([])
  const active = useRef(true)

  useEffect(() => {
    if (kind !== 'tematica') return
    active.current = true
    getRoomMembers(roomId)
      .then((m) => { if (active.current) setMembers(m) })
      .catch(() => {})
    return () => { active.current = false }
  }, [roomId, kind])

  return members
}
