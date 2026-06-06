import { useAuth } from './auth/AuthProvider'
import { isSupabaseConfigured } from './lib/supabase'
import { InstallBanner } from './components/InstallBanner'
import { ThemeToggle } from './components/ThemeToggle'
import { AuthScreen } from './screens/AuthScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { UpdatePasswordScreen } from './screens/UpdatePasswordScreen'
import { VerificationScreen } from './screens/VerificationScreen'
import { VerificationPendingScreen } from './screens/VerificationPendingScreen'
import { Home } from './screens/Home'

function App() {
  const { loading, session, profile, needsOnboarding, recovering } = useAuth()

  if (!isSupabaseConfigured) {
    return (
      <main className="app">
        <header className="brand">
          <h1>Vesper</h1>
        </header>
        <section className="card">
          <p className="warn">
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

  let screen: React.ReactNode
  if (!session) screen = <AuthScreen />
  else if (needsOnboarding) screen = <OnboardingScreen />
  else if (!profile?.verification_status || profile.verification_status === 'rejected')
    screen = <VerificationScreen />
  else if (profile.verification_status === 'pending') screen = <VerificationPendingScreen />
  else screen = <Home />

  return (
    <>
      <InstallBanner />
      <ThemeToggle />
      {screen}
    </>
  )
}

export default App
