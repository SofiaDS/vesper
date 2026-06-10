import { useState, type FormEvent } from 'react'
import { hasPin, setPin, verifyPin, removePin, lock } from '../../lib/pin'

type Mode = 'idle' | 'set' | 'change' | 'remove'

function PinField({ label, value, onChange }: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        autoComplete="off"
        placeholder="••••"
      />
    </label>
  )
}

export function PinSetupSection() {
  const [mode, setMode]       = useState<Mode>('idle')
  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr]         = useState<string | null>(null)
  const [ok, setOk]           = useState<string | null>(null)
  const pinActive = hasPin()

  function reset(msg?: string) {
    setMode('idle'); setCurrent(''); setNext(''); setConfirm(''); setErr(null)
    if (msg) setOk(msg)
  }

  function handleSet(e: FormEvent) {
    e.preventDefault()
    if (next.length < 4)   { setErr('Il PIN deve avere almeno 4 cifre.'); return }
    if (next !== confirm)  { setErr('I PIN non coincidono.'); return }
    setPin(next)
    reset('PIN impostato.')
  }

  function handleChange(e: FormEvent) {
    e.preventDefault()
    if (!verifyPin(current)) { setErr('PIN attuale errato.'); return }
    if (next.length < 4)    { setErr('Il nuovo PIN deve avere almeno 4 cifre.'); return }
    if (next !== confirm)   { setErr('I PIN non coincidono.'); return }
    setPin(next)
    reset('PIN aggiornato.')
  }

  function handleRemove(e: FormEvent) {
    e.preventDefault()
    if (!verifyPin(current)) { setErr('PIN errato.'); return }
    removePin()
    reset('PIN rimosso.')
  }

  if (mode === 'set') return (
    <form className="form" onSubmit={handleSet}>
      <PinField label="Nuovo PIN" value={next} onChange={setNext} />
      <PinField label="Conferma PIN" value={confirm} onChange={setConfirm} />
      {err && <p className="err" role="alert">{err}</p>}
      <div className="composer inline-add">
        <button type="button" className="link" onClick={() => reset()}>Annulla</button>
        <button type="submit" className="btn-primary">Imposta</button>
      </div>
    </form>
  )

  if (mode === 'change') return (
    <form className="form" onSubmit={handleChange}>
      <PinField label="PIN attuale" value={current} onChange={setCurrent} />
      <PinField label="Nuovo PIN" value={next} onChange={setNext} />
      <PinField label="Conferma nuovo PIN" value={confirm} onChange={setConfirm} />
      {err && <p className="err" role="alert">{err}</p>}
      <div className="composer inline-add">
        <button type="button" className="link" onClick={() => reset()}>Annulla</button>
        <button type="submit" className="btn-primary">Aggiorna</button>
      </div>
    </form>
  )

  if (mode === 'remove') return (
    <form className="form" onSubmit={handleRemove}>
      <PinField label="PIN attuale" value={current} onChange={setCurrent} />
      {err && <p className="err">{err}</p>}
      <div className="composer inline-add">
        <button type="button" className="link" onClick={() => reset()}>Annulla</button>
        <button type="submit" className="btn-primary" style={{ background: 'var(--error)' }}>
          Rimuovi PIN
        </button>
      </div>
    </form>
  )

  return (
    <div>
      {ok && <p className="ok">{ok}</p>}
      {!pinActive ? (
        <button type="button" className="btn-ghost" onClick={() => { setOk(null); setMode('set') }}>
          Imposta PIN di blocco
        </button>
      ) : (
        <div className="composer inline-add">
          <button type="button" className="btn-ghost" onClick={() => { setOk(null); setMode('change') }}>
            Cambia PIN
          </button>
          <button type="button" className="link" onClick={() => { setOk(null); setMode('remove') }}>
            Rimuovi
          </button>
          <button type="button" className="link" onClick={() => { lock(); window.location.reload() }}>
            Blocca ora
          </button>
        </div>
      )}
      <p className="hint" style={{ marginTop: '0.5rem' }}>
        Il PIN blocca l'app alla chiusura del tab. Non sostituisce la password del tuo account.
      </p>
    </div>
  )
}
