// Edge Function: cleanup GDPR mensile.
// Schedulata da pg_cron (migration 20260607010000_gdpr_cron.sql) — nessuna
// configurazione manuale nel dashboard necessaria.
// verify_jwt: false — è un job schedulato, non riceve richieste utente.
//
// Operazioni:
//   1. run_gdpr_cleanup() — DB: reputation_events > 12 mesi, vouch_requests scadute,
//      chatroom messages > 24 mesi, search_log > 30 giorni
//   2. Storage: elimina video di verifica con decisione presa > 30 giorni fa

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const VIDEO_RETENTION_DAYS = 30

Deno.serve(async (_req: Request): Promise<Response> => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const summary: Record<string, unknown> = {}

  // 1. DB cleanup via RPC (reputation_events > 12 mesi + vouch_requests scadute)
  const { data: dbResult, error: dbErr } = await supabase.rpc('run_gdpr_cleanup')
  if (dbErr) {
    console.error('[decay] DB cleanup failed:', dbErr.message)
    summary.db_error = dbErr.message
  } else {
    summary.db = dbResult
    console.log('[decay] DB:', JSON.stringify(dbResult))
  }

  // 2. Storage: video di verifica con decisione presa > VIDEO_RETENTION_DAYS fa
  const cutoff = new Date(Date.now() - VIDEO_RETENTION_DAYS * 86_400_000).toISOString()

  const { data: toClean, error: queryErr } = await supabase
    .from('profiles')
    .select('id, verification_video_path')
    .in('verification_status', ['approved', 'rejected'])
    .not('verification_video_path', 'is', null)
    .lt('verification_decided_at', cutoff)

  if (queryErr) {
    console.error('[decay] Profiles query failed:', queryErr.message)
    summary.storage_error = queryErr.message
  } else if (toClean && toClean.length > 0) {
    type ProfileRow = { id: string; verification_video_path: string }
    const rows = toClean as ProfileRow[]
    const paths = rows.map((r) => r.verification_video_path)

    const { error: removeErr } = await supabase.storage
      .from('identity-verifications')
      .remove(paths)

    if (removeErr) {
      console.error('[decay] Storage remove failed:', removeErr.message)
      summary.storage_error = removeErr.message
    } else {
      // Nulla il path solo dopo conferma della rimozione dallo Storage.
      await supabase
        .from('profiles')
        .update({ verification_video_path: null })
        .in('id', rows.map((r) => r.id))
      summary.videos_deleted = rows.length
      console.log('[decay] Videos deleted:', rows.length)
    }
  } else {
    summary.videos_deleted = 0
  }

  console.log('[decay] Done:', JSON.stringify(summary))
  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json' },
  })
})
