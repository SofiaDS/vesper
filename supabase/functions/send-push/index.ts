// Edge Function: invia Web Push Notifications a uno o più utenti.
// Chiamata diretta con { user_ids, title, body, url }. I Database Webhooks che
// wrappano un record sono no-op qui (il routing per-tabella è gestito dalle
// push-on-*). Invio e pulizia degli endpoint morti vivono in _shared/push.ts.
import { sendPushToUsers } from '../_shared/push.ts'

interface RequestPayload {
  user_ids: string[]
  title: string
  body: string
  url?: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let payload: RequestPayload
  try {
    const body = await req.json()
    if (body.user_ids) {
      payload = body as RequestPayload
    } else if (body.record) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    } else {
      return new Response('Bad request', { status: 400 })
    }
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const { sent, expiredCleaned } = await sendPushToUsers(payload.user_ids, {
    title: payload.title,
    body: payload.body,
    url: payload.url,
  })

  return new Response(
    JSON.stringify({ sent, expired_cleaned: expiredCleaned }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
