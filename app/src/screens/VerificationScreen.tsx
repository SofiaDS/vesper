import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

const BUCKET = 'identity-verifications'
const REC_SECONDS = 5

function getSupportedMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

type Step = 'intro' | 'camera' | 'recording' | 'review' | 'uploading'

export function VerificationScreen() {
  const { session, profile, refreshProfile } = useAuth()
  const [step, setStep] = useState<Step>('intro')
  const [countdown, setCountdown] = useState(REC_SECONDS)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const liveRef    = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const recRef     = useRef<MediaRecorder | null>(null)
  const chunksRef  = useRef<Blob[]>([])

  // Mostra il motivo del rifiuto precedente se disponibile
  const rejectionReason = profile?.verification_rejection_reason

  // Avvia la fotocamera
  async function startCamera() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (liveRef.current) {
        liveRef.current.srcObject = stream
        await liveRef.current.play()
      }
      setStep('camera')
    } catch {
      setError(
        'Impossibile accedere alla fotocamera. Verifica i permessi del browser e riprova.',
      )
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  // Avvia la registrazione con countdown
  function startRecording() {
    if (!streamRef.current) return
    chunksRef.current = []
    const mimeType = getSupportedMimeType()
    const rec = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined)
    recRef.current = rec

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    rec.onstop = () => {
      const recorded = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
      const url = URL.createObjectURL(recorded)
      setBlob(recorded)
      setPreviewUrl(url)
      stopCamera()
      setStep('review')
    }

    rec.start(200)
    setStep('recording')
    setCountdown(REC_SECONDS)

    let remaining = REC_SECONDS
    const interval = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        rec.stop()
      }
    }, 1000)
  }

  function retry() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setBlob(null)
    setPreviewUrl(null)
    setError(null)
    startCamera()
  }

  async function upload() {
    if (!blob || !session?.user.id) return
    setStep('uploading')
    setError(null)
    try {
      const ext  = blob.type.includes('mp4') ? 'mp4' : 'webm'
      const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: blob.type, upsert: true })
      if (upErr) throw upErr

      const { error: rpcErr } = await supabase.rpc('submit_verification', {
        p_video_path: path,
      })
      if (rpcErr) throw rpcErr

      await refreshProfile()
      // App.tsx gestisce il redirect alla schermata "In attesa"
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload non riuscito. Riprova.')
      setStep('review')
    }
  }

  // Cleanup stream alla chiusura del componente
  useEffect(() => () => stopCamera(), [])

  // Aggiorna il preview video quando cambia il previewUrl
  useEffect(() => {
    if (previewRef.current && previewUrl) {
      previewRef.current.src = previewUrl
    }
  }, [previewUrl])

  return (
    <main className="app verif">
      <header className="brand">
        <h1>Vesper</h1>
      </header>

      <section className="card">
        {step === 'intro' && (
          <>
            <h2 className="verif-title">Verifica la tua identità</h2>

            {rejectionReason && (
              <p className="verif-rejection">
                ⚠ La tua verifica precedente è stata rifiutata:{' '}
                <strong>{rejectionReason}</strong>
              </p>
            )}
            {!rejectionReason && profile?.verification_status === 'rejected' && (
              <p className="verif-rejection">
                ⚠ La tua verifica precedente è stata rifiutata. Riprova seguendo
                le indicazioni qui sotto.
              </p>
            )}

            <p className="muted">
              Per proteggere la community, verifichiamo che ogni profilo appartenga
              a una persona reale. Registreremo un breve video di {REC_SECONDS} secondi.
            </p>

            <ul className="verif-tips">
              <li>Assicurati di essere in un ambiente ben illuminato</li>
              <li>Tieni il viso ben visibile nella telecamera</li>
              <li>Non coprire il viso con cappelli o maschere</li>
              <li>Il video è visibile solo ai moderatori di Vesper</li>
            </ul>

            {error && <p className="err">{error}</p>}

            <button type="button" className="btn-primary" onClick={startCamera}>
              Inizia verifica
            </button>
          </>
        )}

        {(step === 'camera' || step === 'recording') && (
          <>
            <h2 className="verif-title">
              {step === 'recording' ? `Registrazione… ${countdown}s` : 'Posiziona il viso'}
            </h2>
            <div className="verif-video-wrap">
              <video
                ref={liveRef}
                className="verif-video"
                muted
                playsInline
                autoPlay
              />
              {step === 'recording' && (
                <div className="verif-countdown">{countdown}</div>
              )}
            </div>
            {step === 'camera' && (
              <button
                type="button"
                className="btn-primary"
                onClick={startRecording}
              >
                Registra {REC_SECONDS} secondi
              </button>
            )}
          </>
        )}

        {step === 'review' && previewUrl && (
          <>
            <h2 className="verif-title">Controlla il video</h2>
            <div className="verif-video-wrap">
              <video
                ref={previewRef}
                className="verif-video"
                controls
                playsInline
              />
            </div>
            {error && <p className="err">{error}</p>}
            <div className="verif-actions">
              <button type="button" className="btn-primary" onClick={upload}>
                Invia per revisione
              </button>
              <button type="button" className="btn-ghost" onClick={retry}>
                Rifai
              </button>
            </div>
          </>
        )}

        {step === 'uploading' && (
          <>
            <h2 className="verif-title">Caricamento in corso…</h2>
            <p className="muted">Attendi qualche secondo.</p>
          </>
        )}
      </section>
    </main>
  )
}
