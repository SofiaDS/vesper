// Edge Function: notifiche di buon compleanno.
// Schedulata da pg_cron (migration 20260819000000_birthday_greetings.sql) —
// invocata una volta al giorno. Deploy con --no-verify-jwt (endpoint pubblico,
// come decay-expired-events): non riceve richieste utente.
//
// ⚠️ Versione SELF-CONTAINED: la logica di invio push (Web Push + FCM) è
// inlineata invece di importarla da ../_shared/push.ts, perché questa function è
// deployata dall'editor web della dashboard Supabase, dove l'import di una
// cartella sorella (`../_shared`) non si risolve. Le altre push-on-* continuano
// a usare _shared/push.ts. Se un giorno passi al deploy via CLI, puoi tornare
// alla versione condivisa (vedi la cronologia git di questo file).
//
// Flusso:
//   1. birthday_user_ids() → chi compie gli anni oggi (Europe/Rome) e non è
//      ancora stato salutato quest'anno.
//   2. invia una push personalizzata a ciascuno (Web Push + FCM nativo).
//   3. mark_birthday_greeted() → segna l'anno per evitare doppioni.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@vespercommunity.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

// ─── FCM (push native Android) ───────────────────────────────────────────────
interface ServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

function loadServiceAccount(): ServiceAccount | null {
  const raw = Deno.env.get('FCM_SERVICE_ACCOUNT')
  if (!raw) return null
  const trimmed = raw.trim()
  let text = trimmed
  if (!trimmed.startsWith('{')) {
    try { text = atob(trimmed) } catch { return null }
  }
  try {
    const sa = JSON.parse(text) as ServiceAccount
    if (!sa.project_id || !sa.client_email || !sa.private_key) return null
    return sa
  } catch {
    console.error('[birthday] FCM_SERVICE_ACCOUNT non è JSON valido')
    return null
  }
}

function base64url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const bin = atob(body)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

let cachedToken: { value: string; exp: number } | null = null

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.value

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )
  const signingInput = `${header}.${claim}`

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput)),
  )
  const assertion = `${signingInput}.${base64url(sig)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) throw new Error(`[birthday] token OAuth2 fallito: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: json.access_token, exp: now + json.expires_in }
  return json.access_token
}

async function sendFcm(tokens: string[], title: string, body: string): Promise<{ sent: number; deadTokens: string[] }> {
  const sa = loadServiceAccount()
  if (!sa || tokens.length === 0) return { sent: 0, deadTokens: [] }

  const accessToken = await getAccessToken(sa)
  const deadTokens: string[] = []
  let sent = 0

  await Promise.all(
    tokens.map(async (token) => {
      try {
        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: {
                token,
                notification: { title, body },
                data: { url: '/' },
                android: { priority: 'high' },
              },
            }),
          },
        )
        if (res.ok) { sent++; return }
        const text = await res.text()
        if (res.status === 404 || /UNREGISTERED/.test(text)) deadTokens.push(token)
        else console.error('[birthday] FCM invio fallito', res.status, text)
      } catch (e) {
        console.error('[birthday] FCM eccezione', e)
      }
    }),
  )
  return { sent, deadTokens }
}

// ─── Web Push ────────────────────────────────────────────────────────────────
type SubRow = { id: string; endpoint: string; p256dh: string; auth_key: string }
const DEAD_ENDPOINT_CODES = new Set([404, 410])

async function sendWebPush(subs: SubRow[], title: string, body: string): Promise<{ sent: number; expiredIds: string[] }> {
  if (subs.length === 0) return { sent: 0, expiredIds: [] }
  const payload = JSON.stringify({ title, body, url: '/' })
  const expiredIds: string[] = []
  let sent = 0

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload,
        )
        sent++
      } catch (e: unknown) {
        const status = (e as { statusCode?: number }).statusCode
        if (status !== undefined && DEAD_ENDPOINT_CODES.has(status)) expiredIds.push(sub.id)
        else console.error('[birthday] Web Push fallito, status', status, e)
      }
    }),
  )
  return { sent, expiredIds }
}

// Invia gli auguri a un utente su tutti i suoi device (Web Push + FCM) e ripulisce
// subscription/token morti. Ritorna quante notifiche sono davvero partite.
async function greetUser(userId: string, title: string, body: string): Promise<number> {
  const [{ data: subs }, { data: tok }] = await Promise.all([
    supabaseAdmin.from('push_subscriptions').select('id, endpoint, p256dh, auth_key').eq('user_id', userId),
    supabaseAdmin.from('fcm_tokens').select('token').eq('user_id', userId),
  ])
  const tokens = (tok ?? []).map((r) => (r as { token: string }).token)

  const [web, fcm] = await Promise.all([
    sendWebPush((subs ?? []) as SubRow[], title, body),
    sendFcm(tokens, title, body),
  ])

  if (web.expiredIds.length > 0) {
    await supabaseAdmin.from('push_subscriptions').delete().in('id', web.expiredIds)
  }
  if (fcm.deadTokens.length > 0) {
    await supabaseAdmin.from('fcm_tokens').delete().in('token', fcm.deadTokens)
  }
  return web.sent + fcm.sent
}

// ─── Handler ─────────────────────────────────────────────────────────────────
interface BirthdayRow {
  id: string
  nickname: string | null
}

Deno.serve(async (_req: Request): Promise<Response> => {
  const { data, error } = await supabaseAdmin.rpc('birthday_user_ids')
  if (error) {
    console.error('[birthday] query fallita:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const rows = (data ?? []) as BirthdayRow[]
  if (rows.length === 0) {
    return new Response(JSON.stringify({ greeted: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const greeted: string[] = []
  let totalSent = 0
  for (const row of rows) {
    const name = row.nickname ? `, ${row.nickname}` : ''
    try {
      const delivered = await greetUser(
        row.id,
        'Buon compleanno! 🎂',
        `Tanti auguri${name}! Ti auguriamo una splendida giornata.`,
      )
      totalSent += delivered
      // Marchiamo come salutato solo se una push è davvero partita: chi non ha
      // ancora un device registrato resta ri-tentabile se il job rigira oggi.
      if (delivered > 0) greeted.push(row.id)
    } catch (e) {
      console.error('[birthday] invio fallito per', row.id, e)
    }
  }

  if (greeted.length > 0) {
    const { error: markErr } = await supabaseAdmin.rpc('mark_birthday_greeted', { p_ids: greeted })
    if (markErr) console.error('[birthday] mark fallito:', markErr.message)
  }

  const summary = { candidates: rows.length, greeted: greeted.length, pushSent: totalSent }
  console.log('[birthday] fatto:', JSON.stringify(summary))
  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json' },
  })
})
