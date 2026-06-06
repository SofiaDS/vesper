import { useEffect, useState } from 'react'
import { listApprovedPhotos, signedUrls } from '../lib/photos'

export function PhotoCarousel({
  userId,
  fallback,
  onReportPhoto,
}: {
  userId: string
  fallback: React.ReactNode
  // Se fornito, mostra un pulsante per segnalare la foto visibile (profilo altrui).
  onReportPhoto?: (photoId: string) => void
}) {
  const [items, setItems] = useState<{ id: string; url: string }[]>([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await listApprovedPhotos(userId)
        const map = await signedUrls(list.map((p) => p.storage_path))
        const ordered = list
          .map((p) => ({ id: p.id, url: map[p.storage_path] }))
          .filter((x): x is { id: string; url: string } => Boolean(x.url))
        if (alive) setItems(ordered)
      } catch {
        // In anteprima ignoriamo gli errori: si mostra il fallback.
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [userId])

  if (loading) return <div className="carousel loading" />
  if (items.length === 0) return <>{fallback}</>

  const safe = Math.min(idx, items.length - 1)
  return (
    <div className="carousel">
      <img className="carousel-img" src={items[safe].url} alt="Foto profilo" />
      {onReportPhoto && (
        <button
          type="button"
          className="carousel-report"
          title="Segnala foto"
          aria-label="Segnala foto"
          onClick={() => onReportPhoto(items[safe].id)}
        >
          ⚑
        </button>
      )}
      {items.length > 1 && (
        <>
          <button
            type="button"
            className="carousel-nav prev"
            onClick={() => setIdx((safe - 1 + items.length) % items.length)}
            aria-label="Foto precedente"
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-nav next"
            onClick={() => setIdx((safe + 1) % items.length)}
            aria-label="Foto successiva"
          >
            ›
          </button>
          <div className="carousel-dots">
            {items.map((_, i) => (
              <span key={i} className={i === safe ? 'dot on' : 'dot'} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
