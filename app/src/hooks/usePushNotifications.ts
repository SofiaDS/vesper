import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export interface PushState {
  supported: boolean
  subscribed: boolean
  busy: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

export function usePushNotifications(): PushState {
  const { session } = useAuth()
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)

  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    !!VAPID_PUBLIC_KEY

  useEffect(() => {
    if (!supported || !session?.user.id) return
    let alive = true
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        if (alive) setSubscribed(!!sub)
      }),
    )
    return () => { alive = false }
  }, [supported, session?.user.id])

  async function subscribe() {
    if (!session?.user.id || !VAPID_PUBLIC_KEY) return
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      await supabase.from('push_subscriptions').upsert(
        {
          user_id:  session.user.id,
          endpoint: json.endpoint,
          p256dh:   json.keys.p256dh,
          auth_key: json.keys.auth,
        },
        { onConflict: 'user_id,endpoint' },
      )
      setSubscribed(true)
    } catch {
      // Permesso negato o browser non supportato — silenzioso
    } finally {
      setBusy(false)
    }
  }

  async function unsubscribe() {
    if (!session?.user.id) return
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', session.user.id)
          .eq('endpoint', sub.endpoint)
      }
      setSubscribed(false)
    } catch {
      // silenzioso
    } finally {
      setBusy(false)
    }
  }

  return { supported, subscribed, busy, subscribe, unsubscribe }
}
