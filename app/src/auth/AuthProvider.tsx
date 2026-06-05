import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AuthState } from './authTypes'
import { loadProfile, loadRoles } from '../lib/profile/profileLoader'
import {
  getCurrentSession,
  subscribeAuthChanges,
  signOut,
} from './authService'

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AuthState['profile']>(null)
  const [recovering, setRecovering] = useState(false)
  const [roles, setRoles] = useState<string[]>([])

  // Tiene traccia dell'utente già risolto per NON ricaricare a ogni refresh token.
  const currentUserId = useRef<string | null>(null)
  const active = useRef(true)

  async function refreshProfile(): Promise<void> {
    if (!session?.user) return
    const p = await loadProfile(session.user.id)
    if (active.current) setProfile(p)
  }

  async function refreshRoles(): Promise<void> {
    if (!session?.user) return
    const r = await loadRoles(session.user.id)
    if (active.current) setRoles(r)
  }

  useEffect(() => {
    active.current = true

    async function init() {
      const s = await getCurrentSession()
      if (!active.current) return

      setSession(s)
      currentUserId.current = s?.user?.id ?? null

      if (s?.user) {
        const [p, r] = await Promise.all([
          loadProfile(s.user.id),
          loadRoles(s.user.id),
        ])
        if (active.current) {
          setProfile(p)
          setRoles(r)
        }
      }
      if (active.current) setLoading(false)
    }
    init()

    const sub = subscribeAuthChanges((newSession, event) => {
      if (!active.current) return

      if (event === 'PASSWORD_RECOVERY') setRecovering(true)

      const newUserId = newSession?.user?.id ?? null
      const prevUserId = currentUserId.current
      currentUserId.current = newUserId
      setSession(newSession)

      // Stesso utente (refresh token): niente da ricaricare.
      if (newUserId === prevUserId) return

      if (newSession?.user) {
        setLoading(true)
        Promise.all([
          loadProfile(newSession.user.id),
          loadRoles(newSession.user.id),
        ]).then(([p, r]) => {
          if (active.current) {
            setProfile(p)
            setRoles(r)
          }
        }).finally(() => {
          if (active.current) setLoading(false)
        })
      } else {
        setProfile(null)
        setRoles([])
      }
    })

    return () => {
      active.current = false
      sub.unsubscribe()
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
    roles,
    isAdmin: roles.includes('admin'),
    isStaff: roles.includes('admin') || roles.includes('moderator'),
    refreshRoles,
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
