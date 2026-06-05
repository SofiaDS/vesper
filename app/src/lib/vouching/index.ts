// Sistema di vouching (garanti) per nuove utenti (vedi permessi_e_strati.md §2).
// Disponibile solo da Strato 3. Permette di saltare i 7 giorni iniziali di Strato 1.

// TODO: requestVouch(newUserId, guarantorNicknames[]) — la nuova utente inserisce
//        i nickname di 2 garanti durante la registrazione
// TODO: confirmVouch(requestId, guarantorId) — il garante conferma la richiesta
//        (entro 48 ore, altrimenti decade e la nuova utente entra normale in Strato 1)
// TODO: denyVouch(requestId, guarantorId) — il garante nega la richiesta
// TODO: getPendingVouchRequests(guarantorId) — lista le richieste in attesa per un garante
// TODO: recordFailedVouch(guarantorId) — registra una garanzia fallita sul profilo del garante
//        (3 garanzie fallite = perdita permanente del privilegio di garantire)
// TODO: getVouchPrivilegeStatus(userId) — verifica se l'utente può ancora garantire

// Soglie (vedi permessi_e_strati.md §3 — da calibrare dopo il lancio).
export const VOUCH_CONFIRMATION_HOURS = 48
export const MAX_FAILED_VOUCHES = 3
export const REQUIRED_GUARANTORS = 2
