// Webhook: reports UPDATE → notifica il reporter quando la segnalazione è chiusa.
// Trigger: Database Webhook su UPDATE in public.reports, eventi: update.
// L'invio e la pulizia degli endpoint morti vivono in _shared/push.ts.
import { sendPushToUser } from '../_shared/push.ts'
import { isTrustedWebhook, unauthorized } from '../_shared/webhookAuth.ts'

const CLOSED_STATUSES = new Set(['actioned', 'dismissed'])

const MESSAGES: Record<string, string> = {
  actioned:  'Abbiamo esaminato la tua segnalazione e preso i provvedimenti necessari.',
  dismissed: 'Abbiamo esaminato la tua segnalazione e non abbiamo rilevato violazioni del regolamento.',
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (!isTrustedWebhook(req)) return unauthorized()

  let body: { record?: unknown; old_record?: unknown }
  try {
    body = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  const record = body.record as { reporter_id: string | null; status: string }
  const oldRecord = body.old_record as { status: string } | undefined

  // Invia solo quando lo status passa a chiuso (evita duplicati su altri UPDATE)
  if (!CLOSED_STATUSES.has(record.status)) return new Response('ok')
  if (oldRecord && CLOSED_STATUSES.has(oldRecord.status)) return new Response('ok')
  if (!record.reporter_id) return new Response('ok')

  await sendPushToUser(record.reporter_id, {
    title: 'Aggiornamento sulla tua segnalazione',
    body: MESSAGES[record.status] ?? 'La tua segnalazione è stata esaminata.',
  })

  return new Response('ok')
})
