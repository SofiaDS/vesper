import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { translateAuthError, validatePassword } from '../lib/authErrors'

type Mode = 'login' | 'signup'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Mostrato dopo signup quando Supabase richiede la conferma via email.
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)

    // Controllo robustezza password solo in registrazione (in login la
    // password esiste gia' e potrebbe seguire vecchie regole).
    if (mode === 'signup') {
      const pwError = validatePassword(password)
      if (pwError) {
        setError(pwError)
        setBusy(false)
        return
      }
    }

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Se la conferma email e' attiva, non c'e' sessione: avvisa l'utente.
        if (!data.session) {
          setInfo(
            'Account creato. Controlla la tua email per confermare l’indirizzo, poi torna qui per accedere.',
          )
        }
        // Se la sessione c'e', l'AuthProvider intercetta il cambio e prosegue.
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? translateAuthError(err.message)
          : 'Errore imprevisto.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="app">
      <header className="brand">
        <h1>Vesper</h1>
        <p className="tagline">
          {mode === 'login' ? 'Accedi' : 'Crea il tuo account'}
        </p>
      </header>

      <section className="card">
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@esempio.it"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              required
              minLength={mode === 'signup' ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === 'signup'
                  ? 'min 8 caratteri, lettere e numeri'
                  : 'la tua password'
              }
            />
            {mode === 'signup' && (
              <span className="hint">
                Almeno 8 caratteri, con lettere e numeri.
              </span>
            )}
          </label>

          {error && <p className="err">{error}</p>}
          {info && <p className="ok">{info}</p>}

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy
              ? 'Attendi…'
              : mode === 'login'
                ? 'Accedi'
                : 'Registrati'}
          </button>
        </form>

        <p className="switch">
          {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}{' '}
          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
              setInfo(null)
            }}
          >
            {mode === 'login' ? 'Registrati' : 'Accedi'}
          </button>
        </p>
      </section>
    </main>
  )
}
