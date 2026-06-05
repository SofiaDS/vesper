// Helper lato utente per le segnalazioni. La RLS della tabella `reports`
// consente l'insert solo con reporter_id = auth.uid() (insert own); lo staff
// le legge/risolve dall'area di moderazione. La persona segnalata non puo'
// vedere chi l'ha segnalata.
import { supabase } from './supabase'

export type ReportTarget = 'user' | 'message' | 'photo'

// Motivi preset mostrati nella modale (l'utente puo' aggiungere una nota).
export const REPORT_REASONS: readonly string[] = [
  'Contenuto offensivo o d’odio',
  'Molestie o minacce',
  'Spam o pubblicità',
  'Contenuto sessuale non richiesto',
  'Profilo falso o impersonificazione',
  'Altro',
]

export async function createReport(input: {
  targetType: ReportTarget
  targetUserId?: string | null
  targetMessageId?: number | null
  targetPhotoId?: string | null
  reason: string
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato.')
  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_type: input.targetType,
    target_user_id: input.targetUserId ?? null,
    target_message_id: input.targetMessageId ?? null,
    target_photo_id: input.targetPhotoId ?? null,
    reason: input.reason,
  })
  if (error) throw error
}
