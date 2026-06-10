import { useState, type FormEvent } from 'react'
import { verifyPin } from '../lib/pin'

interface Props {
  onUnlock: () => void
}

export function PinLockScreen({ onUnlock }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (verifyPin(pin)) {
      onUnlock()
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <main className="app">
      <header className="brand">
        <h1>Vesper</h1>
        <p className="tagline">App bloccata</p>
      </header>

      <section className="card">
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Inserisci il PIN</span>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(false) }}
              autoFocus
              autoComplete="off"
              placeholder="••••"
            />
          </label>

          {error && <p className="err" role="alert">PIN errato. Riprova.</p>}

          <button type="submit" className="btn-primary" disabled={pin.length < 4}>
            Sblocca
          </button>
        </form>
      </section>
    </main>
  )
}
