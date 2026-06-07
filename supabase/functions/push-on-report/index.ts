// Webhook: reports UPDATE → notifica il reporter quando la segnalazione è chiusa.
// Trigger: Database Webhook su UPDATE in public.reports, eventi: update.
// Il payload è vago: nessun dettaglio sull'azione verso l'utente segnalato.
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

const CLOSED_STATUSES = new Set(['actioned', 'dismissed'])

const MESSAGES: Record<string, string> = {
  actioned:  'Abbiamo esaminato la tua segnalazione e preso i provvedimenti necessari.',
  dismissed: 'Abbiamo esaminato la tua segnalazione e non abbiamo rilevato violazioni del regolamento.',
}

Deno.serve(async (req: Request): Promise<Response> => {
  const body = await req.json()
  const record = body.record as { reporter_id: string | null; status: string }
  const oldRecord = body.old_record as { status: string } | undefined

  // Invia solo quando lo status passa a chiuso (evita duplicati su altri UPDATE)
  if (!CLOSED_STATUSES.has(record.status)) return new Response('ok')
  if (oldRecord && CLOSED_STATUSES.has(oldRecord.status)) return new Response('ok')
  if (!record.reporter_id) return new Response('ok')

  await sendPush(
    record.reporter_id,
    'Aggiornamento sulla tua segnalazione',
    MESSAGES[record.status] ?? 'La tua segnalazione è stata esaminata.',
  )

  return new Response('ok')
})
