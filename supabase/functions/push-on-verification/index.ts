// Webhook: profiles UPDATE → notifica l'utente quando la verifica viene
// approvata o rifiutata. Ignora tutti gli altri campi.
import { sendPushToUser } from '../_shared/push.ts'
import { isTrustedWebhook, unauthorized } from '../_shared/webhookAuth.ts'

Deno.serve(async (req: Request): Promise<Response> => {
  if (!isTrustedWebhook(req)) return unauthorized()

  let body: { record?: unknown; old_record?: unknown }
  try {
    body = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  const newRow = body.record as { id: string; verification_status: string }
  const oldRow = body.old_record as { verification_status: string } | undefined

  const newStatus = newRow.verification_status
  const oldStatus = oldRow?.verification_status

  // Notifica solo quando lo status cambia a 'approved' o 'rejected'
  if (newStatus === oldStatus) return new Response('ok')
  if (newStatus !== 'approved' && newStatus !== 'rejected') return new Response('ok')

  const isApproved = newStatus === 'approved'

  await sendPushToUser(newRow.id, {
    title: isApproved ? 'Verifica approvata ✓' : 'Verifica non approvata',
    body: isApproved
      ? 'Il tuo profilo è ora verificato. Benvenuta in Vesper!'
      : 'La tua verifica non è stata approvata. Apri l\'app per i dettagli.',
    url: '/',
  })

  return new Response('ok')
})
