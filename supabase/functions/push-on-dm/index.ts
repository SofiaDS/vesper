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

  const nick = (sender as { nickname: string } | null)?.nickname ?? '—'
  const preview = msg.body.slice(0, 120)

  await sendPushToUser(recipientId, {
    title: `Messaggio da @${nick}`,
    body: preview,
    // Query param sulla root: la "/" risponde sempre 200 (niente rewrite SPA).
    // `c` porta la conversazione: senza, il tap apriva solo l'elenco "Messaggi"
    // e toccava ritrovare la chat a mano.
    url: `/?dm=1&c=${msg.conversation_id}`,
    // Il service worker la scarta se la sezione "Messaggi" è già aperta e in
    // primo piano: la stai leggendo, la notifica sarebbe rumore. L'id serve a
    // raggruppare per conversazione: messaggi da persone diverse restano
    // notifiche separate.
    source: { kind: 'dm', id: msg.conversation_id, label: `@${nick}` },
    // In un 1 a 1 il mittente è sempre lo stesso: ripeterlo a ogni riga
    // sarebbe rumore, basta il testo.
    line: preview,
  })

  return new Response('ok')
})
