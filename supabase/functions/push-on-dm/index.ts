// Webhook: dm_messages INSERT → notifica la destinataria del messaggio.
import { sendPushToUser, supabaseAdmin } from '../_shared/push.ts'
import { isTrustedWebhook, unauthorized } from '../_shared/webhookAuth.ts'

Deno.serve(async (req: Request): Promise<Response> => {
  if (!isTrustedWebhook(req)) return unauthorized()

  let body: { record?: unknown }
  try {
    body = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  const msg = body.record as {
    conversation_id: string
    sender_id: string
    body: string
  }

  // Trova la conversazione per sapere chi riceve
  const { data: conv } = await supabaseAdmin
    .from('dm_conversations')
    .select('from_user_id, to_user_id')
    .eq('id', msg.conversation_id)
    .maybeSingle()

  if (!conv) return new Response('ok')

  const recipientId =
    conv.from_user_id === msg.sender_id ? conv.to_user_id : conv.from_user_id

  // Nickname mittente
  const { data: sender } = await supabaseAdmin
    .from('profiles')
    .select('nickname')
    .eq('id', msg.sender_id)
    .maybeSingle()

  await sendPushToUser(recipientId, {
    title: `Messaggio da @${(sender as { nickname: string } | null)?.nickname ?? '—'}`,
    body: msg.body.slice(0, 120),
    url: '/dm',
  })

  return new Response('ok')
})
