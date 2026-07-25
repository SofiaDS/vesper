// Modulo condiviso: logica di invio Web Push riusata da tutti i router/webhook.
// Unico punto in cui si invia una notifica e si puliscono gli endpoint morti,
// così la gestione degli status code non va mantenuta in più copie.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

export const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@vespercommunity.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

// Origine del messaggio che ha generato la notifica. Il server non sa quale
// schermata l'utente stia guardando in quel momento, quindi non può decidere da
// solo se la notifica è ridondante: manda l'informazione e lascia che sia il
// service worker a confrontarla con la vista aperta (vedi app/src/sw.ts).
export interface PushSource {
  kind: 'room' | 'dm'
  // Id della stanza, confrontato con la vista aperta per decidere se la
  // notifica è ridondante. Per i DM basta sapere che la sezione "Messaggi" è
  // aperta, come già fa il toast in-app, quindi lì l'id serve solo a raggruppare.
  id?: string
  // Etichetta leggibile per il titolo raggruppato: nome della stanza, oppure
  // "@nickname" per i DM. ("10 messaggi in Foyer", "5 messaggi da @anna")
  label?: string
  // Chiave di raggruppamento delle notifiche: i messaggi che la condividono si
  // fondono in un'unica notifica invece di accumularsi. Default `kind:id`.
  // Le menzioni la sovrascrivono per restare distinte dal mucchio.
  group?: string
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  source?: PushSource
  // Riga da accumulare nell'elenco quando più messaggi si raggruppano. Nelle
  // stanze include il mittente ("@anna: ciao"), nei DM basta il testo.
  line?: string
}

export interface PushResult {
  sent: number
  expiredCleaned: number
}

type SubRow = { id: string; endpoint: string; p256dh: string; auth_key: string }

// Status code che indicano un endpoint definitivamente morto → la subscription
// va rimossa dal DB. 404 = endpoint inesistente (tipico dopo che l'utente
// cancella i dati/storage dell'app), 410 = Gone (subscription revocata/scaduta).
// Gli altri errori NON vanno cancellati: 400/401/403/413 indicano chiavi VAPID
// o payload non validi, 429/5xx sono transitori e si ritentano da soli al
// prossimo invio.
const DEAD_ENDPOINT_CODES = new Set([404, 410])

// Invia il payload a un insieme di subscription già caricate, rimuove quelle
// con endpoint morto e logga gli altri errori per renderli diagnosticabili.
async function deliver(subs: SubRow[], payload: PushPayload): Promise<PushResult> {
  if (subs.length === 0) return { sent: 0, expiredCleaned: 0 }

  const expiredIds: string[] = []
  let sent = 0
  const body = JSON.stringify({ ...payload, url: payload.url ?? '/' })

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          body,
        )
        sent++
      } catch (e: unknown) {
        const status = (e as { statusCode?: number }).statusCode
        if (status !== undefined && DEAD_ENDPOINT_CODES.has(status)) {
          expiredIds.push(sub.id)
        } else {
          console.error('[push] invio fallito, status', status, e)
        }
      }
    }),
  )

  if (expiredIds.length > 0) {
    await supabaseAdmin.from('push_subscriptions').delete().in('id', expiredIds)
  }
  return { sent, expiredCleaned: expiredIds.length }
}

// Invia a tutte le subscription di un singolo utente.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushResult> {
  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', userId)
  return deliver((subs ?? []) as SubRow[], payload)
}

// Invia a tutte le subscription di più utenti con una sola query.
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<PushResult> {
  if (userIds.length === 0) return { sent: 0, expiredCleaned: 0 }
  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .in('user_id', userIds)
  return deliver((subs ?? []) as SubRow[], payload)
}
