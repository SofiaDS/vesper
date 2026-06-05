import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import {
  IDENTITY_OPTIONS,
  ORIENTATION_OPTIONS,
  FOYER_SLUG,
  type IdentityCategory,
  type Orientation,
} from '../lib/types'

export function OnboardingScreen() {
  const { session, refreshProfile } = useAuth()
  const [nickname, setNickname] = useState('')
  const [identity, setIdentity] = useState<IdentityCategory | ''>('')
  const [orientations, setOrientations] = useState<Orientation[]>([])
  const [declared, setDeclared] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleOrientation(value: Orientation) {
    setOrientations((prev) =>
      prev.includes(value)
        ? prev.filter((o) => o !== value)
        : [...prev, value],
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const userId = session?.user.id
    if (!userId) {
      setError('Sessione non valida, riprova ad accedere.')
      return
    }
    if (nickname.trim().length < 3) {
      setError('Il nickname deve avere almeno 3 caratteri.')
      return
    }
    if (!identity) {
      setError('Scegli come ti identifichi.')
      return
    }
    if (!declared) {
      setError(
        'Per entrare devi dichiarare di appartenere a una delle categorie indicate.',
      )
      return
    }

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
        // 23505 = violazione unique (nickname gia' preso).
        if (profileErr.code === '23505') {
          throw new Error('Questo nickname è già in uso, scegline un altro.')
        }
        throw profileErr
      }

      // 2) Auto-join al Foyer: trova la stanza globale per slug.
      const { data: foyer, error: foyerErr } = await supabase
        .from('chatrooms')
        .select('id')
        .eq('slug', FOYER_SLUG)
        .single()
      if (foyerErr) throw foyerErr

      const { error: joinErr } = await supabase
        .from('chat_membership')
        .insert({ user_id: userId, chatroom_id: foyer.id })
      // Ignora il duplicato se per qualche motivo era gia' iscritta.
      if (joinErr && joinErr.code !== '23505') throw joinErr

      // 3) Ricarica il profilo: l'App passera' automaticamente alla home.
      await refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.')
    } finally {
      setBusy(false)
    }
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

          {error && <p className="err">{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={busy || !declared}
          >
            {busy ? 'Creazione…' : 'Entra nel Foyer'}
          </button>
        </form>
      </section>
    </main>
  )
}
