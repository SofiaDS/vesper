import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'

type Status =
  | { kind: 'loading' }
  | { kind: 'not-configured' }
  | { kind: 'connected'; rooms: number }
  | { kind: 'error'; message: string }

function App() {
  const [status, setStatus] = useState<Status>({ kind: 'loading' })

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus({ kind: 'not-configured' })
      return
    }

    // Test di connessione + schema: contiamo le chatroom visibili.
    // Schema Fase 1: 1 Foyer + 3 tematiche (Wander, Pulse, Cult).
    // NB: da non loggati la RLS nasconde le stanze (count = 0): e' atteso,
    // conta solo che non ci sia un errore di connessione.
    supabase
      .from('chatrooms')
      .select('id', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (error) {
          setStatus({ kind: 'error', message: error.message })
        } else {
          setStatus({ kind: 'connected', rooms: count ?? 0 })
        }
      })
  }, [])

  return (
    <main className="app">
      <header className="brand">
        <h1>Vesper</h1>
        <p className="tagline">Fase 1 &middot; schema DB</p>
      </header>

      <section className="card">
        <h2>Stato connessione Supabase</h2>
        {status.kind === 'loading' && (
          <p className="muted">Verifica in corso&hellip;</p>
        )}
        {status.kind === 'not-configured' && (
          <p className="warn">
            Variabili d&rsquo;ambiente mancanti. Crea <code>.env.local</code> a
            partire da <code>.env.example</code> e riavvia <code>npm run dev</code>.
          </p>
        )}
        {status.kind === 'connected' && (
          <p className="ok">
            Connesso a Supabase. Chatroom visibili: <strong>{status.rooms}</strong>
            {status.rooms === 0 &&
              ' — normale da non loggati: le stanze sono protette da RLS e diventano visibili dopo il login.'}
          </p>
        )}
        {status.kind === 'error' && (
          <p className="err">Errore di connessione: {status.message}</p>
        )}
      </section>

      <footer className="muted small">
        Modifica <code>src/App.tsx</code> e salva: la pagina si aggiorna da sola.
      </footer>
    </main>
  )
}

export default App
