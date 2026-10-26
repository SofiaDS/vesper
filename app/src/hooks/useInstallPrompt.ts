import { useEffect, useState } from 'react'
import { inAppBrowser, isAndroid, isIOS, isIOSSafari, isStandalone } from '../lib/platform'

// BeforeInstallPromptEvent non è nel DOM standard — lo dichiariamo localmente.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa-install-dismissed'
const DISMISS_DAYS = 14
// Quanto aspettare `beforeinstallprompt` su Android prima di passare alle
// istruzioni manuali (browser che non lo supportano, o prompt già rifiutato).
const ANDROID_PROMPT_WAIT_MS = 3000

// Il flag è un timestamp: il "Non ora" vale solo per un periodo, poi l'avviso ricompare.
// Valori legacy (vecchio flag booleano '1') non sono timestamp plausibili: li ignoriamo
// così l'avviso torna visibile a chi l'aveva chiuso prima di questa modifica.
function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return false
    const ts = Number(raw)
    if (!Number.isFinite(ts) || ts < 1_000_000_000_000) return false
    return Date.now() - ts < DISMISS_DAYS * 86_400_000
  } catch {
    return false
  }
}

/**
 * Quale variante di banner mostrare:
 * - `prompt`: il browser offre l'installazione nativa → bottone "Installa"
 * - `ios-safari` / `ios-other`: istruzioni manuali dal menu Condividi
 * - `android-manual`: istruzioni manuali dal menu ⋮ del browser
 * - `in-app`: browser interno di un'app (Instagram…), va aperto nel browser vero
 */
export type InstallMode = 'prompt' | 'ios-safari' | 'ios-other' | 'android-manual' | 'in-app'

export interface InstallPromptState {
  show: boolean
  mode: InstallMode | null
  /** Nome dell'app col browser interno (es. "Instagram"), se riconosciuta. */
  inAppName: string | null
  install: () => Promise<void>
  dismiss: () => void
}

export function useInstallPrompt(): InstallPromptState {
  const [nativePrompt, setNativePrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(isDismissed)
  const [androidWaitOver, setAndroidWaitOver] = useState(false)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setNativePrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setNativePrompt(null)
      setInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', onInstalled)
    const timer = isAndroid ? setTimeout(() => setAndroidWaitOver(true), ANDROID_PROMPT_WAIT_MS) : undefined
    // Chrome Android non rilancia `beforeinstallprompt` se l'app è già
    // installata: senza questo controllo mostreremmo le istruzioni manuali a
    // chi l'app ce l'ha già. Richiede `related_applications` nel manifest.
    const nav = navigator as { getInstalledRelatedApps?: () => Promise<unknown[]> }
    nav.getInstalledRelatedApps?.()
      .then((apps) => { if (apps.length > 0) setInstalled(true) })
      .catch(() => {})
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
      if (timer) clearTimeout(timer)
    }
  }, [])

  let mode: InstallMode | null = null
  if (inAppBrowser !== null) mode = 'in-app'
  else if (nativePrompt) mode = 'prompt'
  else if (isIOS) mode = isIOSSafari ? 'ios-safari' : 'ios-other'
  else if (isAndroid && androidWaitOver) mode = 'android-manual'

  const show = !dismissed && !installed && mode !== null

  async function install() {
    if (!nativePrompt) return
    await nativePrompt.prompt()
    const { outcome } = await nativePrompt.userChoice
    if (outcome === 'accepted') {
      setNativePrompt(null)
      setInstalled(true)
    }
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    } catch {
      // storage non disponibile (navigazione privata): il banner si chiude solo per questa visita
    }
    setDismissed(true)
  }

  return { show, mode, inAppName: inAppBrowser || null, install, dismiss }
}
