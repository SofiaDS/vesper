import { useEffect, useRef, useState } from 'react'

// Dialog per aggiungere una foto profilo: scelta sorgente (selfie in-app o
// galleria) + ritaglio quadrato (zoom + trascinamento). Produce un JPEG Blob
// gia' quadrato, che il chiamante carica con uploadPhotoFromBlob.

const OUTPUT_SIZE = 1024 // lato del JPEG quadrato finale
const BOX = 300 // lato dell'area di ritaglio a schermo (px logici)
const JPEG_QUALITY = 0.85

type Stage = 'choose' | 'camera' | 'crop'

export function PhotoUploadDialog({
  onClose,
  onComplete,
}: {
  onClose: () => void
  onComplete: (blob: Blob) => void | Promise<void>
}) {
  const [stage, setStage] = useState<Stage>('choose')
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null,
  )

  // Ferma lo stream della fotocamera (pulizia).
  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => stopStream, [])

  // Geometria del ritaglio "cover": l'immagine copre sempre tutta l'area.
  function geom(image: HTMLImageElement, z: number) {
    const base = BOX / Math.min(image.naturalWidth, image.naturalHeight)
    const scale = base * z
    const w = image.naturalWidth * scale
    const h = image.naturalHeight * scale
    return { scale, w, h }
  }

  function clamp(o: { x: number; y: number }, w: number, h: number) {
    return {
      x: Math.min(0, Math.max(BOX - w, o.x)),
      y: Math.min(0, Math.max(BOX - h, o.y)),
    }
  }

  // Ridisegna l'anteprima del ritaglio sul canvas.
  function draw(image: HTMLImageElement, z: number, o: { x: number; y: number }) {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const { w, h } = geom(image, z)
    ctx.clearRect(0, 0, BOX, BOX)
    ctx.drawImage(image, o.x, o.y, w, h)
  }

  useEffect(() => {
    if (stage === 'crop' && img) draw(img, zoom, offset)
  }, [stage, img, zoom, offset])

  function loadFromUrl(url: string, revoke?: () => void) {
    const i = new Image()
    i.onload = () => {
      revoke?.()
      const { w, h } = geom(i, 1)
      setImg(i)
      setZoom(1)
      setOffset(clamp({ x: (BOX - w) / 2, y: (BOX - h) / 2 }, w, h))
      setStage('crop')
    }
    i.onerror = () => {
      revoke?.()
      setErr('Immagine non valida.')
    }
    i.src = url
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setErr('Seleziona un file immagine.')
      return
    }
    setErr(null)
    const url = URL.createObjectURL(f)
    loadFromUrl(url, () => URL.revokeObjectURL(url))
  }

  async function startCamera() {
    setErr(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      setStage('camera')
      // il <video> viene montato al cambio di stage; assegna lo stream dopo.
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      }, 0)
    } catch {
      setErr('Fotocamera non disponibile. Prova con la galleria.')
    }
  }

  function capture() {
    const v = videoRef.current
    if (!v) return
    const vw = v.videoWidth
    const vh = v.videoHeight
    if (!vw || !vh) return
    const tmp = document.createElement('canvas')
    tmp.width = vw
    tmp.height = vh
    const ctx = tmp.getContext('2d')
    if (!ctx) return
    // specchia in orizzontale: il selfie deve combaciare con l'anteprima.
    ctx.translate(vw, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(v, 0, 0, vw, vh)
    const url = tmp.toDataURL('image/jpeg', 0.92)
    stopStream()
    loadFromUrl(url)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!img) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !img) return
    const { w, h } = geom(img, zoom)
    const nx = drag.current.ox + (e.clientX - drag.current.px)
    const ny = drag.current.oy + (e.clientY - drag.current.py)
    setOffset(clamp({ x: nx, y: ny }, w, h))
  }

  function onPointerUp() {
    drag.current = null
  }

  function onZoom(z: number) {
    if (!img) return
    // mantieni il centro dell'area mentre cambia lo zoom.
    const before = geom(img, zoom)
    const after = geom(img, z)
    const cx = (BOX / 2 - offset.x) / before.w
    const cy = (BOX / 2 - offset.y) / before.h
    const nx = BOX / 2 - cx * after.w
    const ny = BOX / 2 - cy * after.h
    setZoom(z)
    setOffset(clamp({ x: nx, y: ny }, after.w, after.h))
  }

  async function confirm() {
    if (!img) return
    setBusy(true)
    setErr(null)
    try {
      const out = document.createElement('canvas')
      out.width = OUTPUT_SIZE
      out.height = OUTPUT_SIZE
      const ctx = out.getContext('2d')
      if (!ctx) throw new Error('Elaborazione non disponibile.')
      const r = OUTPUT_SIZE / BOX
      const { w, h } = geom(img, zoom)
      ctx.drawImage(img, offset.x * r, offset.y * r, w * r, h * r)
      const blob = await new Promise<Blob | null>((res) =>
        out.toBlob(res, 'image/jpeg', JPEG_QUALITY),
      )
      if (!blob) throw new Error('Conversione non riuscita.')
      await onComplete(blob)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Operazione non riuscita.')
      setBusy(false)
    }
  }

  function close() {
    stopStream()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {stage === 'choose' && (
          <>
            <h3 className="modal-title">Aggiungi una foto</h3>
            <div className="upload-choices">
              <button type="button" className="btn-primary" onClick={startCamera}>
                Scatta un selfie
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => fileRef.current?.click()}
              >
                Scegli dalla galleria
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPickFile}
            />
            {err && <p className="err">{err}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={close}>
                Annulla
              </button>
            </div>
          </>
        )}

        {stage === 'camera' && (
          <>
            <h3 className="modal-title">Scatta un selfie</h3>
            <div className="camera-wrap">
              <video
                ref={videoRef}
                className="camera-video"
                playsInline
                muted
              />
            </div>
            {err && <p className="err">{err}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  stopStream()
                  setStage('choose')
                }}
              >
                Indietro
              </button>
              <button type="button" className="btn-primary" onClick={capture}>
                Scatta
              </button>
            </div>
          </>
        )}

        {stage === 'crop' && (
          <>
            <h3 className="modal-title">Ritaglia</h3>
            <p className="hint">Trascina per spostare, usa il cursore per lo zoom.</p>
            <div
              className="crop-box"
              style={{ width: BOX, height: BOX }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <canvas ref={canvasRef} width={BOX} height={BOX} />
              <div className="crop-ring" />
            </div>
            <input
              type="range"
              className="crop-zoom"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => onZoom(Number(e.target.value))}
            />
            {err && <p className="err">{err}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setImg(null)
                  setStage('choose')
                }}
                disabled={busy}
              >
                Indietro
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirm}
                disabled={busy}
              >
                {busy ? 'Carico…' : 'Usa foto'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
