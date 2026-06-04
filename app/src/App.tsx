import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'

type Status =
  | { kind: 'loading' }
  | { kind: 'not-configured' }
  | { kind: 'connected'; tableFound: boolean }
  | { kind: 'error'; message: string }

// Codici/segnali che indicano "connessione OK ma tabella mancante":
// abbiamo raggiunto PostgREST e ha risposto con un errore strutturato.
function isMissingTable(error: { code?: string; message?: string }): boolean {
  const code = error.code ?? ''
  const msg = (error.message ?? '').toLowerCase()
  return (
    code === 'PGRST205' || // PostgREST: table not found in schema cache
    code === '42P01' || // Postgres: undefined_table
    msg.includes('does not exist') ||
    msg.includes('could not find the table')
  )
}

function App() {
  const [status, setStatus] = useState<Status>({ kind: 'loading' })

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus({ kind: 'not-configured' })
      return
    }

    // Test di connessione: interroghiamo una tabella di prova "pingtest".
    // Se non esiste ancora, l'errore "table not found" conferma comunque
    // che il client raggiunge Supabase: manca solo lo schema.
    supabase
      .from('pingtest')
      .select('*')
      .limit(1)
      .then(({ error }) => {
        if (!error) {
          setStatus({ kind: 'connected', tableFound: true })
        } else if (isMissingTable(error)) {
          setStatus({ kind: 'connected', tableFound: false })
        } else {
          setStatus({ kind: 'error', message: error.message })
        }
      })
  }, [])

  return (
    <main className="app">
      <header className="brand">
        <h1>Vesper</h1>
        <p className="tagline">Fase 0 &middot; setup ambiente</p>
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
            Connesso a Supabase.{' '}
            {status.tableFound
              ? 'La tabella di prova esiste.'
              : 'Connection OK — lo schema del DB non e’ ancora stato creato (atteso in questa fase).'}
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
