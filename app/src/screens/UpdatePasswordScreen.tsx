import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { mapSupabaseAuthError, validatePassword } from '../lib/authErrors'

// Mostrata quando si arriva dal link "reimposta password" (evento recovery).
// Qui la sessione e' gia' valida: basta impostare la nuova password.
export function UpdatePasswordScreen() {
  const { clearRecovery } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
      return
    }
    if (password !== confirm) {
      setError('Le due password non coincidono.')
      return
    }

    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      // Password aggiornata: chiudiamo il recovery. La sessione resta valida,
      // quindi l'app prosegue verso la lobby (o l'onboarding).
      clearRecovery()
    } catch (err) {
      mapSupabaseAuthError(err).userMessage
      setBusy(false)
    }
  }

  return (
    <main className="app">
      <header className="brand">
        <h1>Vesper</h1>
        <p className="tagline">Nuova password</p>
      </header>

      <section className="card">
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Nuova password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 8 caratteri, lettere e numeri"
            />
            <span className="hint">
              Almeno 8 caratteri, con lettere e numeri.
            </span>
          </label>

          <label className="field">
            <span>Conferma password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="ripeti la password"
            />
          </label>

          {error && <p className="err">{error}</p>}

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Salvo…' : 'Imposta nuova password'}
          </button>
        </form>
      </section>
    </main>
  )
}
