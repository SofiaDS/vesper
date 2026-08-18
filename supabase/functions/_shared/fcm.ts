// Sender FCM HTTP v1 per le notifiche push native (app Capacitor/Android).
// A differenza del Web Push (web-push + chiavi VAPID, vedi push.ts), FCM v1
// richiede un access token OAuth2 ottenuto firmando un JWT col service account
// Firebase. Il token dura 1h e lo teniamo in cache tra un invio e l'altro.
//
// ENV richieste (impostate come secret dell'Edge Function, MAI nel repo):
//   FCM_SERVICE_ACCOUNT = il JSON del service account Firebase, come stringa.
// Contiene project_id, client_email e private_key (PEM PKCS8).

interface ServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

function loadServiceAccount(): ServiceAccount | null {
  const raw = Deno.env.get('FCM_SERVICE_ACCOUNT')
  if (!raw) return null
  // Il secret può essere il JSON grezzo oppure la sua versione base64 (utile per
  // evitare problemi con i newline della private_key quando si incolla il valore).
  const trimmed = raw.trim()
  const text = trimmed.startsWith('{') ? trimmed : safeAtob(trimmed)
  try {
    const sa = JSON.parse(text) as ServiceAccount
    if (!sa.project_id || !sa.client_email || !sa.private_key) return null
    return sa
  } catch {
    console.error('[fcm] FCM_SERVICE_ACCOUNT non è JSON valido (né base64 di un JSON)')
    return null
  }
}

function safeAtob(b64: string): string {
  try {
    return atob(b64)
  } catch {
    return ''
  }
}

// true se FCM è configurato: consente a chi chiama di saltare del tutto il ramo
// nativo finché il service account non è stato caricato.
export function fcmConfigured(): boolean {
  return !!Deno.env.get('FCM_SERVICE_ACCOUNT')
}

// ── OAuth2: JWT RS256 → access token ────────────────────────────────────────
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
  // Riusa il token finché mancano più di 60s alla scadenza.
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
  if (!res.ok) {
    throw new Error(`[fcm] token OAuth2 fallito: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: json.access_token, exp: now + json.expires_in }
  return json.access_token
}

// ── Invio a un singolo token ────────────────────────────────────────────────
export interface FcmMessage {
  title: string
  body: string
  // Coppie stringa→stringa: FCM data accetta solo stringhe. Ci mettiamo `url`
  // per il deep-link (lo legge useDeepLink al tap) e le info di raggruppamento.
  data?: Record<string, string>
}

export type FcmSendOutcome = 'sent' | 'dead' | 'error'

// Esito "dead": il token non è più valido e va rimosso dal DB. In v1 questo è
// segnalato da HTTP 404 (NOT_FOUND) o dall'errorCode UNREGISTERED.
async function sendOne(token: string, projectId: string, accessToken: string, msg: FcmMessage): Promise<FcmSendOutcome> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: msg.title, body: msg.body },
          data: msg.data ?? {},
          android: {
            priority: 'high',
            notification: {
              // Raggruppa le notifiche della stessa conversazione come su web.
              tag: msg.data?.group,
            },
          },
        },
      }),
    },
  )

  if (res.ok) return 'sent'

  const text = await res.text()
  if (res.status === 404 || /UNREGISTERED/.test(text)) return 'dead'
  console.error('[fcm] invio fallito', res.status, text)
  return 'error'
}

export interface FcmResult {
  sent: number
  deadTokens: string[]
}

// Invia lo stesso messaggio a una lista di token FCM. Ritorna i token morti da
// cancellare (li ripulisce chi chiama, che ha già il client admin).
export async function sendFcm(tokens: string[], msg: FcmMessage): Promise<FcmResult> {
  const sa = loadServiceAccount()
  if (!sa || tokens.length === 0) return { sent: 0, deadTokens: [] }

  const accessToken = await getAccessToken(sa)
  const deadTokens: string[] = []
  let sent = 0

  await Promise.all(
    tokens.map(async (t) => {
      try {
        const outcome = await sendOne(t, sa.project_id, accessToken, msg)
        if (outcome === 'sent') sent++
        else if (outcome === 'dead') deadTokens.push(t)
      } catch (e) {
        console.error('[fcm] eccezione invio', e)
      }
    }),
  )

  return { sent, deadTokens }
}
