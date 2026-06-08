import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// Card "zona pericolosa" del profilo: cancellazione definitiva dell'account
// (ultima card della schermata profilo, visibile solo guardando il proprio).
export function DeleteAccountSection({ profileId }: { profileId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleDelete() {
    setBusy(true)
    setErr(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? 'Errore nella cancellazione.')
      }
      await supabase.auth.signOut()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Errore. Riprova.')
      setBusy(false)
    }
  }

  void profileId
  return (
    <section className="card danger-zone">
      <h2 className="pf-section-title">Zona pericolosa</h2>
      {!confirm ? (
        <>
          <p className="hint">
            La cancellazione dell'account è definitiva. Tutti i tuoi messaggi, foto e dati
            saranno rimossi in modo permanente.
          </p>
          <button type="button" className="btn-danger" onClick={() => setConfirm(true)}>
            Cancella il mio account
          </button>
        </>
      ) : (
        <>
          <p className="err">
            Sei sicura? Questa operazione è <strong>irreversibile</strong>.
          </p>
          {err && <p className="err">{err}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn-danger" onClick={handleDelete} disabled={busy}>
              {busy ? 'Cancello…' : 'Sì, cancella definitivamente'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setConfirm(false)} disabled={busy}>
              Annulla
            </button>
          </div>
        </>
      )}
    </section>
  )
}
