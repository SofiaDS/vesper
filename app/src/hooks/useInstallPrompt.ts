import { useEffect, useState } from 'react'

// BeforeInstallPromptEvent non è nel DOM standard — lo dichiariamo localmente.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa-install-dismissed'

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
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1',
  )

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
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return { show, isIOS: ios, install, dismiss }
}
