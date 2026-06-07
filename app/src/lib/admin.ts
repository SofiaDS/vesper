// Helper per le pagine admin/moderatore. Tutto passa dalla RLS:
// - lo staff (admin/moderator) puo' leggere/moderare tutte le foto e le segnalazioni;
// - solo l'admin puo' assegnare/revocare il ruolo moderatore (funzioni RPC).
import { supabase } from './supabase'
import { signedUrls, type ProfilePhoto, type PhotoStatus } from './photos'

// --- Risoluzione nickname (dalla view mascherata public_profiles) ---
async function nicknamesFor(ids: string[]): Promise<Record<string, string>> {
  const uniq = [...new Set(ids.filter(Boolean))]
  if (uniq.length === 0) return {}
  const { data } = await supabase
    .from('public_profiles')
    .select('id, nickname')
    .in('id', uniq)
  const map: Record<string, string> = {}
  for (const r of (data as { id: string; nickname: string }[]) ?? [])
    map[r.id] = r.nickname
  return map
}

export async function findUserIdByNickname(
  nickname: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('public_profiles')
    .select('id')
    .eq('nickname', nickname.trim())
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

// --- Foto in moderazione ---
export interface PendingPhoto extends ProfilePhoto {
  nickname: string
  url: string | null
}

export async function listPendingPhotos(): Promise<PendingPhoto[]> {
  const { data, error } = await supabase
    .from('profile_photos')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  const photos = (data as ProfilePhoto[]) ?? []
  const [urls, names] = await Promise.all([
    signedUrls(photos.map((p) => p.storage_path)),
    nicknamesFor(photos.map((p) => p.user_id)),
  ])
  return photos.map((p) => ({
    ...p,
    nickname: names[p.user_id] ?? '—',
    url: urls[p.storage_path] ?? null,
  }))
}

export async function moderatePhoto(
  photoId: string,
  status: Extract<PhotoStatus, 'approved' | 'rejected'>,
): Promise<void> {
  const { error } = await supabase
    .from('profile_photos')
    .update({ status })
    .eq('id', photoId)
  if (error) throw error
}

// --- Segnalazioni (scaffold) ---
export type ReportStatus = 'open' | 'reviewed' | 'actioned' | 'dismissed'
export type ReportTarget = 'user' | 'message' | 'photo'

export interface Report {
  id: string
  reporter_id: string | null
  target_type: ReportTarget
  target_user_id: string | null
  target_message_id: number | null
  target_photo_id: string | null
  reason: string | null
  status: ReportStatus
  resolution_note: string | null
  created_at: string
}

export interface ReportRow extends Report {
  reporter_nick: string
  target_nick: string | null
}

export async function listReports(
  status: ReportStatus | 'all' = 'open',
): Promise<ReportRow[]> {
  let q = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
  if (status !== 'all') q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw error
  const rows = (data as Report[]) ?? []
  const names = await nicknamesFor([
    ...rows.map((r) => r.reporter_id ?? ''),
    ...rows.map((r) => r.target_user_id ?? ''),
  ])
  return rows.map((r) => ({
    ...r,
    reporter_nick: (r.reporter_id && names[r.reporter_id]) || '—',
    target_nick: r.target_user_id ? names[r.target_user_id] ?? '—' : null,
  }))
}

export async function resolveReport(
  id: string,
  status: Exclude<ReportStatus, 'open'>,
  resolverId: string,
  note?: string,
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({
      status,
      resolved_by: resolverId,
      resolution_note: note?.trim() || null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

// --- Gestione moderatori (solo admin) ---
export interface Moderator {
  user_id: string
  nickname: string
  created_at: string
}

export async function listModerators(): Promise<Moderator[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, created_at')
    .eq('role', 'moderator')
    .order('created_at', { ascending: true })
  if (error) throw error
  const rows = (data as { user_id: string; created_at: string }[]) ?? []
  const names = await nicknamesFor(rows.map((r) => r.user_id))
  return rows.map((r) => ({
    user_id: r.user_id,
    nickname: names[r.user_id] ?? '—',
    created_at: r.created_at,
  }))
}

export async function grantModerator(userId: string): Promise<void> {
  const { error } = await supabase.rpc('grant_role', {
    p_user: userId,
    p_role: 'moderator',
  })
  if (error) throw error
}

export async function revokeModerator(userId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_role', {
    p_user: userId,
    p_role: 'moderator',
  })
  if (error) throw error
}

// --- Verifiche identità ---
export interface PendingVerification {
  user_id: string
  nickname: string
  video_path: string
  video_url: string | null
  submitted_at: string
}

export async function listPendingVerifications(): Promise<PendingVerification[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, verification_video_path, updated_at')
    .eq('verification_status', 'pending')
    .not('verification_video_path', 'is', null)
    .order('updated_at', { ascending: true })
  if (error) throw error

  const rows = (data ?? []) as {
    id: string
    nickname: string
    verification_video_path: string
    updated_at: string
  }[]

  const paths = rows.map((r) => r.verification_video_path)
  if (paths.length === 0) return []
  const { data: urlData } = await supabase.storage
    .from('identity-verifications')
    .createSignedUrls(paths, 3600)

  const urlMap: Record<string, string> = {}
  for (const item of urlData ?? []) {
    if (item.signedUrl && item.path) urlMap[item.path] = item.signedUrl
  }

  return rows.map((r) => ({
    user_id:      r.id,
    nickname:     r.nickname,
    video_path:   r.verification_video_path,
    video_url:    urlMap[r.verification_video_path] ?? null,
    submitted_at: r.updated_at,
  }))
}

export async function approveVerification(userId: string): Promise<void> {
  const { error } = await supabase.rpc('approve_verification', { p_user_id: userId })
  if (error) throw error
}

export async function rejectVerification(userId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('reject_verification', {
    p_user_id: userId,
    p_reason:  reason,
  })
  if (error) throw error
}
