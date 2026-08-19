// Etichette di separazione per giorno, condivise tra le stanze (ChatScreen) e i
// messaggi privati (DmScreen). I messaggi arrivano già ordinati dal più vecchio
// al più recente: quando il giorno locale cambia rispetto al messaggio
// precedente si inserisce un divisore ("Oggi", "Ieri" o la data completa).

// Chiave di giorno locale (YYYY-MM-DD nel fuso dell'utente) per confrontare due
// timestamp senza farsi ingannare dall'ora.
export function dayKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Etichetta leggibile per il divisore. Oggi e ieri restano parole; le date più
// vecchie mostrano giorno, mese e anno in italiano ("12 agosto 2026").
export function dayLabel(iso: string): string {
  const today = dayKey(new Date().toISOString())
  const yesterday = dayKey(new Date(Date.now() - 86_400_000).toISOString())
  const key = dayKey(iso)
  if (key === today) return 'Oggi'
  if (key === yesterday) return 'Ieri'
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
