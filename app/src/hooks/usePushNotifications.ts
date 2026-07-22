import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export type PushPermission = 'default' | 'granted' | 'denied'

export interface PushState {
  supported: boolean
  subscribed: boolean
  busy: boolean
  /** Stato del permesso notifiche del sistema (in TWA = permesso Android dell'app). */
  permission: PushPermission
  /** true quando il permesso è negato: va sbloccato dalle impostazioni di sistema, il toggle non basta. */
  blocked: boolean
  /** Ultimo errore leggibile dell'operazione subscribe/unsubscribe, o null. */
  error: string | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

function readPermission(): PushPermission {
  if (typeof Notification === 'undefined') return 'default'
  return Notification.permission as PushPermission
}

export function usePushNotifications(): PushState {
  const { session } = useAuth()
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [permission, setPermission] = useState<PushPermission>(readPermission)
  const [error, setError] = useState<string | null>(null)

  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined' &&
    !!VAPID_PUBLIC_KEY

  // Allinea lo stato del toggle alla realtà: una subscription esiste solo se il
  // permesso è 'granted'. Se l'utente ha revocato il permesso dalle impostazioni
  // di sistema, riportiamo il toggle su off.
  useEffect(() => {
    if (!supported || !session?.user.id) return
    let alive = true
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        if (!alive) return
        setPermission(readPermission())
        setSubscribed(!!sub && readPermission() === 'granted')
      }),
    )
    return () => { alive = false }
  }, [supported, session?.user.id])

  const subscribe = useCallback(async () => {
    if (!session?.user.id || !VAPID_PUBLIC_KEY) return
    // Se il permesso è già negato a livello sistema, subscribe() fallirebbe in
    // silenzio: non proviamo nemmeno, così la UI può spiegare cosa fare.
    if (readPermission() === 'denied') {
      setPermission('denied')
      return
    }
    setBusy(true)
    setError(null)
    try {
      // Richiesta esplicita del permesso: in TWA mappa sul permesso Android
      // POST_NOTIFICATIONS. ATTENZIONE: in TWA requestPermission() può risolvere
      // con 'default' mentre il dialog Android è ancora aperto → NON usciamo se
      // il valore non è 'granted'. Usciamo solo su 'denied' esplicito; per il
      // resto lasciamo decidere pushManager.subscribe(), che è l'operazione che
      // conta davvero e che comunque richiede/verifica il permesso.
      const perm = (await Notification.requestPermission()) as PushPermission
      setPermission(perm)
      if (perm === 'denied') {
        setError('Permesso notifiche negato.')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      // subscribe() è andata a buon fine → il permesso è di fatto concesso,
      // anche se requestPermission() poco fa aveva riportato ancora 'default'.
      setPermission(readPermission())

      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      const { error: dbError } = await supabase.from('push_subscriptions').upsert(
        {
          user_id:  session.user.id,
          endpoint: json.endpoint,
          p256dh:   json.keys.p256dh,
          auth_key: json.keys.auth,
        },
        { onConflict: 'user_id,endpoint' },
      )
      // Se il salvataggio su DB fallisce (es. RLS), NON accendiamo il toggle:
      // sarebbe una subscription "orfana" nel browser che il server non conosce.
      if (dbError) throw dbError
      setSubscribed(true)
    } catch (err) {
      // Subscribe fallita: riallineiamo permission e — soprattutto — rendiamo
      // l'errore visibile, così si capisce SE e DOVE il comando si è rotto
      // (permesso non ancora concesso, VAPID errata, DB/RLS, browser…).
      setPermission(readPermission())
      const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
      setError(message)
      console.error('[push] subscribe fallita:', err)
    } finally {
      setBusy(false)
    }
  }, [session?.user.id])

  const unsubscribe = useCallback(async () => {
    if (!session?.user.id) return
    setBusy(true)
    setError(null)
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
    } catch (err) {
      const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
      setError(message)
      console.error('[push] unsubscribe fallita:', err)
    } finally {
      setBusy(false)
    }
  }, [session?.user.id])

  return {
    supported,
    subscribed,
    busy,
    permission,
    blocked: permission === 'denied',
    error,
    subscribe,
    unsubscribe,
  }
}
