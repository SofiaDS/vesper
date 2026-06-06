// Modulo condiviso: logica di invio Web Push riusata da tutti i router.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

export const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@vesper.app',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

export interface PushPayload {
  title: string
  body: string
  url?: string
}

type SubRow = { id: string; endpoint: string; p256dh: string; auth_key: string }

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return

  const expiredIds: string[] = []
  await Promise.all(
    (subs as SubRow[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          JSON.stringify({ ...payload, url: payload.url ?? '/' }),
        )
      } catch (e: unknown) {
        if ((e as { statusCode?: number }).statusCode === 410) expiredIds.push(sub.id)
      }
    }),
  )
  if (expiredIds.length > 0) {
    await supabaseAdmin.from('push_subscriptions').delete().in('id', expiredIds)
  }
}
