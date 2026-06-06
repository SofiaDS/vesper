// Edge Function: invia Web Push Notifications a uno o più utenti.
// Chiamata da Database Webhooks (su INSERT in messages o dm_messages).
//
// Env richieste (Supabase Dashboard → Settings → Edge Function Secrets):
//   VAPID_PUBLIC_KEY   — chiave pubblica VAPID (= VITE_VAPID_PUBLIC_KEY del client)
//   VAPID_PRIVATE_KEY  — chiave privata VAPID
//   VAPID_SUBJECT      — es. "mailto:hello@vesper.app"

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@vesper.app'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

interface PushPayload {
  user_ids: string[]
  title: string
  body: string
  url?: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let payload: PushPayload
  try {
    // Supabase Database Webhooks wrappano il payload in { type, table, record, ... }
    const body = await req.json()
    // Supporta sia chiamate dirette ({ user_ids, title, body }) sia webhook DB
    if (body.user_ids) {
      payload = body as PushPayload
    } else if (body.record) {
      // Webhook da tabella messages: notifica il mittente escluso, basandosi sul chatroom
      // La logica di routing è demandata al chiamante; questo handler usa user_ids diretto.
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    } else {
      return new Response('Bad request', { status: 400 })
    }
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // Recupera tutte le sottoscrizioni degli utenti target
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .in('user_id', payload.user_ids)

  if (error) {
    console.error('[send-push] DB error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const expiredIds: string[] = []
  let sent = 0

  await Promise.all(
    (subs ?? []).map(async (sub: { id: string; endpoint: string; p256dh: string; auth_key: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? '/' }),
        )
        sent++
      } catch (err: unknown) {
        // HTTP 410 = sottoscrizione scaduta → rimuovi dal DB
        if ((err as { statusCode?: number }).statusCode === 410) {
          expiredIds.push(sub.id)
        } else {
          console.error('[send-push] Push error:', err)
        }
      }
    }),
  )

  // Pulizia sottoscrizioni scadute
  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  return new Response(
    JSON.stringify({ sent, expired_cleaned: expiredIds.length }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
