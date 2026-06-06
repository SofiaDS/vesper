// Webhook: messages INSERT → notifica le iscritte alla stanza (esclusa la mittente).
// Per le stanze di tipo 'foyer' non ci sono iscrizioni → nessuna notifica.
import { sendPushToUser, supabaseAdmin } from '../_shared/push.ts'

Deno.serve(async (req: Request): Promise<Response> => {
  const body = await req.json()
  const msg = body.record as {
    chatroom_id: string
    sender_id: string
    body: string
  }

  // Recupera nome stanza e tipo
  const { data: room } = await supabaseAdmin
    .from('chatrooms')
    .select('name, kind')
    .eq('id', msg.chatroom_id)
    .maybeSingle()

  if (!room) return new Response('ok')

  // Le stanze tematiche hanno iscrizioni; il foyer no
  let recipientIds: string[] = []

  if ((room as { kind: string }).kind === 'tematica') {
    const { data: members } = await supabaseAdmin
      .from('chat_membership')
      .select('user_id')
      .eq('chatroom_id', msg.chatroom_id)
      .neq('user_id', msg.sender_id)

    recipientIds = ((members ?? []) as { user_id: string }[]).map((m) => m.user_id)
  }

  if (recipientIds.length === 0) return new Response('ok')

  const { data: sender } = await supabaseAdmin
    .from('profiles')
    .select('nickname')
    .eq('id', msg.sender_id)
    .maybeSingle()

  const nick = (sender as { nickname: string } | null)?.nickname ?? '—'
  const roomName = (room as { name: string }).name

  await Promise.all(
    recipientIds.map((uid) =>
      sendPushToUser(uid, {
        title: `${roomName} — @${nick}`,
        body: msg.body.slice(0, 120),
        url: `/room/${msg.chatroom_id}`,
      }),
    ),
  )

  return new Response('ok')
})
