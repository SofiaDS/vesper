// Deep-link delle notifiche push: le edge function impostano `url` a "/dm" o
// "/room/<id>" (vedi supabase/functions/push-on-dm e push-on-chatroom). Qui
// traduciamo quel path in un intento di navigazione interno all'app.
// L'app NON usa un router per URL (la navigazione è a stato, vedi Home.tsx):
// il path serve solo come "istruzione" una tantum al click della notifica,
// sia ad avvio a freddo (URL iniziale) sia ad app già aperta (messaggio dal
// service worker).
export type DeepLinkIntent =
  | { type: 'dm' }
  | { type: 'room'; id: string }

export function parseDeepLink(path: string): DeepLinkIntent | null {
  // Tollera lo slash finale e gli eventuali query/hash.
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '')
  if (clean === '/dm') return { type: 'dm' }
  const m = clean.match(/^\/room\/([^/]+)$/)
  if (m) return { type: 'room', id: decodeURIComponent(m[1]) }
  return null
}
