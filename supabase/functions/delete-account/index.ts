// Edge Function: cancellazione account utente.
// Autenticata via JWT (verify_jwt: true).
// Operazioni in ordine:
//   1. Cancella Storage: foto profilo + video di verifica
//   2. Chiama admin.deleteUser() che cascada tutto il DB
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST')
    return new Response('Method Not Allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const userId = user.id
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { data: profile } = await admin
    .from('profiles')
    .select('verification_video_path')
    .eq('id', userId)
    .maybeSingle()

  const { data: photos } = await admin
    .from('profile_photos')
    .select('storage_path')
    .eq('user_id', userId)

  if (photos && photos.length > 0) {
    await admin.storage.from('profile-photos').remove(photos.map((p: { storage_path: string }) => p.storage_path))
  }

  if (profile?.verification_video_path) {
    await admin.storage.from('identity-verifications').remove([profile.verification_video_path])
  }

  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId)
  if (deleteErr) {
    console.error('[delete-account] deleteUser failed:', deleteErr.message)
    return new Response(JSON.stringify({ error: deleteErr.message }), { status: 500 })
  }

  console.log('[delete-account] Account eliminato:', userId)
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
