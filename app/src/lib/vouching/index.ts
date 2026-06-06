// Sistema di vouching (garanti) per nuove utenti (vedi permessi_e_strati.md §2).
// Disponibile solo da Strato 3. Permette di saltare i 7 giorni iniziali di Strato 1.

import { supabase } from '../supabase'

export const VOUCH_CONFIRMATION_HOURS = 48
export const MAX_FAILED_VOUCHES = 3
export const REQUIRED_GUARANTORS = 2

export interface VouchRequest {
  id: string
  new_user_id: string
  status: 'pending' | 'approved' | 'denied' | 'expired'
  created_at: string
  expires_at: string
}

export interface PendingVouchRequest extends VouchRequest {
  new_user_nickname: string
}

// La nuova utente nomina i garanti per nickname; crea la richiesta e le conferme.
// Lancia eccezione se un nickname non esiste, non è Strato 3, o ha già perso il privilegio.
export async function requestVouch(
  newUserId: string,
  guarantorNicknames: [string, string],
): Promise<void> {
  const guarantorIds: string[] = []
  for (const nick of guarantorNicknames) {
    const { data } = await supabase
      .from('public_profiles')
      .select('id, strato, vouch_failed_count')
      .eq('nickname', nick)
      .single()
    if (!data) throw new Error(`Utente "@${nick}" non trovata.`)
    const p = data as { id: string; strato: number; vouch_failed_count: number }
    if (p.strato < 3) throw new Error(`@${nick} non ha ancora raggiunto il Strato 3.`)
    if (p.vouch_failed_count >= MAX_FAILED_VOUCHES)
      throw new Error(`@${nick} ha esaurito il privilegio di garanzia.`)
    if (p.id === newUserId) throw new Error('Non puoi nominare te stessa come garante.')
    guarantorIds.push(p.id)
  }
  if (guarantorIds[0] === guarantorIds[1])
    throw new Error('I due garanti devono essere persone diverse.')

  const { data: req, error: reqErr } = await supabase
    .from('vouch_requests')
    .insert({ new_user_id: newUserId })
    .select('id')
    .single()
  if (reqErr) throw reqErr

  const { error: confErr } = await supabase.from('vouch_confirmations').insert(
    guarantorIds.map((gid) => ({ request_id: req.id, guarantor_id: gid })),
  )
  if (confErr) throw confErr
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

// Lista le richieste in attesa per un garante (tab "Richieste di garanzia" — futuro).
export async function getPendingVouchRequests(
  guarantorId: string,
): Promise<PendingVouchRequest[]> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('vouch_confirmations')
    .select('request_id, vouch_requests!inner(id, new_user_id, status, created_at, expires_at, profiles!inner(nickname))')
    .eq('guarantor_id', guarantorId)
    .eq('status', 'pending')
    .eq('vouch_requests.status', 'pending')
    .gt('vouch_requests.expires_at', now)
  if (error) throw error

  return ((data ?? []) as unknown as {
    vouch_requests: {
      id: string; new_user_id: string; status: string
      created_at: string; expires_at: string
      profiles: { nickname: string }
    }
  }[]).map(({ vouch_requests: r }) => ({
    id: r.id,
    new_user_id: r.new_user_id,
    status: r.status as VouchRequest['status'],
    created_at: r.created_at,
    expires_at: r.expires_at,
    new_user_nickname: r.profiles.nickname,
  }))
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
