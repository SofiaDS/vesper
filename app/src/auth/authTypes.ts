import type { Session } from '@supabase/supabase-js'
import type { Profile } from '../types'

export interface AuthState {
  loading: boolean
  session: Session | null
  profile: Profile | null
  needsOnboarding: boolean
  // true quando si arriva dal link "reimposta password" (evento recovery).
  recovering: boolean
  clearRecovery: () => void
  refreshProfile: () => Promise<void>
  // Ruoli staff (admin/moderator); vuoto per gli utenti normali.
  roles: string[]
  isAdmin: boolean
  isStaff: boolean
  refreshRoles: () => Promise<void>
  signOut: () => Promise<void>
}
