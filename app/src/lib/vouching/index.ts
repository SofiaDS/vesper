// Sistema di vouching (garanti) per nuove utenti (vedi permessi_e_strati.md §2).
// Disponibile solo da Strato 3. Permette di saltare i 7 giorni iniziali di Strato 1.

import { supabase } from '../supabase'

// Valori di riferimento per la UI. Le regole vere sono applicate dal database
// (default di vouch_requests.expires_at, RPC request_vouch e respond_to_vouch):
// se cambiano lì, vanno riallineati qui.
export const VOUCH_CONFIRMATION_HOURS = 48
export const MAX_FAILED_VOUCHES = 3
export const REQUIRED_GUARANTORS = 2

// Quanto manca alla scadenza, in parole. Le richieste durano 48 ore: sotto
// l'ora si scende ai minuti, altrimenti "meno di un'ora" resterebbe l'unica
// cosa mostrata per tutto l'ultimo tratto — proprio quando serve decidere.
export function vouchTimeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'scaduta'
  const hours = Math.floor(ms / 3_600_000)
  if (hours >= 1) return `${hours} ${hours === 1 ? 'ora' : 'ore'}`
  const mins = Math.max(1, Math.floor(ms / 60_000))
  return `${mins} ${mins === 1 ? 'minuto' : 'minuti'}`
}

// Una richiesta ancora aperta, vista dal garante che deve rispondere.
export interface PendingVouchRequest {
  id: string
  new_user_nickname: string
  created_at: string
  expires_at: string
}

// La nuova utente nomina i garanti per nickname; crea la richiesta e le conferme.
//
// Tutto server-side, in un'unica RPC: la validazione ha bisogno di `strato` e
// `vouch_failed_count`, che public_profiles non espone di proposito, e
// vouch_confirmations non è scrivibile dal client (nessuna policy INSERT).
// La versione precedente provava a fare entrambe le cose dal browser e
// falliva sempre, riportando "utente non trovata" per qualsiasi nickname.
//
// I messaggi d'errore arrivano già in italiano dalle `raise exception` della
// RPC (nickname inesistente, garante sotto lo Strato 3, privilegio esaurito,
// garanti uguali, richiesta già in corso).
export async function requestVouch(
  guarantorNicknames: [string, string],
): Promise<void> {
  const { error } = await supabase.rpc('request_vouch', {
    p_nicknames: guarantorNicknames,
  })
  if (error) throw new Error(error.message)
}

// Il garante accetta la richiesta.
// Se entrambi i garanti confermano, l'RPC promuove la nuova utente a Strato 2.
export async function confirmVouch(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('respond_to_vouch', {
    p_request_id: requestId,
    p_confirmed: true,
  })
  if (error) throw error
}

// Il garante rifiuta la richiesta.
// L'RPC marca la richiesta come 'denied' e incrementa il vouch_failed_count del garante.
export async function denyVouch(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('respond_to_vouch', {
    p_request_id: requestId,
    p_confirmed: false,
  })
  if (error) throw error
}

// Lista le richieste ancora aperte in cui chi chiama è garante.
//
// Passa dalla RPC `pending_vouch_requests` e non da una query con join, per lo
// stesso motivo di `requestVouch`: al garante la RLS nasconde sia
// `vouch_requests` (policy solo per la richiedente e lo staff) sia il `profiles`
// della richiedente. La versione precedente faceva il join dal browser e
// tornava sempre una lista vuota — la notifica partiva, ma non c'era modo di
// vedere la richiesta a cui si riferiva.
//
// Il garante è implicito (`auth.uid()` dentro la funzione): non si passa un id.
export async function getPendingVouchRequests(): Promise<PendingVouchRequest[]> {
  const { data, error } = await supabase.rpc('pending_vouch_requests')
  if (error) throw error

  return ((data ?? []) as {
    request_id: string
    new_user_nickname: string
    created_at: string
    expires_at: string
  }[]).map((r) => ({
    id: r.request_id,
    new_user_nickname: r.new_user_nickname,
    created_at: r.created_at,
    expires_at: r.expires_at,
  }))
}

// La richiesta di garanzia ancora aperta di chi sta guardando, se esiste.
//
// Serve alla schermata di verifica: senza, chi ha appena nominato le garanti si
// trova subito davanti al video e lo registra comunque, rendendo inutile la
// scorciatoia. Qui non serve una RPC — la policy `vouch_req_select_self` lascia
// già leggere alla richiedente la propria riga, ed è l'unica che tornerebbe.
export async function getMyPendingVouch(): Promise<{ expires_at: string } | null> {
  const { data, error } = await supabase
    .from('vouch_requests')
    .select('expires_at')
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (error) return null
  return (data as { expires_at: string } | null) ?? null
}

// Registra manualmente una garanzia fallita (solo staff, per revisioni post-hoc).
export async function recordFailedVouch(guarantorId: string): Promise<void> {
  const { error } = await supabase.rpc('record_failed_vouch', {
    p_guarantor_id: guarantorId,
  })
  if (error) throw error
}

// Verifica se un utente può ancora garantire per nuove iscritte.
export async function getVouchPrivilegeStatus(
  userId: string,
): Promise<{ canVouch: boolean; failedCount: number }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('strato, vouch_failed_count')
    .eq('id', userId)
    .single()
  if (error) throw error
  const p = data as { strato: number; vouch_failed_count: number }
  return {
    canVouch: p.strato >= 3 && p.vouch_failed_count < MAX_FAILED_VOUCHES,
    failedCount: p.vouch_failed_count,
  }
}
