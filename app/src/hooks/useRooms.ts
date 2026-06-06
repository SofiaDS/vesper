import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MAX_TEMATICHE } from '../constants/limits'
import type { Chatroom } from '../types'

export function useRooms(myId: string | undefined) {
  const [rooms, setRooms] = useState<Chatroom[]>([])
  const [joined, setJoined] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyRoom, setBusyRoom] = useState<string | null>(null)
  const active = useRef(true)

  async function load() {
    const [{ data: roomRows, error: roomErr }, { data: memRows }] =
      await Promise.all([
        supabase
          .from('chatrooms')
          .select('id, slug, name, description, kind')
          .order('kind', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase.from('chat_membership').select('chatroom_id'),
      ])

    if (!active.current) return
    if (roomErr) {
      setError(roomErr.message)
      setLoading(false)
      return
    }
    const sorted = (roomRows ?? []).slice().sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'foyer' ? -1 : 1
      return a.name.localeCompare(b.name, 'it')
    })
    setRooms(sorted as Chatroom[])
    setJoined(new Set((memRows ?? []).map((m) => m.chatroom_id as string)))
    setLoading(false)
  }

  useEffect(() => {
    active.current = true
    load()
    return () => { active.current = false }
  }, [])

  const tematicheJoined = rooms.filter(
    (r) => r.kind === 'tematica' && joined.has(r.id),
  ).length
  const capReached = tematicheJoined >= MAX_TEMATICHE

  async function handleJoin(room: Chatroom) {
    if (!myId || busyRoom) return
    setBusyRoom(room.id)
    setError(null)
    try {
      const { error: insErr } = await supabase
        .from('chat_membership')
        .insert({ user_id: myId, chatroom_id: room.id })
      // 23505 = già iscritta (race): trattiamo come successo.
      if (insErr && insErr.code !== '23505') throw insErr
      setJoined((prev) => new Set(prev).add(room.id))
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        msg.includes('Limite di 3')
          ? 'Hai raggiunto il limite di 3 stanze tematiche.'
          : 'Iscrizione non riuscita. Riprova.',
      )
    } finally {
      setBusyRoom(null)
    }
  }

  async function handleLeave(room: Chatroom) {
    if (!myId || busyRoom) return
    setBusyRoom(room.id)
    setError(null)
    try {
      const { error: delErr } = await supabase
        .from('chat_membership')
        .delete()
        .eq('user_id', myId)
        .eq('chatroom_id', room.id)
      if (delErr) throw delErr
      setJoined((prev) => {
        const next = new Set(prev)
        next.delete(room.id)
        return next
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        msg.includes('Foyer')
          ? 'La Foyer non può essere abbandonata.'
          : 'Operazione non riuscita. Riprova.',
      )
    } finally {
      setBusyRoom(null)
    }
  }

  return {
    rooms,
    joined,
    loading,
    error,
    busyRoom,
    tematicheJoined,
    capReached,
    handleJoin,
    handleLeave,
  }
}
