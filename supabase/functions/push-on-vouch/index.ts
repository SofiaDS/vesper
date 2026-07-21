// Webhook: vouch_confirmations INSERT → notifica il garante.
// Trigger: Database Webhook su INSERT in public.vouch_confirmations.
// L'invio e la pulizia degli endpoint morti vivono in _shared/push.ts.
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
  const row = body.record as { request_id: string; guarantor_id: string }

  const { data: vouchReq } = await supabaseAdmin
    .from('vouch_requests')
    .select('new_user_id')
    .eq('id', row.request_id)
    .maybeSingle()
  if (!vouchReq) return new Response('ok')

  const { data: newUser } = await supabaseAdmin
    .from('profiles')
    .select('nickname')
    .eq('id', (vouchReq as { new_user_id: string }).new_user_id)
    .maybeSingle()

  const nick = (newUser as { nickname: string } | null)?.nickname ?? 'Una nuova utente'

  await sendPushToUser(row.guarantor_id, {
    title: 'Richiesta di garanzia',
    body: `${nick} ti ha indicata come garante. Apri l'app per rispondere entro 48 ore.`,
  })

  return new Response('ok')
})
