import { useAuth } from './auth/AuthProvider'
import { isSupabaseConfigured } from './lib/supabase'
import { AuthScreen } from './screens/AuthScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { UpdatePasswordScreen } from './screens/UpdatePasswordScreen'
import { Home } from './screens/Home'

function App() {
  const { loading, session, needsOnboarding, recovering } = useAuth()

  // Guardrail: variabili d'ambiente mancanti (vedi .env.example).
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
        <p className="muted">Caricamento…</p>
      </main>
    )
  }

  // Arrivo dal link di reset password -> imposta nuova password.
  // (ha priorita': la sessione recovery e' valida ma serve solo a questo)
  if (recovering) return <UpdatePasswordScreen />

  // Non loggata -> login/signup
  if (!session) return <AuthScreen />

  // Loggata ma senza profilo -> onboarding
  if (needsOnboarding) return <OnboardingScreen />

  // Loggata e con profilo -> lobby stanze + chat
  return <Home />
}

export default App
