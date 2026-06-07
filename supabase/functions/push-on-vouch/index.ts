// Webhook: vouch_confirmations INSERT → notifica il garante.
// Trigger: Database Webhook su INSERT in public.vouch_confirmations.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@vesper.app',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

type SubRow = { id: string; endpoint: string; p256dh: string; auth_key: string }

async function sendPush(userId: string, title: string, body: string) {
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', userId)
  if (!subs || subs.length === 0) return
  const expired: string[] = []
  await Promise.all(
    (subs as SubRow[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
          JSON.stringify({ title, body, url: '/' }),
        )
      } catch (e: unknown) {
        if ((e as { statusCode?: number }).statusCode === 410) expired.push(s.id)
      }
    }),
  )
  if (expired.length > 0) await admin.from('push_subscriptions').delete().in('id', expired)
}

Deno.serve(async (req: Request): Promise<Response> => {
  const body = await req.json()
  const row = body.record as { request_id: string; guarantor_id: string }

  const { data: vouchReq } = await admin
    .from('vouch_requests')
    .select('new_user_id')
    .eq('id', row.request_id)
    .maybeSingle()
  if (!vouchReq) return new Response('ok')

  const { data: newUser } = await admin
    .from('profiles')
    .select('nickname')
    .eq('id', (vouchReq as { new_user_id: string }).new_user_id)
    .maybeSingle()

  const nick = (newUser as { nickname: string } | null)?.nickname ?? 'Una nuova utente'

  await sendPush(
    row.guarantor_id,
    'Richiesta di garanzia',
    `${nick} ti ha indicata come garante. Apri l'app per rispondere entro 48 ore.`,
  )

  return new Response('ok')
})
