// Deep-link delle notifiche push: le edge function impostano `url` sulla root
// con un query param ("/?dm=1", "/?room=<id>"). Qui lo traduciamo in un intento
// di navigazione interno.
// Perché query param e non path (/dm, /room/<id>): l'app NON usa un router per
// URL (navigazione a stato, vedi Home.tsx) e l'hosting statico servirebbe quei
// path solo con una rewrite SPA lato Vercel, che si è rivelata inaffidabile
// (cleanUrls + rewrites non convivono). La root "/" risponde sempre 200, quindi
// il query param non fa mai 404. Per retrocompatibilità continuiamo a leggere
// anche il vecchio formato path (notifiche già consegnate).
export type DeepLinkIntent =
  | { type: 'dm' }
  | { type: 'room'; id: string }

export function parseDeepLink(input: string): DeepLinkIntent | null {
  // `input` può essere un path assoluto ("/?room=x", "/room/x") o un URL intero:
  // lo normalizziamo con una base fittizia per leggere search e pathname.
  let url: URL
  try {
    url = new URL(input, 'https://x')
  } catch {
    return null
  }

  // Formato attuale: query param sulla root.
  const roomId = url.searchParams.get('room')
  if (roomId) return { type: 'room', id: roomId }
  if (url.searchParams.get('dm') !== null) return { type: 'dm' }

  // Formato legacy: path (/dm, /room/<id>).
  const clean = url.pathname.replace(/\/+$/, '')
  if (clean === '/dm') return { type: 'dm' }
  const m = clean.match(/^\/room\/([^/]+)$/)
  if (m) return { type: 'room', id: decodeURIComponent(m[1]) }

  return null
}
