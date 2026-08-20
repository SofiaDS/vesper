import { useEffect, useRef, useState } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { listApprovedPhotos, signedUrls } from '../../lib/photos'
import { useModalA11y } from '../../hooks/useModalA11y'

type GalleryPhoto = { id: string; url: string }

// Foto del profilo, redesign 2B: un mosaico a filo bordo in cima alla
// schermata (foto principale grande a sinistra, due celle in colonna a
// destra) al posto della vecchia card «Foto» con la griglia 3×N. Le foto
// oltre la terza non spariscono: la terza cella porta un overlay «+N» e la
// lightbox continua a scorrerle tutte.
//
// Senza foto approvate il componente non disegna nulla (nemmeno un
// segnaposto): il profilo passa direttamente all'avatar, senza buco.
export function ProfileGallery({
  userId,
  onReportPhoto,
  onLoaded,
}: {
  userId: string
  // Se fornito, mostra un pulsante per segnalare la foto aperta (profilo altrui).
  onReportPhoto?: (photoId: string) => void
  // Quante foto approvate sono state trovate (0 comprese). Serve a chi ci
  // contiene per sapere se il mosaico c'è: senza foto l'avatar dell'hero non
  // deve più risalire a sovrapporsi a un mosaico che non esiste.
  onLoaded?: (count: number) => void
}) {
  const [items, setItems] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const lightboxRef = useRef<HTMLDivElement | null>(null)
  // Tenuta in un ref così un onLoaded ricreato a ogni render non fa ripartire
  // il caricamento delle foto.
  const onLoadedRef = useRef(onLoaded)
  onLoadedRef.current = onLoaded

  useEffect(() => {
    let alive = true
    setLoading(true)
    setItems([])
    setOpenIdx(null)
    ;(async () => {
      try {
        const list = await listApprovedPhotos(userId)
        const map = await signedUrls(list.map((p) => p.storage_path))
        const ordered = list
          .map((p) => ({ id: p.id, url: map[p.storage_path] }))
          .filter((x): x is GalleryPhoto => Boolean(x.url))
        if (alive) {
          setItems(ordered)
          onLoadedRef.current?.(ordered.length)
        }
      } catch {
        // Nessuna foto da mostrare: il mosaico resta assente.
        if (alive) onLoadedRef.current?.(0)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [userId])

  const opened = openIdx != null ? items[openIdx] : null

  useModalA11y(lightboxRef, opened != null, () => setOpenIdx(null))

  if (loading)
    return (
      <div className="pf-mosaic" aria-busy="true">
        <div className="pf-mosaic-main pf-mosaic-ph" />
        <div className="pf-mosaic-side">
          <div className="pf-mosaic-ph" />
          <div className="pf-mosaic-ph" />
        </div>
      </div>
    )
  if (items.length === 0) return null

  // Al massimo tre celle visibili: la principale e due di spalla. Con una o
  // due foto le celle mancanti non vengono disegnate e la principale si
  // allarga, così non restano riquadri vuoti.
  const side = items.slice(1, 3)
  const hidden = items.length - 3

  function cell(photo: GalleryPhoto, index: number, extraLabel?: string) {
    return (
      <button
        key={photo.id}
        type="button"
        className="pf-mosaic-cell"
        onClick={() => setOpenIdx(index)}
        aria-label={extraLabel ?? `Ingrandisci foto ${index + 1} di ${items.length}`}
      >
        <img src={photo.url} alt="" />
        {extraLabel && (
          <span className="pf-mosaic-more" aria-hidden="true">+{hidden}</span>
        )}
      </button>
    )
  }

  return (
    <>
      <div className="pf-mosaic">
        <div className="pf-mosaic-main">{cell(items[0], 0)}</div>
        {side.length > 0 && (
          <div className="pf-mosaic-side">
            {side.map((photo, i) =>
              // L'overlay «+N» sta sull'ultima cella solo se restano foto fuori.
              cell(
                photo,
                i + 1,
                i === side.length - 1 && hidden > 0
                  ? `Vedi tutte le foto: altre ${hidden} oltre a questa`
                  : undefined,
              ),
            )}
          </div>
        )}
      </div>

      {opened && openIdx != null && (
        <div className="modal-overlay" onClick={() => setOpenIdx(null)}>
          <div
            ref={lightboxRef}
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Foto profilo a schermo intero"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <img className="lightbox-img" src={opened.url} alt="Foto profilo ingrandita" />
            {onReportPhoto && (
              <button
                type="button"
                className="carousel-report"
                title="Segnala foto"
                aria-label="Segnala foto"
                onClick={() => onReportPhoto(opened.id)}
              >
                ⚑
              </button>
            )}
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  className="carousel-nav prev"
                  onClick={() => setOpenIdx((openIdx - 1 + items.length) % items.length)}
                  aria-label="Foto precedente"
                >
                  <CaretLeft size={22} weight="bold" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="carousel-nav next"
                  onClick={() => setOpenIdx((openIdx + 1) % items.length)}
                  aria-label="Foto successiva"
                >
                  <CaretRight size={22} weight="bold" aria-hidden="true" />
                </button>
              </>
            )}
            <button type="button" className="lightbox-close" onClick={() => setOpenIdx(null)} aria-label="Chiudi">
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
