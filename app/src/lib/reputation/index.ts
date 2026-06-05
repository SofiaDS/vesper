// Sistema di reputazione invisibile (vedi reputazione.md).
// Visibile solo ai moderatori. Non sblocca permessi. Non è mai mostrato agli utenti.
// La reputazione parte da 0 e può solo scendere; il decadimento è per evento.

// TODO: getReputationScore(userId) — restituisce il punteggio corrente
// TODO: getReputationHistory(userId) — restituisce la lista degli eventi con timestamp
//        (per mostrare il trend in dashboard moderatori, non il solo valore)
// TODO: applyReputationEvent(userId, event, moderatorId) — registra un evento di moderazione
//        e aggiorna il punteggio. Solo eventi confermati entrano nel sistema.
// TODO: decayExpiredEvents(userId) — rimuove gli eventi scaduti dal calcolo
//        (warning: 3 mesi, mute: 6 mesi — restano nello storico fino a ~12 mesi)

// Pesi degli eventi di moderazione (vedi reputazione.md §4).
export const REPUTATION_EVENTS = {
  warning: -1,
  mute_temp: -3,
} as const

export type ReputationEventType = keyof typeof REPUTATION_EVENTS
