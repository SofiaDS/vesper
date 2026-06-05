// TODO: schermata di verifica identità tramite selfie video (liveness detection).
// Decisione tecnica: expo-camera + revisione manuale (stack_tecnico.md §11, T2 ✅).
//
// Funzionalità previste:
// - Spiegazione chiara del processo prima di iniziare (cosa si valuta: solo liveness, NON identità di genere)
// - Registrazione selfie video con expo-camera (requisiti: luminoso, testa visibile, almeno 3s)
// - Upload del video a Supabase Storage (bucket privato, accesso solo ai moderatori)
// - Stato della revisione: in_attesa / approvata / rifiutata
// - Se rifiutata: messaggio con motivo tecnico + istruzioni per il nuovo tentativo
//   (7 giorni per fare appello — vedi appelli.md §1)
// - Se approvata: aggiornamento profilo e redirect al completamento onboarding

export function VerificationScreen() {
  return null
}
