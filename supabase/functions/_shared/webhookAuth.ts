// Autorizzazione dei Database Webhook.
//
// Queste edge function sono deployate con verify_jwt:false perché non sono
// invocate da utenti ma dai trigger `supabase_functions.http_request(...)` del
// DB. L'endpoint resta però pubblico: senza un controllo interno, chiunque
// conosca l'URL potrebbe inviare payload arbitrari (spam di push, flag di
// moderazione falsi). Questo è quel controllo.
//
// I trigger inviano un header `x-webhook-secret` con un secret condiviso. Lo
// confrontiamo con la env var WEBHOOK_SECRET, configurata nei Secrets delle
// Edge Function del progetto. Un chiamante esterno non conosce il secret →
// viene rifiutato con 401.
//
// NB: non usiamo il service_role key come secret perché nell'ambiente delle
// function `SUPABASE_SERVICE_ROLE_KEY` è la nuova chiave (formato sb_secret_…)
// mentre i webhook storici inviano la vecchia JWT: formati diversi, non
// confrontabili. Un secret dedicato evita del tutto il problema.
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? ''

// Confronto a tempo (quasi) costante per non trapelare quanti caratteri del
// secret combaciano.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

// true se la richiesta proviene da un webhook DB fidato (secret combaciante).
export function isTrustedWebhook(req: Request): boolean {
  if (WEBHOOK_SECRET.length === 0) return false
  const provided = req.headers.get('x-webhook-secret') ?? ''
  return provided.length > 0 && timingSafeEqual(provided, WEBHOOK_SECRET)
}

export function unauthorized(): Response {
  return new Response('Unauthorized', { status: 401 })
}
