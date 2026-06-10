import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { requestVouch } from '../lib/vouching'
import {
  IDENTITY_OPTIONS,
  ORIENTATION_OPTIONS,
  FOYER_SLUG,
  type IdentityCategory,
  type Orientation,
} from '../lib/types'

type Step = 'profile' | 'vouch'

export function OnboardingScreen() {
  const { session, refreshProfile } = useAuth()

  // Step 1 — profilo
  const [step, setStep] = useState<Step>('profile')
  const [nickname, setNickname] = useState('')
  const [identity, setIdentity] = useState<IdentityCategory | ''>('')
  const [orientations, setOrientations] = useState<Orientation[]>([])
  const [declared, setDeclared] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 2 — vouching opzionale
  const [g1, setG1] = useState('')
  const [g2, setG2] = useState('')
  const [vouchErr, setVouchErr] = useState<string | null>(null)
  const [vouching, setVouching] = useState(false)

  function toggleOrientation(value: Orientation) {
    setOrientations((prev) =>
      prev.includes(value) ? prev.filter((o) => o !== value) : [...prev, value],
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const userId = session?.user.id
    if (!userId) { setError('Sessione non valida, riprova ad accedere.'); return }
    if (nickname.trim().length < 3) { setError('Il nickname deve avere almeno 3 caratteri.'); return }
    if (!identity) { setError('Scegli come ti identifichi.'); return }
    if (!declared) { setError('Per entrare devi dichiarare di appartenere a una delle categorie indicate.'); return }

    setBusy(true)
    try {
      // 1) Crea il profilo (RLS: id deve combaciare con auth.uid()).
      const { error: profileErr } = await supabase.from('profiles').insert({
        id: userId,
        nickname: nickname.trim(),
        identity_category: identity,
        orientations,
      })
      if (profileErr) {
        if (profileErr.code === '23505') throw new Error('Questo nickname è già in uso, scegline un altro.')
        throw profileErr
      }

      // 2) Auto-join al Foyer.
      const { data: foyer, error: foyerErr } = await supabase
        .from('chatrooms').select('id').eq('slug', FOYER_SLUG).single()
      if (foyerErr) throw foyerErr

      const { error: joinErr } = await supabase
        .from('chat_membership').insert({ user_id: userId, chatroom_id: foyer.id })
      if (joinErr && joinErr.code !== '23505') throw joinErr

      // 3) Avanza allo step vouching (non caricare ancora il profilo).
      setStep('vouch')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.')
    } finally {
      setBusy(false)
    }
  }

  async function handleVouch(e: FormEvent) {
    e.preventDefault()
    const userId = session?.user.id
    if (!userId) return
    setVouchErr(null)
    setVouching(true)
    try {
      await requestVouch(userId, [g1.trim(), g2.trim()])
      await refreshProfile()
    } catch (err) {
      setVouchErr(err instanceof Error ? err.message : 'Errore. Riprova o salta.')
      setVouching(false)
    }
  }

  async function handleSkip() {
    await refreshProfile()
  }

  if (step === 'vouch') {
    return (
      <main className="app">
        <header className="brand">
          <h1>Vesper</h1>
          <p className="tagline">Hai delle garanti?</p>
        </header>

        <section className="card">
          <p>
            Se conosci già qualcuna su Vesper che è al <strong>Strato 3</strong> e ti conosce,
            puoi nominarla come garante. Con entrambe le conferme salti l'attesa iniziale e
            accedi subito allo Strato 2.
          </p>
          <p className="hint">
            È opzionale: puoi entrare normalmente e raggiungere lo Strato 2 dopo 7 giorni e
            20 messaggi in chatroom.
          </p>

          <form onSubmit={handleVouch} className="form">
            <label className="field">
              <span>Nickname prima garante</span>
              <input
                type="text"
                value={g1}
                onChange={(e) => setG1(e.target.value)}
                placeholder="@nickname"
                maxLength={24}
              />
            </label>
            <label className="field">
              <span>Nickname seconda garante</span>
              <input
                type="text"
                value={g2}
                onChange={(e) => setG2(e.target.value)}
                placeholder="@nickname"
                maxLength={24}
              />
            </label>

            {vouchErr && <p className="err" role="alert">{vouchErr}</p>}

            <button
              type="submit"
              className="btn-primary"
              disabled={vouching || g1.trim().length < 3 || g2.trim().length < 3}
            >
              {vouching ? 'Invio…' : 'Invia richiesta di garanzia'}
            </button>
          </form>

          <p className="switch" style={{ marginTop: '1rem' }}>
            <button type="button" className="link" onClick={handleSkip} disabled={vouching}>
              Salta — entra senza garanti
            </button>
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="app">
      <header className="brand">
        <h1>Vesper</h1>
        <p className="tagline">Crea il tuo profilo</p>
      </header>

      <section className="card">
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Nickname</span>
            <input
              type="text"
              required
              minLength={3}
              maxLength={24}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="come vuoi farti chiamare"
            />
          </label>

          <fieldset className="field">
            <legend>Come ti identifichi</legend>
            <div className="options">
              {IDENTITY_OPTIONS.map((opt) => (
                <label key={opt.value} className="chip">
                  <input
                    type="radio"
                    name="identity"
                    value={opt.value}
                    checked={identity === opt.value}
                    onChange={() => setIdentity(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="field">
            <legend>Orientamento (opzionale, puoi sceglierne più di uno)</legend>
            <div className="options">
              {ORIENTATION_OPTIONS.map((opt) => (
                <label key={opt.value} className="chip">
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={orientations.includes(opt.value)}
                    onChange={() => toggleOrientation(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="declare">
            <input
              type="checkbox"
              checked={declared}
              onChange={(e) => setDeclared(e.target.checked)}
            />
            <span>
              Dichiaro di appartenere a una delle categorie sopra indicate e di{' '}
              <strong>non essere un uomo cis</strong>. Vesper è uno spazio per
              donne lesbiche, bi e queer, donne trans, uomini trans e persone
              non-binary.
            </span>
          </label>

          {error && <p className="err" role="alert">{error}</p>}

          <button type="submit" className="btn-primary" disabled={busy || !declared}>
            {busy ? 'Creazione…' : 'Entra nel Foyer'}
          </button>
        </form>
      </section>
    </main>
  )
}
