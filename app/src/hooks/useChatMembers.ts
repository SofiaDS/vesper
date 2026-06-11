import { useEffect, useRef, useState } from 'react'
import { getRoomMembers, type RoomMember } from '../lib/chat'

export function useChatMembers(roomId: string): RoomMember[] {
  const [members, setMembers] = useState<RoomMember[]>([])
  const active = useRef(true)

  useEffect(() => {
    active.current = true
    getRoomMembers(roomId)
      .then((m) => { if (active.current) setMembers(m) })
      .catch(() => {})
    return () => { active.current = false }
  }, [roomId])

  return members
}
