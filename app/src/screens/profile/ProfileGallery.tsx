import { useEffect, useRef, useState } from 'react'
import { listApprovedPhotos, signedUrls } from '../../lib/photos'
import { useModalA11y } from '../../hooks/useModalA11y'

type GalleryPhoto = { id: string; url: string }

// Galleria foto del profilo: striscia di miniature grandi e scorrevoli che si
// aprono a schermo intero (con navigazione) cliccandoci — usata sia per il
// proprio profilo che per quello altrui (vedi ProfileLayout). Sostituisce il
// vecchio PhotoCarousel a foto singola.
export function ProfileGallery({
  userId,
  onReportPhoto,
}: {
  userId: string
  // Se fornito, mostra un pulsante per segnalare la foto aperta (profilo altrui).
  onReportPhoto?: (photoId: string) => void
}) {
  const [items, setItems] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const lightboxRef = useRef<HTMLDivElement | null>(null)

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
        if (alive) setItems(ordered)
      } catch {
        // Nessuna foto da mostrare: la card resta vuota.
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [userId])

  if (loading) return <div className="gallery-strip loading" />
  if (items.length === 0) return <p className="hint">Nessuna foto da mostrare.</p>

  const opened = openIdx != null ? items[openIdx] : null

  useModalA11y(lightboxRef, opened != null, () => setOpenIdx(null))

  return (
    <>
      <div className="gallery-strip">
        {items.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            className="gallery-thumb"
            onClick={() => setOpenIdx(i)}
            aria-label="Ingrandisci foto"
          >
            <img src={photo.url} alt="Foto profilo" />
          </button>
        ))}
      </div>

      {opened && openIdx != null && (
        <div className="modal-overlay" onClick={() => setOpenIdx(null)}>
          <div
            ref={lightboxRef}
            className="lightbox"
            role="dialog"
            aria-modal="true"
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
                  ‹
                </button>
                <button
                  type="button"
                  className="carousel-nav next"
                  onClick={() => setOpenIdx((openIdx + 1) % items.length)}
                  aria-label="Foto successiva"
                >
                  ›
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
