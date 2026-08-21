import { useEffect, useRef, useState } from 'react'
import { primaryPhotoPaths, signedUrls } from '../lib/photos'

// Miniature per i risultati di ricerca: la foto principale approvata di
// ciascun profilo (o la prima disponibile), già firmata e pronta per un <img>.
// Chi non ha foto approvate resta fuori dalla mappa e ricade sull'avatar.
//
// La ricerca pagina ("Carica altri" accoda risultati), quindi teniamo memoria
// degli id già chiesti — anche di quelli risultati senza foto — e a ogni
// pagina interroghiamo solo i nuovi.
export function useProfileThumbs(userIds: string[]): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(new Map())
  const asked = useRef<Set<string>>(new Set())

  // La lista di id è un array nuovo a ogni render: dipendere da lui farebbe
  // ripartire l'effetto ogni volta. La chiave stringa cambia solo quando
  // cambiano davvero i risultati.
  const key = userIds.join(',')

  useEffect(() => {
    const missing = key ? key.split(',').filter((id) => !asked.current.has(id)) : []
    if (missing.length === 0) return
    missing.forEach((id) => asked.current.add(id))

    let alive = true
    ;(async () => {
      try {
        const paths = await primaryPhotoPaths(missing)
        const signed = await signedUrls(Object.values(paths))
        if (!alive) return
        setUrls((prev) => {
          const next = new Map(prev)
          for (const [userId, path] of Object.entries(paths)) {
            if (signed[path]) next.set(userId, signed[path])
          }
          return next
        })
      } catch {
        // Nessuna miniatura: si resta sull'avatar. Non vale un errore a schermo
        // in una schermata che per il resto ha funzionato.
      }
    })()

    return () => {
      alive = false
    }
  }, [key])

  return urls
}
