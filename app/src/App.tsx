import { useEffect } from 'react'
import { useAuth } from './auth/AuthProvider'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { AuthScreen } from './screens/AuthScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { UpdatePasswordScreen } from './screens/UpdatePasswordScreen'
import { VerificationScreen } from './screens/VerificationScreen'
import { Home } from './screens/Home'

function VerificationPending() {
  const { session, refreshProfile } = useAuth()

  // Ascolta le modifiche al proprio profilo e aggiorna quando lo status cambia
  useEffect(() => {
    const uid = session?.user.id
    if (!uid) return
    const ch = supabase
      .channel('verif_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${uid}`,
        },
        () => { refreshProfile() },
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [session?.user.id])

  return (
    <main className="app">
      <header className="brand">
        <h1>Vesper</h1>
      </header>
      <section className="card">
        <h2>Verifica in corso</h2>
        <p className="muted">
          Il tuo video di verifica è stato ricevuto. I moderatori lo esamineranno
          al più presto — riceverai accesso all'app non appena approvato.
        </p>
        <p className="hint">Puoi chiudere questa pagina e tornare più tardi.</p>
      </section>
    </main>
  )
}

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

  // Profilo creato ma verifica non ancora inviata o rifiutata -> verifica
  if (!profile?.verification_status || profile.verification_status === 'rejected') {
    return <VerificationScreen />
  }

  // Verifica inviata, in attesa di revisione
  if (profile.verification_status === 'pending') {
    return <VerificationPending />
  }

  // Verificata e approvata -> app
  return <Home />
}

export default App
