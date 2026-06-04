import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthState {
  loading: boolean
  session: Session | null
  profile: Profile | null
  // true quando l'utente e' loggato ma non ha ancora completato l'onboarding
  needsOnboarding: boolean
  // true quando si arriva dal link "reimposta password" (evento recovery):
  // l'app deve mostrare la schermata per scegliere una nuova password.
  recovering: boolean
  // chiude il flusso di recovery (dopo aver aggiornato la password)
  clearRecovery: () => void
  // ricarica il profilo dal DB (es. dopo averlo creato in onboarding)
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recovering, setRecovering] = useState(false)

  // Tiene traccia dell'utente per cui il profilo e' gia' stato risolto, cosi'
  // da NON ricaricarlo a ogni evento auth (es. refresh del token).
  const currentUserId = useRef<string | null>(null)
  const active = useRef(true)

  // Carica il profilo dell'utente (o null se non esiste ancora).
  async function loadProfile(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!active.current) return
    if (error) {
      console.error('Errore nel caricamento del profilo:', error.message)
      setProfile(null)
      return
    }
    setProfile((data as Profile) ?? null)
  }

  async function refreshProfile(): Promise<void> {
    if (session?.user) {
      await loadProfile(session.user.id)
    }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  useEffect(() => {
    active.current = true

    // 1) Sessione iniziale: carichiamo il profilo PRIMA di togliere il
    //    "loading", cosi' l'app non mostra mai uno schermo intermedio sbagliato.
    async function init() {
      const { data } = await supabase.auth.getSession()
      if (!active.current) return
      setSession(data.session)
      currentUserId.current = data.session?.user?.id ?? null
      if (data.session?.user) {
        await loadProfile(data.session.user.id)
      }
      if (active.current) setLoading(false)
    }
    init()

    // 2) Cambi di stato (login/logout/refresh token/recovery).
    const { data: sub } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!active.current) return

        // Link di reset password: mostra la schermata "nuova password".
        // (arriva con una sessione valida ma temporanea di tipo recovery)
        if (event === 'PASSWORD_RECOVERY') {
          setRecovering(true)
        }

        const newUserId = newSession?.user?.id ?? null
        const prevUserId = currentUserId.current
        currentUserId.current = newUserId
        setSession(newSession)

        // Stesso utente (es. solo refresh del token): niente da ricaricare,
        // evitiamo flash inutili.
        if (newUserId === prevUserId) return

        if (newSession?.user) {
          // Utente cambiato (login): mostra "loading" finche' il profilo non
          // e' risolto, cosi' non lampeggia l'onboarding prima della chat.
          setLoading(true)
          loadProfile(newSession.user.id).finally(() => {
            if (active.current) setLoading(false)
          })
        } else {
          // Logout.
          setProfile(null)
        }
      },
    )

    return () => {
      active.current = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value: AuthState = {
    loading,
    session,
    profile,
    needsOnboarding: Boolean(session) && !profile,
    recovering,
    clearRecovery: () => setRecovering(false),
    refreshProfile,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  return ctx
}
