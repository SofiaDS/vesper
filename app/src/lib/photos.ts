// Gestione foto profilo: upload (con ridimensionamento), elenco, eliminazione,
// scelta della principale e URL firmati per la lettura dal bucket privato.
// Lo stato di moderazione (pending/approved/rejected) e' gestito lato DB:
// le nuove foto nascono 'pending' e diventano visibili agli altri solo da approvate.
import { supabase } from './supabase'

export const PHOTO_BUCKET = 'profile-photos'
export const MAX_PHOTOS = 4
const MAX_DIM = 1280
const JPEG_QUALITY = 0.85
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024 // 12MB sul file originale

export type PhotoStatus = 'pending' | 'approved' | 'rejected'

export interface ProfilePhoto {
  id: string
  user_id: string
  storage_path: string
  is_primary: boolean
  sort_order: number
  status: PhotoStatus
  created_at: string
}

// Elenca le foto dell'utente: principale per prima, poi per ordine/creazione.
export async function listMyPhotos(userId: string): Promise<ProfilePhoto[]> {
  const { data, error } = await supabase
    .from('profile_photos')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as ProfilePhoto[]) ?? []
}

// Solo le foto approvate (quello che vedono gli altri), principale per prima.
export async function listApprovedPhotos(
  userId: string,
): Promise<ProfilePhoto[]> {
  const { data, error } = await supabase
    .from('profile_photos')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as ProfilePhoto[]) ?? []
}

// Ridimensiona e comprime l'immagine lato client (canvas -> JPEG) per tenere
// il bucket leggero. Restituisce un Blob.
async function resizeImage(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('Lettura del file non riuscita.'))
    r.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('Immagine non valida.'))
    i.src = dataUrl
  })
  let w = img.naturalWidth
  let h = img.naturalHeight
  if (w > MAX_DIM || h > MAX_DIM) {
    const scale = MAX_DIM / Math.max(w, h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Elaborazione immagine non disponibile.')
  ctx.drawImage(img, 0, 0, w, h)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )
  if (!blob) throw new Error('Conversione immagine non riuscita.')
  return blob
}

// Carica un Blob JPEG gia' pronto (es. dal ritaglio quadrato): salva su storage e
// inserisce il record. Condivide la logica con uploadPhoto, senza ri-comprimere.
async function uploadBlob(
  userId: string,
  blob: Blob,
): Promise<ProfilePhoto> {
  const existing = await listMyPhotos(userId)
  if (existing.length >= MAX_PHOTOS) {
    throw new Error(`Puoi caricare al massimo ${MAX_PHOTOS} foto.`)
  }

  const path = `${userId}/${crypto.randomUUID()}.jpg`

  const { error: upErr } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (upErr) throw upErr

  const isPrimary = existing.length === 0
  const sortOrder =
    existing.reduce((m, p) => Math.max(m, p.sort_order), -1) + 1

  const { data, error: insErr } = await supabase
    .from('profile_photos')
    .insert({
      user_id: userId,
      storage_path: path,
      is_primary: isPrimary,
      sort_order: sortOrder,
    })
    .select('*')
    .single()
  if (insErr) {
    // rollback: rimuovi il file orfano dallo storage
    await supabase.storage.from(PHOTO_BUCKET).remove([path])
    throw insErr
  }
  return data as ProfilePhoto
}

// Carica una nuova foto da File: valida, ridimensiona, poi delega a uploadBlob.
export async function uploadPhoto(
  userId: string,
  file: File,
): Promise<ProfilePhoto> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Seleziona un file immagine.')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Immagine troppo grande (max 12MB).')
  }
  const blob = await resizeImage(file)
  return uploadBlob(userId, blob)
}

// Carica una foto da un Blob gia' ritagliato/compresso (selfie o crop).
// Il chiamante e' responsabile di produrre un JPEG di dimensioni ragionevoli.
export async function uploadPhotoFromBlob(
  userId: string,
  blob: Blob,
): Promise<ProfilePhoto> {
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('Immagine troppo grande (max 12MB).')
  }
  return uploadBlob(userId, blob)
}

// Elimina una foto (record + file). Se era la principale, promuove la prima rimasta.
export async function deletePhoto(photo: ProfilePhoto): Promise<void> {
  const { error } = await supabase
    .from('profile_photos')
    .delete()
    .eq('id', photo.id)
  if (error) throw error
  await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path])
  if (photo.is_primary) {
    const rest = await listMyPhotos(photo.user_id)
    if (rest.length > 0) {
      await supabase
        .from('profile_photos')
        .update({ is_primary: true })
        .eq('id', rest[0].id)
    }
  }
}

// Imposta la foto principale (azzera le altre, poi marca la scelta).
export async function setPrimary(
  userId: string,
  photoId: string,
): Promise<void> {
  await supabase
    .from('profile_photos')
    .update({ is_primary: false })
    .eq('user_id', userId)
    .eq('is_primary', true)
  const { error } = await supabase
    .from('profile_photos')
    .update({ is_primary: true })
    .eq('id', photoId)
  if (error) throw error
}

// Genera URL firmati (1h) per i percorsi dati. Ritorna una mappa path -> url.
export async function signedUrls(
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, 3600)
  if (error) throw error
  const map: Record<string, string> = {}
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl
  }
  return map
}
