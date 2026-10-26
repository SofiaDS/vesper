// Rilevamento dell'ambiente in cui gira la web app. Serve a dare a ogni
// persona le istruzioni giuste per installarla e per le notifiche, che su
// iPhone e Android funzionano in modo diverso.

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''

// iPadOS 13+ si presenta come un Mac: lo riconosciamo dallo schermo touch.
export const isIOS =
  /iphone|ipad|ipod/i.test(ua) ||
  (typeof navigator !== 'undefined' &&
    navigator.platform === 'MacIntel' &&
    navigator.maxTouchPoints > 1)

export const isAndroid = /android/i.test(ua)

// Su iOS solo da Safari "Aggiungi alla schermata Home" è sempre presente; da
// iOS 16.4 c'è anche in Chrome/Edge/Firefox, ma in posizioni diverse.
export const isIOSSafari = isIOS && !/crios|fxios|edgios|opios/i.test(ua)

// Browser interni delle app (Instagram, Facebook, TikTok…): lì l'app non si
// può installare e le notifiche non esistono. Il link va aperto nel browser.
const IN_APP: [RegExp, string][] = [
  [/instagram/i, 'Instagram'],
  [/fban|fbav|fb_iab/i, 'Facebook'],
  [/musical_ly|bytedancewebview|tiktok/i, 'TikTok'],
  [/snapchat/i, 'Snapchat'],
  [/twitter/i, 'X'],
  [/linkedinapp/i, 'LinkedIn'],
  [/\bline\//i, 'LINE'],
  [/telegram/i, 'Telegram'],
  // WebView Android generica (es. Gmail, Telegram): il "; wv)" è il marcatore.
  [/; wv\)/i, ''],
]

export const inAppBrowser: string | null = (() => {
  for (const [re, name] of IN_APP) if (re.test(ua)) return name
  return null
})()

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

// Link "intent" che chiede ad Android di aprire la pagina corrente in Chrome.
// Funziona dalla maggior parte dei browser interni; se Chrome manca, Android
// propone il browser predefinito grazie al fallback.
export function chromeIntentUrl(): string {
  const { host, pathname, search } = window.location
  const fallback = encodeURIComponent(window.location.href)
  return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`
}
