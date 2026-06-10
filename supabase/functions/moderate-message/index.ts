// Webhook: messages/dm_messages INSERT → filtro AI soft mode (P38).
// Trigger: due Database Webhook su INSERT, uno per public.messages e uno per
// public.dm_messages, entrambi puntati su questa funzione (verify_jwt: false,
// è invocata dal sistema di webhook DB, non da utenti).
//
// Soft mode (moderazione.md sez. 6): nessun blocco automatico alla pubblicazione.
// Se la blocklist italiana custom o l'OpenAI Moderation API segnalano il
// messaggio, imposta solo flagged_by_ai = true così che la coda moderatori
// (AiFlags, già presente in admin) lo mostri per revisione.
import { supabaseAdmin } from '../_shared/push.ts'
import { containsBlockedTerm } from '../_shared/blocklist.ts'
import { checkOpenAiModeration } from '../_shared/openaiModeration.ts'

const MODERATED_TABLES = new Set(['messages', 'dm_messages'])

Deno.serve(async (req: Request): Promise<Response> => {
  const body = await req.json()
  const table = body.table as string
  const record = body.record as { id: number; body: string }

  if (!MODERATED_TABLES.has(table)) return new Response('ok')

  const flagged = containsBlockedTerm(record.body) || (await checkOpenAiModeration(record.body))
  if (!flagged) return new Response('ok')

  await supabaseAdmin.from(table).update({ flagged_by_ai: true }).eq('id', record.id)

  return new Response('ok')
})
