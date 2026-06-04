import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Flag comodo per mostrare un messaggio chiaro finche' le variabili non sono configurate.
export const isSupabaseConfigured =
  Boolean(supabaseUrl) && Boolean(supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase non configurato: crea un file .env.local con VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (vedi .env.example).',
  )
}

// Il client si crea comunque (con stringhe vuote in fallback) per non far crashare
// l'app prima della configurazione; le chiamate falliranno in modo controllato.
export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
)
