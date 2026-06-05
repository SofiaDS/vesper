// Sistema di reputazione invisibile (vedi reputazione.md).
// Visibile solo allo staff. Non sblocca permessi. Non è mai mostrato agli utenti.
// La reputazione parte da 0 e può solo scendere; il decadimento è per evento.

import { supabase } from '../supabase'

// Pesi degli eventi di moderazione (vedi reputazione.md §4.2).
export const REPUTATION_EVENTS = {
  warning:   -1,
  mute_temp: -3,
} as const

export type ReputationEventType = keyof typeof REPUTATION_EVENTS

// Durate (in mesi) prima che un evento esca dal punteggio corrente (vedi reputazione.md §5.1).
const DECAY_MONTHS: Record<ReputationEventType, number> = {
  warning:   3,
  mute_temp: 6,
}

export interface ReputationEvent {
  id: string
  user_id: string
  event_type: ReputationEventType
  weight: number
  expires_at: string
  status: 'active' | 'annulled_appeal'
  moderator_id: string | null
  report_id: string | null
  notes: string | null
  created_at: string
  // Derivato: l'evento conta ancora nel punteggio corrente
  is_active: boolean
}

// Punteggio corrente = somma dei pesi degli eventi ancora in vita.
// 0 = utente normale; ≤ -10 = storia pesante (soglie orientative, vedi reputazione.md §4.5).
export async function getReputationScore(userId: string): Promise<number> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('reputation_events')
    .select('event_type')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', now)
  if (error) throw error

  return (data ?? []).reduce(
    (sum, r) => sum + (REPUTATION_EVENTS[r.event_type as ReputationEventType] ?? 0),
    0,
  )
}

// Storico completo: eventi degli ultimi ~12 mesi, attivi o scaduti.
// I moderatori usano questo per vedere pattern di comportamento (reputazione.md §5.2).
export async function getReputationHistory(userId: string): Promise<ReputationEvent[]> {
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('reputation_events')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', twelveMonthsAgo.toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data ?? []).map((r) => ({
    ...r,
    event_type: r.event_type as ReputationEventType,
    weight: REPUTATION_EVENTS[r.event_type as ReputationEventType] ?? 0,
    is_active: r.status === 'active' && r.expires_at > now,
  }))
}

// Registra un nuovo evento di moderazione confermato.
// Solo eventi confermati entrano nel sistema (reputazione.md §4.2).
export async function applyReputationEvent(
  userId: string,
  eventType: ReputationEventType,
  moderatorId: string,
  reportId?: string,
  notes?: string,
): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + DECAY_MONTHS[eventType])

  const { error } = await supabase.from('reputation_events').insert({
    user_id:      userId,
    event_type:   eventType,
    moderator_id: moderatorId,
    report_id:    reportId ?? null,
    notes:        notes?.trim() || null,
    expires_at:   expiresAt.toISOString(),
  })
  if (error) throw error
}

// Gli eventi scaduti restano nello storico ~12 mesi per GDPR (gdpr_e_legale.md).
// Questa funzione restituisce il conteggio degli eventi scaduti ancora visibili.
// La DELETE effettiva è rimandata a un job schedulato post-lancio.
export async function decayExpiredEvents(userId: string): Promise<number> {
  const now = new Date().toISOString()
  const { count, error } = await supabase
    .from('reputation_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')
    .lt('expires_at', now)
  if (error) throw error
  return count ?? 0
}
