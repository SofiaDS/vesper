import { useEffect, useState } from 'react'

// BeforeInstallPromptEvent non è nel DOM standard — lo dichiariamo localmente.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa-install-dismissed'
const DISMISS_DAYS = 14

// Il flag è un timestamp: il "Non ora" vale solo per un periodo, poi l'avviso ricompare.
// Valori legacy (vecchio flag booleano '1') non sono timestamp plausibili: li ignoriamo
// così l'avviso torna visibile a chi l'aveva chiuso prima di questa modifica.
function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY)
  if (!raw) return false
  const ts = Number(raw)
  if (!Number.isFinite(ts) || ts < 1_000_000_000_000) return false
  return Date.now() - ts < DISMISS_DAYS * 86_400_000
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

export interface InstallPromptState {
  show: boolean
  isIOS: boolean
  install: () => Promise<void>
  dismiss: () => void
}

export function useInstallPrompt(): InstallPromptState {
  const [nativePrompt, setNativePrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(isDismissed)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setNativePrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const ios = isIOS()
  const standalone = isInStandaloneMode()

  // Mostra se: non già installata, non dismissed, e c'è un motivo per mostrarla
  // (prompt Android disponibile oppure siamo su iOS dove mostriamo le istruzioni manuali)
  const show = !dismissed && !standalone && (nativePrompt !== null || ios)

  async function install() {
    if (!nativePrompt) return
    await nativePrompt.prompt()
    const { outcome } = await nativePrompt.userChoice
    if (outcome === 'accepted') setNativePrompt(null)
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setDismissed(true)
  }

  return { show, isIOS: ios, install, dismiss }
}
