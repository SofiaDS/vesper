import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { mapSupabaseAuthError, validatePassword } from '../lib/authErrors'

type Mode = 'login' | 'signup' | 'reset'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Mostrato dopo signup / richiesta reset. NB: messaggio neutro di proposito.
  const [info, setInfo] = useState<string | null>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
  }

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
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Messaggio NEUTRO di proposito: non confermiamo se l'email esista
        // gia' o meno. Supabase, per protezione anti-enumeration, NON da'
        // errore sui duplicati (torna un user con `identities` vuoto). Se qui
        // distinguessimo i due casi rivelremmo quali email sono registrate
        // -> falla di "email enumeration", piu' sensibile su un'app come
        // Vesper. Quindi lo stesso messaggio vale per nuova email e duplicato.
        setInfo(
          'Se l’indirizzo è corretto, ti abbiamo inviato un’email con il link di conferma. Controlla la posta (anche lo spam).',
        )
        // Se la conferma email e' disattivata, c'e' gia' la sessione e
        // l'AuthProvider intercetta il cambio: l'app prosegue da sola.
      } else if (mode === 'reset') {
        // Reset password: stesso principio anti-enumeration. Supabase non
        // rivela se l'email esiste; mostriamo SEMPRE lo stesso messaggio.
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setInfo(
          'Se l’indirizzo è corretto, ti abbiamo inviato un’email per reimpostare la password. Controlla la posta (anche lo spam).',
        )
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch(error){
      throw mapSupabaseAuthError(error)
    
    }finally {
      setBusy(false)
    }
  }

  const tagline =
    mode === 'login'
      ? 'Accedi'
      : mode === 'signup'
        ? 'Crea il tuo account'
        : 'Reimposta la password'

  return (
    <main className="app">
      <header className="brand">
        <h1>Vesper</h1>
        <p className="tagline">{tagline}</p>
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

          {mode !== 'reset' && (
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
          )}

          {mode === 'login' && (
            <button
              type="button"
              className="link forgot"
              onClick={() => switchMode('reset')}
            >
              Password dimenticata?
            </button>
          )}

          {error && <p className="err">{error}</p>}
          {info && <p className="ok">{info}</p>}

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy
              ? 'Attendi…'
              : mode === 'login'
                ? 'Accedi'
                : mode === 'signup'
                  ? 'Registrati'
                  : 'Invia link di reset'}
          </button>
        </form>

        {mode === 'reset' ? (
          <p className="switch">
            Ti sei ricordata la password?{' '}
            <button
              type="button"
              className="link"
              onClick={() => switchMode('login')}
            >
              Torna ad accedere
            </button>
          </p>
        ) : (
          <p className="switch">
            {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}{' '}
            <button
              type="button"
              className="link"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'Registrati' : 'Accedi'}
            </button>
          </p>
        )}
      </section>
    </main>
  )
}
