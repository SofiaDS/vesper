// Traduzione in italiano dei messaggi di errore di Supabase Auth
// e validazione client-side della password.

// Mappa dei messaggi noti di GoTrue (Supabase) -> italiano.
// Il match e' su sottostringa, case-insensitive, perche' il testo esatto
// puo' variare leggermente tra versioni.
const ERROR_MAP: { match: string; it: string }[] = [
  {
    match: 'invalid login credentials',
    it: 'Email o password non corretti.',
  },
  {
    match: 'email not confirmed',
    it: 'Devi prima confermare la tua email: controlla la posta (anche lo spam).',
  },
  {
    match: 'user already registered',
    it: 'Esiste già un account con questa email. Prova ad accedere.',
  },
  {
    match: 'password should be at least',
    it: 'La password è troppo corta.',
  },
  {
    match: 'unable to validate email address',
    it: 'Indirizzo email non valido.',
  },
  {
    match: 'email rate limit exceeded',
    it: 'Troppi tentativi. Riprova tra qualche minuto.',
  },
  {
    match: 'for security purposes',
    it: 'Troppi tentativi ravvicinati. Attendi qualche secondo e riprova.',
  },
  {
    match: 'signups not allowed',
    it: 'Le registrazioni sono al momento disabilitate.',
  },
]

export function translateAuthError(message: string): string {
  const lower = message.toLowerCase()
  const hit = ERROR_MAP.find((e) => lower.includes(e.match))
  return hit ? hit.it : message
}

// Requisiti password: min 8 caratteri, almeno una lettera e un numero.
// Ritorna null se valida, altrimenti il messaggio d'errore in italiano.
export function validatePassword(pw: string): string | null {
  if (pw.length < 8) {
    return 'La password deve avere almeno 8 caratteri.'
  }
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
    return 'La password deve contenere almeno una lettera e un numero.'
  }
  return null
}
