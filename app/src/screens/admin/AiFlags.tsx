import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface FlaggedMessage {
  id: number
  body: string
  created_at: string
  sender_nick: string | null
  chatroom_name: string | null
  source: 'chatroom' | 'dm'
}

async function loadFlags(): Promise<FlaggedMessage[]> {
  const [{ data: chatMsgs }, { data: dmMsgs }] = await Promise.all([
    supabase
      .from('messages')
      .select('id, body, created_at, sender_id, chatroom_id')
      .eq('flagged_by_ai', true)
      .eq('ai_flag_archived', false)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('dm_messages')
      .select('id, body, created_at, sender_id')
      .eq('flagged_by_ai', true)
      .eq('ai_flag_archived', false)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const senderIds = [
    ...(chatMsgs ?? []).map((m: { sender_id: string }) => m.sender_id),
    ...(dmMsgs ?? []).map((m: { sender_id: string }) => m.sender_id),
  ]
  const uniqueIds = [...new Set(senderIds)]
  const nickMap: Record<string, string> = {}
  if (uniqueIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname')
      .in('id', uniqueIds)
    for (const p of profiles ?? []) nickMap[(p as { id: string; nickname: string }).id] = (p as { id: string; nickname: string }).nickname
  }

  const chatroomIds = [...new Set((chatMsgs ?? []).map((m: { chatroom_id: string }) => m.chatroom_id))]
  const roomMap: Record<string, string> = {}
  if (chatroomIds.length > 0) {
    const { data: rooms } = await supabase.from('chatrooms').select('id, name').in('id', chatroomIds)
    for (const r of rooms ?? []) roomMap[(r as { id: string; name: string }).id] = (r as { id: string; name: string }).name
  }

  const chat: FlaggedMessage[] = (chatMsgs ?? []).map((m: { id: number; body: string; created_at: string; sender_id: string; chatroom_id: string }) => ({
    id: m.id, body: m.body, created_at: m.created_at,
    sender_nick: nickMap[m.sender_id] ?? null,
    chatroom_name: roomMap[m.chatroom_id] ?? null,
    source: 'chatroom' as const,
  }))
  const dm: FlaggedMessage[] = (dmMsgs ?? []).map((m: { id: number; body: string; created_at: string; sender_id: string }) => ({
    id: m.id, body: m.body, created_at: m.created_at,
    sender_nick: nickMap[m.sender_id] ?? null,
    chatroom_name: null,
    source: 'dm' as const,
  }))
  return [...chat, ...dm].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

async function archiveFlag(id: number, source: 'chatroom' | 'dm') {
  const table = source === 'chatroom' ? 'messages' : 'dm_messages'
  const { error } = await supabase.from(table).update({ ai_flag_archived: true }).eq('id', id)
  if (error) throw error
}

export function AiFlags() {
  const [flags, setFlags] = useState<FlaggedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try { setFlags(await loadFlags()); setErr(null) }
    catch (e) { setErr(e instanceof Error ? e.message : 'Errore.') }
    finally { setLoading(false) }
  }

  useEffect(() => { let alive = true; load().catch(() => {}); return () => { alive = false } }, [])

  async function archive(id: number, source: 'chatroom' | 'dm') {
    setBusy(id); setErr(null)
    try { await archiveFlag(id, source); await load() }
    catch (e) { setErr(e instanceof Error ? e.message : 'Operazione non riuscita.') }
    finally { setBusy(null) }
  }

  return (
    <div className="mod-list">
      {err && <p className="err">{err}</p>}
      {loading ? (
        <p className="muted">Carico i flag AI…</p>
      ) : flags.length === 0 ? (
        <p className="hint">Nessun messaggio flaggato dall'AI.</p>
      ) : (
        flags.map((f) => (
          <div key={`${f.source}-${f.id}`} className="report-card">
            <p className="report-head">
              <span className="report-type">{f.source === 'chatroom' ? 'Chatroom' : 'DM'}</span>
              {f.chatroom_name && <span className="muted"> · #{f.chatroom_name}</span>}
              <span className="muted small-inline"> {new Date(f.created_at).toLocaleString('it-IT')}</span>
            </p>
            {f.sender_nick && <p>Da <strong>@{f.sender_nick}</strong></p>}
            <p className="report-reason">{f.body}</p>
            <div className="report-actions">
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => archive(f.id, f.source)}
                disabled={busy === f.id}
                title="Falso positivo — archivia il flag"
              >
                {busy === f.id ? 'Attendi…' : 'Archivia (falso positivo)'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
