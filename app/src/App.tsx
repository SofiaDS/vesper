import { useAuth } from './auth/AuthProvider'
import { usePinLock } from './hooks/usePinLock'
import { isSupabaseConfigured } from './lib/supabase'
import { InstallBanner } from './components/InstallBanner'
import { ThemeToggle } from './components/ThemeToggle'
import { AuthScreen } from './screens/AuthScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { UpdatePasswordScreen } from './screens/UpdatePasswordScreen'
import { VerificationScreen } from './screens/VerificationScreen'
import { VerificationPendingScreen } from './screens/VerificationPendingScreen'
import { PinLockScreen } from './screens/PinLockScreen'
import { Home } from './screens/Home'

function App() {
  const { loading, session, profile, needsOnboarding, recovering } = useAuth()
  const { locked, unlock } = usePinLock()

  if (!isSupabaseConfigured) {
    return (
      <main className="app">
        <header className="brand">
          <h1>Vesper</h1>
        </header>
        <section className="card">
          <p className="warn" role="alert">
            Supabase non configurato. Crea <code>.env.local</code> a partire da{' '}
            <code>.env.example</code> e riavvia <code>npm run dev</code>.
          </p>
        </section>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="app">
        <header className="brand">
          <h1>Vesper</h1>
        </header>
        <p className="muted">Caricamento&hellip;</p>
      </main>
    )
  }

  if (recovering) return <UpdatePasswordScreen />

  if (session && locked) return <PinLockScreen onUnlock={unlock} />

  let screen: React.ReactNode
  let isHome = false
  if (!session) screen = <AuthScreen />
  else if (needsOnboarding) screen = <OnboardingScreen />
  else if (!profile?.verification_status || profile.verification_status === 'rejected')
    screen = <VerificationScreen />
  else if (profile.verification_status === 'pending') screen = <VerificationPendingScreen />
  else {
    screen = <Home />
    isHome = true
  }

  return (
    <>
      <InstallBanner />
      {/* In Home il toggle tema vive dentro il burger menu: evitiamo il doppione fisso in alto a destra. */}
      {!isHome && <ThemeToggle />}
      {screen}
    </>
  )
}

export default App
