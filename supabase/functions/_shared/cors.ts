// CORS per le edge function invocate dal browser.
//
// Serve solo a `delete-account`: tutte le altre function sono chiamate dai
// trigger/webhook del DB (server-to-server), dove il CORS non esiste. Per
// questo finora nessuna function aveva header CORS e il problema è rimasto
// invisibile fino alla prima chiamata fatta davvero dal client.
//
// La richiesta del client porta un header `Authorization`, che non è tra quelli
// "safelisted" CORS: il browser fa quindi una preflight OPTIONS prima della POST
// vera. Se la preflight non risponde 2xx con gli header giusti, la fetch fallisce
// a livello di rete e nel client si vede solo "Failed to fetch", senza status.

// Origin da cui l'app può girare. La preflight non porta credenziali, ma
// restringere resta più solido che rispondere `*`: se domani si aggiunge un
// dominio va inserito qui.
const ALLOWED_ORIGINS = [
  'https://vespercommunity.com',
  'https://www.vespercommunity.com',
  'https://vesper-snowy.vercel.app',
  'http://localhost:5173', // vite dev
  'http://localhost:4173', // vite preview
]

// Deploy di preview di Vercel: dominio generato a ogni push (vesper-<hash>.vercel.app).
const VERCEL_PREVIEW = /^https:\/\/vesper-[a-z0-9-]+\.vercel\.app$/

// Header CORS per una richiesta. Se l'origin non è in lista non emettiamo
// Access-Control-Allow-Origin: il browser blocca, che è il comportamento voluto.
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) || VERCEL_PREVIEW.test(origin)
  if (!allowed) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    // Vary: risposte diverse per origin diversi, non vanno cachate insieme.
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Max-Age': '86400',
  }
}

// Risposta alla preflight. Da chiamare come prima cosa nell'handler, prima di
// qualsiasi controllo sul metodo: una OPTIONS che cade nel ramo "405 Method Not
// Allowed" fa fallire la preflight e quindi l'intera chiamata.
export function preflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null
  return new Response(null, { status: 204, headers: corsHeaders(req) })
}
