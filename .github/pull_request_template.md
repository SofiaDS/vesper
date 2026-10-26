<!--
Rilascio: PR da `dev` a `main`. Al merge Vercel pubblica su vespercommunity.com.
Per le PR di funzionalità verso `dev` cancella le sezioni che non servono.
-->

## Cosa cambia

-

## Provato in dev

- [ ] Funziona su dev.vespercommunity.com, con il database dev
- [ ] `/check-pre-release` senza bloccanti
- [ ] Provato su Android (Chrome) e, se tocca installazione o notifiche, su iPhone (Safari)

## Passi in produzione, in quest'ordine

- [ ] Migration da applicare su prod (SQL Editor), in ordine: nessuna
- [ ] Edge function da deployare su prod (`--project-ref ywkttzzkvlemtsuoceke --no-verify-jwt`): nessuna
- [ ] Secret o variabili d'ambiente nuove (Supabase / Vercel Production): nessuna
- [ ] Serve un nuovo AAB per Play (plugin nativi, `app/android`, `capacitor.config.ts`): no

Prima applica migration e function, poi fai il merge: il frontend nuovo non deve arrivare prima del database che gli serve.
