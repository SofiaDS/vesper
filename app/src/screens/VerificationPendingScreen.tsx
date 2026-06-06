import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

export function VerificationPendingScreen() {
  const { session, refreshProfile } = useAuth()

  useEffect(() => {
    const uid = session?.user.id
    if (!uid) return
    const ch = supabase
      .channel('verif_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${uid}`,
        },
        () => { refreshProfile() },
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [session?.user.id])

  return (
    <main className="app">
      <header className="brand">
        <h1>Vesper</h1>
      </header>
      <section className="card">
        <h2>Verifica in corso</h2>
        <p className="muted">
          Il tuo video di verifica è stato ricevuto. I moderatori lo esamineranno
          al più presto — riceverai accesso all'app non appena approvato.
        </p>
        <p className="hint">Puoi chiudere questa pagina e tornare più tardi.</p>
      </section>
    </main>
  )
}
