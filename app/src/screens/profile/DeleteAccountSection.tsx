import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// Messaggi mostrati all'utente. Non propaghiamo mai il testo grezzo che arriva
// dal server: può essere una stringa tecnica in inglese, un errore del database
// o un oggetto vuoto, e in tutti quei casi chi legge non capirebbe né cosa è
// successo né cosa fare. I dettagli finiscono in console per il debug.
const ERR_RETE =
  'Connessione non riuscita. Il tuo account non è stato toccato: controlla la rete e riprova.'
const ERR_SESSIONE =
  'La tua sessione è scaduta. Esci e rientra nell\'app, poi riprova.'
const ERR_GENERICO =
  'Non siamo riusciti a cancellare il tuo account e non è stato modificato nulla. ' +
  'Riprova tra qualche minuto; se il problema si ripete scrivi a privacy@vespercommunity.com.'

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
        console.error(
          '[delete-account] HTTP', res.status, await res.text().catch(() => ''),
        )
        setErr(res.status === 401 ? ERR_SESSIONE : ERR_GENERICO)
        setBusy(false)
        return
      }
      // Da qui l'account non esiste più: il signOut svuota la sessione locale e
      // AuthProvider riporta l'app alla schermata di accesso.
      await supabase.auth.signOut()
    } catch (e) {
      // fetch rigetta con TypeError quando la richiesta non parte proprio:
      // offline, DNS, CORS. Tutto il resto è un imprevisto vero.
      console.error('[delete-account]', e)
      setErr(e instanceof TypeError ? ERR_RETE : ERR_GENERICO)
      setBusy(false)
    }
  }

  void profileId
  return (
    <section className="card danger-zone box-shadow">
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
          {err && <p className="err" role="alert">{err}</p>}
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
