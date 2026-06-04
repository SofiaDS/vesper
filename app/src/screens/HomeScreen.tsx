import { useAuth } from '../auth/AuthProvider'

export function HomeScreen() {
  const { profile, signOut } = useAuth()

  return (
    <main className="app">
      <header className="brand">
        <h1>Vesper</h1>
        <p className="tagline">Foyer</p>
      </header>

      <section className="card">
        <h2>Ciao {profile?.nickname} 👋</h2>
        <p className="muted">
          Sei dentro. Il tuo profilo è creato e sei iscritta al Foyer, la
          stanza globale di Vesper.
        </p>
        <p className="muted small">
          Prossimo passo: la schermata di chat per leggere e scrivere messaggi.
        </p>
      </section>

      <button type="button" className="link" onClick={signOut}>
        Esci
      </button>
    </main>
  )
}
