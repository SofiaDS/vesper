import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { mapSupabaseAuthError, validatePassword } from '../lib/authErrors'

type Mode = 'login' | 'signup' | 'reset' | 'declare'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [declared, setDeclared] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
    if (next !== 'declare') setDeclared(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)

    if (mode === 'signup') {
      const pwError = validatePassword(password)
      if (pwError) {
        setError(pwError)
        setBusy(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Le password non coincidono.')
        setBusy(false)
        return
      }
    }

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setInfo(
          "Se l'indirizzo è corretto, ti abbiamo inviato un'email con il link di conferma. Controlla la posta (anche lo spam).",
        )
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setInfo(
          "Se l'indirizzo è corretto, ti abbiamo inviato un'email per reimpostare la password. Controlla la posta (anche lo spam).",
        )
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      // Bug fix: era `throw mapSupabaseAuthError(err)` — l'errore non veniva mai
      // mostrato in UI perché veniva ri-lanciato invece di settare lo state.
      setError(mapSupabaseAuthError(err).userMessage)
    } finally {
      setBusy(false)
    }
  }

  const tagline =
    mode === 'login'    ? 'Accedi'
    : mode === 'signup' ? 'Crea il tuo account'
    : mode === 'declare'? 'Prima di procedere'
    :                     'Reimposta la password'

  if (mode === 'declare') {
    return (
      <main className="app">
        <header className="brand">
          <h1>Vesper</h1>
          <p className="tagline">{tagline}</p>
        </header>
        <section className="card box-shadow">
          <p>
            Vesper è uno spazio dedicato alla community lesbica, bisessuale e queer femminile.
          </p>
          <p>
            Sono benvenute <strong>donne cis, donne trans, uomini trans e persone non-binary AFAB</strong>.
          </p>
          <p>
            L'iscrizione <strong>non è aperta a uomini cis</strong>, per preservare la natura di questo spazio.
          </p>
          <label className="declare">
            <input
              type="checkbox"
              checked={declared}
              onChange={(e) => setDeclared(e.target.checked)}
            />
            <span>
              Dichiaro sotto la mia responsabilità di riconoscermi tra le categorie ammesse e di non
              essere un uomo cis. Comprendo che una dichiarazione mendace comporterà il ban definitivo
              dall'app.
            </span>
          </label>
          <button
            type="button"
            className="btn-primary btn-wide"
            disabled={!declared}
            onClick={() => switchMode('signup')}
          >
            Continua
          </button>
          <button type="button" className="btn-secondary" onClick={() => switchMode('login')}>
            Torna ad accedere
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app">
      <header className="brand">
        <h1>Vesper</h1>
        <p className="tagline">{tagline}</p>
      </header>

      <section className="card box-shadow">
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
              aria-describedby={error ? 'auth-error' : undefined}
              aria-invalid={error ? true : undefined}
            />
          </label>

          {mode !== 'reset' && (
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === 'signup'
                    ? 'min 8 caratteri, lettere e numeri'
                    : 'la tua password'
                }
                aria-describedby={error ? 'auth-error' : undefined}
                aria-invalid={error ? true : undefined}
              />
              {mode === 'signup' && (
                <span className="hint">Almeno 8 caratteri, con lettere e numeri.</span>
              )}
            </label>
          )}

          {mode === 'signup' && (
            <label className="field">
              <span>Conferma password</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="ripeti la password"
                aria-describedby={error ? 'auth-error' : undefined}
                aria-invalid={error ? true : undefined}
              />
            </label>
          )}

          {mode === 'login' && (
            <button type="button" className="link forgot" onClick={() => switchMode('reset')}>
              Password dimenticata?
            </button>
          )}

          {error && <p id="auth-error" className="err" role="alert">{error}</p>}
          {info && <p className="ok" role="status">{info}</p>}

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
            <button type="button" className="link" onClick={() => switchMode('login')}>
              Torna ad accedere
            </button>
          </p>
        ) : mode === 'login' ? (
          <button type="button" className="btn-secondary" onClick={() => switchMode('declare')}>
            Registrati
          </button>
        ) : (
          <p className="switch">
            Hai già un account?{' '}
            <button type="button" className="link" onClick={() => switchMode('login')}>
              Accedi
            </button>
          </p>
        )}
      </section>
    </main>
  )
}
