import { useCallback, useEffect, useRef, useState } from 'react'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

// Ambiente: dentro l'app Capacitor le notifiche passano da FCM NATIVO (gestito
// da Google Play Services, indipendente da Chrome), nel browser/PWA restano Web
// Push VAPID via service worker. `native` è costante per tutta la vita del
// runtime, quindi si può usare per scegliere il ramo senza violare le regole
// degli hook (l'ordine degli hook chiamati non cambia mai tra un render e l'altro).
const native = Capacitor.isNativePlatform()

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
  /** Stato del permesso notifiche del sistema (in app nativa = permesso Android dell'app). */
  permission: PushPermission
  /** true quando il permesso è negato: va sbloccato dalle impostazioni di sistema, il toggle non basta. */
  blocked: boolean
  /** Ultimo errore leggibile dell'operazione subscribe/unsubscribe, o null. */
  error: string | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

function readWebPermission(): PushPermission {
  if (typeof Notification === 'undefined') return 'default'
  return Notification.permission as PushPermission
}

// Il plugin nativo usa 'prompt'|'prompt-with-rationale'|'granted'|'denied';
// li riduciamo ai tre stati che la UI conosce.
function mapNativePermission(state: string): PushPermission {
  if (state === 'granted') return 'granted'
  if (state === 'denied') return 'denied'
  return 'default'
}

export function usePushNotifications(): PushState {
  const { session } = useAuth()
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [permission, setPermission] = useState<PushPermission>(() =>
    native ? 'default' : readWebPermission(),
  )
  const [error, setError] = useState<string | null>(null)
  // Ultimo token FCM ricevuto dal listener nativo, per poterlo cancellare mirato.
  const fcmTokenRef = useRef<string | null>(null)

  const supported = native
    ? true
    : typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      typeof Notification !== 'undefined' &&
      !!VAPID_PUBLIC_KEY

  // ── NATIVO: listener FCM ────────────────────────────────────────────────
  // Il token FCM non torna dalla chiamata a register(): arriva (anche in seguito,
  // se Google lo ruota) sull'evento 'registration'. Attacchiamo i listener una
  // volta per utente e salviamo ogni nuovo token sul DB.
  useEffect(() => {
    if (!native || !session?.user.id) return
    const userId = session.user.id
    let alive = true
    const handles: PluginListenerHandle[] = []

    ;(async () => {
      handles.push(
        await PushNotifications.addListener('registration', async (token) => {
          fcmTokenRef.current = token.value
          const { error: dbError } = await supabase.from('fcm_tokens').upsert(
            { user_id: userId, token: token.value, platform: Capacitor.getPlatform() },
            { onConflict: 'token' },
          )
          if (!alive) return
          // Se il salvataggio fallisce (RLS/rete) NON accendiamo il toggle: il
          // server non conoscerebbe il token e la notifica non arriverebbe mai.
          if (dbError) {
            setError(`${dbError.code ?? 'DB'}: ${dbError.message}`)
            setSubscribed(false)
          } else {
            setPermission('granted')
            setSubscribed(true)
          }
        }),
      )
      handles.push(
        await PushNotifications.addListener('registrationError', (err) => {
          if (!alive) return
          setError(`registrationError: ${JSON.stringify(err.error ?? err)}`)
          setSubscribed(false)
        }),
      )
    })()

    return () => {
      alive = false
      handles.forEach((h) => h.remove())
    }
  }, [session?.user.id])

  // Allinea lo stato del toggle alla realtà all'apertura della schermata.
  useEffect(() => {
    if (!supported || !session?.user.id) return
    const userId = session.user.id
    let alive = true

    if (native) {
      PushNotifications.checkPermissions().then(async (p) => {
        if (!alive) return
        const perm = mapNativePermission(p.receive)
        setPermission(perm)
        if (perm !== 'granted') {
          setSubscribed(false)
          return
        }
        // Permesso concesso: siamo "attivi" solo se un token risulta salvato.
        const { data } = await supabase
          .from('fcm_tokens')
          .select('id')
          .eq('user_id', userId)
          .limit(1)
        if (alive) setSubscribed(!!data && data.length > 0)
      })
      return () => { alive = false }
    }

    // Web: una subscription esiste solo se il permesso è 'granted'. Se l'utente
    // ha revocato il permesso dalle impostazioni, riportiamo il toggle su off.
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        if (!alive) return
        setPermission(readWebPermission())
        setSubscribed(!!sub && readWebPermission() === 'granted')
      }),
    )
    return () => { alive = false }
  }, [supported, session?.user.id])

  // ── NATIVO: subscribe / unsubscribe ─────────────────────────────────────
  const subscribeNative = useCallback(async () => {
    if (!session?.user.id) return
    setBusy(true)
    setError(null)
    try {
      const req = await PushNotifications.requestPermissions()
      const perm = mapNativePermission(req.receive)
      setPermission(perm)
      if (perm !== 'granted') {
        if (perm === 'denied') setError('Permesso notifiche negato.')
        return
      }
      // Registra su FCM: il token arriva sull'evento 'registration' (vedi
      // effetto sopra), che si occupa di salvarlo e accendere il toggle.
      await PushNotifications.register()
    } catch (err) {
      const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
      setError(message)
      console.error('[push] register nativo fallito:', err)
    } finally {
      setBusy(false)
    }
  }, [session?.user.id])

  const unsubscribeNative = useCallback(async () => {
    if (!session?.user.id) return
    setBusy(true)
    setError(null)
    try {
      // Rimuove la registrazione FCM lato device e i token lato DB, così il
      // server smette di inviare a questo account.
      await PushNotifications.unregister().catch(() => {})
      const token = fcmTokenRef.current
      const q = supabase.from('fcm_tokens').delete().eq('user_id', session.user.id)
      await (token ? q.eq('token', token) : q)
      fcmTokenRef.current = null
      setSubscribed(false)
    } catch (err) {
      const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
      setError(message)
      console.error('[push] unregister nativo fallito:', err)
    } finally {
      setBusy(false)
    }
  }, [session?.user.id])

  // ── WEB: subscribe / unsubscribe (Web Push VAPID) ───────────────────────
  const subscribeWeb = useCallback(async () => {
    if (!session?.user.id || !VAPID_PUBLIC_KEY) return
    // Se il permesso è già negato a livello sistema, subscribe() fallirebbe in
    // silenzio: non proviamo nemmeno, così la UI può spiegare cosa fare.
    if (readWebPermission() === 'denied') {
      setPermission('denied')
      return
    }
    setBusy(true)
    setError(null)
    try {
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
      setPermission(readWebPermission())

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
      if (dbError) throw dbError
      setSubscribed(true)
    } catch (err) {
      setPermission(readWebPermission())
      const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
      setError(message)
      console.error('[push] subscribe web fallita:', err)
    } finally {
      setBusy(false)
    }
  }, [session?.user.id])

  const unsubscribeWeb = useCallback(async () => {
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
      console.error('[push] unsubscribe web fallita:', err)
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
    subscribe: native ? subscribeNative : subscribeWeb,
    unsubscribe: native ? unsubscribeNative : unsubscribeWeb,
  }
}
