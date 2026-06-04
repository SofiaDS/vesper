import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthState {
  // null = ancora in caricamento; undefined non usato
  loading: boolean
  session: Session | null
  profile: Profile | null
  // true quando l'utente e' loggato ma non ha ancora completato l'onboarding
  needsOnboarding: boolean
  // ricarica il profilo dal DB (es. dopo aver creato il profilo in onboarding)
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Carica il profilo dell'utente loggato (o null se non esiste ancora).
  async function loadProfile(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

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
    let active = true

    // 1) Sessione iniziale al primo render.
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) {
        await loadProfile(data.session.user.id)
      }
      setLoading(false)
    })

    // 2) Reagisce a login/logout/refresh token.
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!active) return
        setSession(newSession)
        if (newSession?.user) {
          await loadProfile(newSession.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      },
    )

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value: AuthState = {
    loading,
    session,
    profile,
    needsOnboarding: Boolean(session) && !profile,
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
