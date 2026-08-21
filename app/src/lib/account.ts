import { supabase } from './supabase'
import { mapSupabaseAuthError, validatePassword } from './authErrors'

// Cambio delle credenziali dell'account.
//
// Perché ogni operazione richiede di nuovo la password attuale: Supabase
// permetterebbe di cambiare email e password con la sola sessione attiva, e la
// sessione qui resta valida a lungo. Senza questo passaggio chi trovasse il
// telefono sbloccato potrebbe prendersi l'account in due tap — cambia email,
// cambia password, e la proprietaria è fuori. È la stessa ragione per cui lo
// chiedono Google e GitHub.
//
// Il re-login non cambia utente: rinnova la sessione dello stesso account, e
// AuthProvider reagisce a SIGNED_IN aggiornando soltanto la sessione (solo
// PASSWORD_RECOVERY porta altrove), quindi la schermata resta dov'è.
async function reauthenticate(currentPassword: string): Promise<void> {
  const { data } = await supabase.auth.getUser()
  const email = data.user?.email
  if (!email) {
    throw new Error("La tua sessione è scaduta. Esci e rientra nell'app, poi riprova.")
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
  // Un tentativo fallito non tocca la sessione già attiva: si resta loggate.
  if (error) throw new Error('La password attuale non è corretta.')
}

/**
 * Avvia il cambio email. NON cambia subito l'indirizzo: Supabase manda un link
 * di conferma alla nuova casella (e, se è attivo il "secure email change",
 * anche alla vecchia). L'email cambia solo quando i link vengono aperti —
 * altrimenti un errore di battitura chiuderebbe fuori dal proprio account.
 */
export async function requestEmailChange(
  newEmail: string,
  currentPassword: string,
): Promise<void> {
  await reauthenticate(currentPassword)
  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) throw new Error(mapSupabaseAuthError(error).userMessage)
}

/** Cambia la password. Ha effetto immediato, senza passare dall'email. */
export async function changePassword(
  newPassword: string,
  currentPassword: string,
): Promise<void> {
  // Prima la validazione locale: inutile far viaggiare una password che
  // sappiamo già essere troppo debole.
  const invalid = validatePassword(newPassword)
  if (invalid) throw new Error(invalid)
  if (newPassword === currentPassword) {
    throw new Error('La nuova password deve essere diversa da quella attuale.')
  }
  await reauthenticate(currentPassword)
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(mapSupabaseAuthError(error).userMessage)
}
