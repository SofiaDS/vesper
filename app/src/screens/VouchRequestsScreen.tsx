import { useEffect, useRef, useState } from 'react'
import { Handshake } from '@phosphor-icons/react'
import { AppHeader } from '../components/AppHeader'
import { AnimatedLoader } from '../components/AnimatedLoader'
import { useModalA11y } from '../hooks/useModalA11y'
import {
  getPendingVouchRequests,
  confirmVouch,
  denyVouch,
  vouchTimeLeft,
  type PendingVouchRequest,
} from '../lib/vouching'

// Le richieste di garanzia in cui sono io la garante, con approva/rifiuta.
// Il contraltare dello step "Hai delle garanti?" dell'onboarding: senza questa
// schermata la notifica push chiedeva di rispondere a qualcosa di irraggiungibile.
export function VouchRequestsScreen({
  onBack,
  backLabel = '‹ Altro',
  onChange,
}: {
  onBack: () => void
  backLabel?: string
  // Chiamata dopo ogni risposta, così il badge nella shell si riallinea senza
  // aspettare un remount.
  onChange?: () => void
}) {
  const [requests, setRequests] = useState<PendingVouchRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmDeny, setConfirmDeny] = useState<PendingVouchRequest | null>(null)
  const denyModalRef = useRef<HTMLDivElement | null>(null)
  useModalA11y(denyModalRef, !!confirmDeny, () => setConfirmDeny(null))

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await getPendingVouchRequests()
        if (alive) setRequests(list)
      } catch {
        if (alive) setError('Impossibile caricare le richieste.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // Approvazione e rifiuto differiscono solo per la RPC chiamata: in entrambi i
  // casi la richiesta esce dalla lista, perché non è più "in attesa".
  async function respond(req: PendingVouchRequest, confirmed: boolean) {
    setBusy(req.id)
    setError(null)
    try {
      if (confirmed) await confirmVouch(req.id)
      else await denyVouch(req.id)
      setRequests((prev) => prev.filter((r) => r.id !== req.id))
      onChange?.()
    } catch (e) {
      // Gli errori di respond_to_vouch arrivano già in italiano dalle sue
      // `raise exception` (richiesta scaduta, non più in attesa, non sei
      // garante): sono utili da leggere, a differenza di un errore tecnico.
      setError(e instanceof Error ? e.message : 'Operazione non riuscita. Riprova.')
    } finally {
      setBusy(null)
      setConfirmDeny(null)
    }
  }

  return (
    <main className="app profile">
      <AppHeader backLabel={backLabel} onBack={onBack} title="Richieste di garanzia" />

      {loading && <AnimatedLoader />}
      {error && <p className="err chat-error" role="alert">{error}</p>}

      {!loading && requests.length === 0 && (
        <div className="empty-state">
          <Handshake size={64} weight="duotone" aria-hidden="true" />
          <p className="hint">Nessuna richiesta in attesa.</p>
          <p className="muted small-inline">
            Quando una nuova iscritta ti indica come garante la trovi qui, e hai 48 ore
            per rispondere.
          </p>
        </div>
      )}

      {requests.length > 0 && (
        <section className="card box-shadow">
          {/* Cosa comporta approvare va detto per intero: dalla modifica dell'11
              ago 2026 due garanzie sostituiscono la verifica col video, quindi
              chi approva sta attestando che la persona è reale — non sta solo
              accorciandole l'attesa. */}
          <p className="hint">
            Confermi di conoscere questa persona e che è reale? Con la tua garanzia e
            quella dell&apos;altra garante, entra subito allo Strato 2 e{' '}
            <strong>non deve registrare il video di verifica</strong>.
          </p>
          <ul className="mod-people">
            {requests.map((r) => (
              <li key={r.id} className="mod-row">
                <span>
                  <strong>@{r.new_user_nickname}</strong>
                  <br />
                  <span className="muted small-inline">
                    scade tra {vouchTimeLeft(r.expires_at)}
                  </span>
                </span>
                {/* Stessa coppia .btn-approve/.btn-reject delle schermate di
                    moderazione (Verifiche, Foto), nello stesso ordine: è la
                    stessa decisione — approvare o rifiutare una persona — e non
                    ha motivo di presentarsi diversamente. */}
                <span style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-approve"
                    onClick={() => respond(r, true)}
                    disabled={busy === r.id}
                  >
                    {busy === r.id ? 'Invio…' : 'Approva'}
                  </button>
                  <button
                    type="button"
                    className="btn-reject"
                    onClick={() => setConfirmDeny(r)}
                    disabled={busy === r.id}
                  >
                    Rifiuta
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {confirmDeny && (
        <div className="modal-overlay" onClick={() => setConfirmDeny(null)}>
          <div
            ref={denyModalRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Rifiutare la garanzia?</h2>
            {/* Nessun avviso di penalità: dall'11 ago 2026 rifiutare non ha
                conseguenze per il garante (vedi migration
                20260811160000_vouch_skips_video_and_no_deny_penalty). */}
            <p className="muted small-inline">
              La richiesta di <strong>@{confirmDeny.new_user_nickname}</strong> verrà
              respinta. Potrà comunque iscriversi, ma dovrà verificarsi col video e
              aspettare i 7 giorni iniziali. Rifiutare non ha conseguenze per te.
            </p>
            <div className="modal-actions modal-actions-col">
              <button
                type="button"
                className="btn-danger"
                onClick={() => respond(confirmDeny, false)}
                disabled={busy === confirmDeny.id}
              >
                {busy === confirmDeny.id ? 'Invio…' : 'Sì, rifiuta'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setConfirmDeny(null)}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
