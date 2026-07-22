// Webhook: messages INSERT → notifica le iscritte alla stanza (esclusa la
// mittente) e chiunque sia @menzionato nel testo.
// Le stanze 'tematica' hanno iscrizioni → si notificano i membri. Il 'foyer'
// non ha iscrizioni → niente notifica "di stanza" (scelta voluta: è la lobby,
// troppo rumore). MA una @menzione è esplicita: notifichiamo il menzionato
// anche nel foyer e anche se non iscritto alla stanza.
import { sendPushToUsers, supabaseAdmin } from '../_shared/push.ts'
import { isTrustedWebhook, unauthorized } from '../_shared/webhookAuth.ts'

// Stesso formato canonico dei mention nel client (app/src/components/
// MentionText.tsx e lib/chat): "@" + [a-zA-Z0-9_], 3–24 caratteri. I nickname
// con spazi/punteggiatura non sono menzionabili per convenzione dell'app.
const MENTION_RE = /@([a-zA-Z0-9_]{3,24})/g

function extractMentions(body: string): string[] {
  const set = new Set<string>()
  let m: RegExpExecArray | null
  MENTION_RE.lastIndex = 0
  while ((m = MENTION_RE.exec(body)) !== null) set.add(m[1])
  return [...set]
}

// Risolve i nickname menzionati a user_id, case-insensitive (coerente con
// MentionText). I token sono solo [A-Za-z0-9_]: l'unico metacarattere di ilike
// è '_', che escapiamo per non trasformarlo in un jolly. Esclude la mittente.
async function resolveMentionedIds(tokens: string[], senderId: string): Promise<string[]> {
  if (tokens.length === 0) return []
  const orFilter = tokens.map((t) => `nickname.ilike.${t.replace(/_/g, '\\_')}`).join(',')
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, nickname')
    .or(orFilter)
    .neq('id', senderId)
  // Guardia: teniamo solo chi combacia ESATTAMENTE (case-insensitive) con un
  // token. Rende il risultato corretto a prescindere da come ilike tratta i
  // jolly: un eventuale over-match viene comunque scartato qui.
  const wanted = new Set(tokens.map((t) => t.toLowerCase()))
  return ((data ?? []) as { id: string; nickname: string }[])
    .filter((r) => wanted.has(r.nickname.toLowerCase()))
    .map((r) => r.id)
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (!isTrustedWebhook(req)) return unauthorized()

  let body: { record?: unknown }
  try {
    body = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  const msg = body.record as {
    chatroom_id: string
    sender_id: string
    body: string
  }

  // Recupera nome stanza e tipo
  const { data: room } = await supabaseAdmin
    .from('chatrooms')
    .select('name, kind')
    .eq('id', msg.chatroom_id)
    .maybeSingle()

  if (!room) return new Response('ok')

  // Destinatari "di stanza": solo le stanze tematiche hanno iscrizioni.
  let memberRecipients: string[] = []
  if ((room as { kind: string }).kind === 'tematica') {
    const { data: members } = await supabaseAdmin
      .from('chat_membership')
      .select('user_id')
      .eq('chatroom_id', msg.chatroom_id)
      .neq('user_id', msg.sender_id)
    memberRecipients = ((members ?? []) as { user_id: string }[]).map((m) => m.user_id)
  }

  // Destinatari "menzione": ovunque, foyer incluso.
  const mentionedIds = await resolveMentionedIds(extractMentions(msg.body), msg.sender_id)
  const mentionedSet = new Set(mentionedIds)

  // Dedup: chi è menzionato riceve la notifica "menzione" (prevale); gli altri
  // membri ricevono quella standard di stanza.
  const roomOnly = memberRecipients.filter((id) => !mentionedSet.has(id))

  if (roomOnly.length === 0 && mentionedIds.length === 0) return new Response('ok')

  const { data: sender } = await supabaseAdmin
    .from('profiles')
    .select('nickname')
    .eq('id', msg.sender_id)
    .maybeSingle()

  const nick = (sender as { nickname: string } | null)?.nickname ?? '—'
  const roomName = (room as { name: string }).name
  const preview = msg.body.slice(0, 120)
  const url = `/room/${msg.chatroom_id}`

  await Promise.all([
    sendPushToUsers(roomOnly, { title: `${roomName} — @${nick}`, body: preview, url }),
    sendPushToUsers(mentionedIds, {
      title: `@${nick} ti ha menzionato in ${roomName}`,
      body: preview,
      url,
    }),
  ])

  return new Response('ok')
})
