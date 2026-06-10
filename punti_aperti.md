# Punti aperti

Tutte le decisioni ancora da prendere, organizzate per priorità.

Ultimo aggiornamento: 4 giugno 2026 (aggiunto T9 — allowlist redirect Supabase)

---

## Indice

- Priorità ALTA — bloccanti per l'architettura o il lancio
- Priorità MEDIA — importanti ma non urgenti
- Priorità BASSA — post-lancio

---

## Priorità ALTA (bloccanti per architettura o lancio)

### A. Moderazione chatroom — punti residui

✅ Pilastri decisi (vedi [`moderazione.md`](./moderazione.md)). Resta da definire:

- **SLA esatti di risposta per segnalazioni gravi** (target <2h?)
- ~~**Revisione del filtro AI** dopo 1-2 mesi di dati reali (passaggio a hard mode selettiva o no)~~ ✅ Processo definito il 20 maggio 2026 (vedi `moderazione.md` sezione 6.1). Resta l'esecuzione al raggiungimento del trigger.

### B. Struttura della chatroom — scelta finale

✅ Struttura base decisa: 1 principale "Foyer" + 3 tematiche — **Wander** (viaggi & eventi), **Pulse** (fitness/sport), **Cult** (arte/cultura) (vedi [`chatroom.md`](./chatroom.md)). Chat principale rinominata **Foyer** (era "Saluti & random") il 1 giugno 2026.

✅ **Appartenenza multipla a più chat** decisa il 1 giugno 2026 (vedi [`chatroom.md`](./chatroom.md) sezioni 4-5): un'utente sta in più chat con tetto **1 Foyer obbligatoria + max 3 tematiche**, gestite da una pagina "Le mie chat" (esci/unisciti). Architettura in [`stack_tecnico.md`](./stack_tecnico.md) sezione 10.

Resta da definire:

- ~~**Scelta finale tra le 2 opzioni di terna chat** (Intima+ampia vs Intima+pratica)~~ ✅ Superata: terna di lancio decisa — **Wander**, **Pulse**, **Cult** (vedi [`chatroom.md`](./chatroom.md) sezione 3). La chat "Relazioni & affetti" resta candidata per la prima espansione.
- **Calibrazione del tetto massimo di chat tematiche** (provvisoriamente 3): da rivedere con dati reali dopo il lancio, insieme alle altre soglie del progetto.
- **Limite chat come feature a pagamento**: candidato borderline, da confermare/scartare — vedi [`monetizzazione.md`](./monetizzazione.md) sezione 4.
- **Segmentazione per città/regione**: rimandata, valutare quando si superano ~500-1000 utenti attive.
- **Limite di utenti contemporanei prima di sdoppiare la room**: da definire più avanti con dati reali.

### C. Sistema di reputazione

✅ **Sistema decise per intero il 1 giugno 2026** (vedi [`reputazione.md`](./reputazione.md), ora completo):

- Scopo: strumento di moderazione invisibile (mai visibile agli utenti, mai automatica)
- Sistema parallelo agli Strati, senza interazione
- Attivo dal giorno 1 del lancio
- Eventi e pesi (sez. 4): logica asimmetrica, warning = −1, mute = −3
- ~~Visibilità, decadimento, storicizzazione (sez. 5)~~ ✅ Decadimento per evento (warning 3 mesi, mute 6 mesi), eventi scaduti restano nello storico fino a ~12 mesi
- ~~Soglie di calibrazione e processo di revisione (sez. 6)~~ ✅ Calibrazione a 3 mesi con le altre soglie; ripristino post-appello allineato ad `appelli.md`

Restano solo rifiniture **non bloccanti**: forma della visualizzazione in dashboard (sparkline o lista, sez. 5.4) e la calibrazione effettiva coi dati reali dopo 3 mesi dal lancio.

---

## Priorità MEDIA

### F. Funzionalità community avanzate (post-MVP)

Da definire quando l'app sarà cresciuta e queste feature avranno senso:

- **Gruppi locali per città** (richiede massa critica di utenti per città)
- **Eventi** (online o in presenza)
- **Forum/post lunghi** (oltre alla chat in tempo reale)
- **Buddy system** per nuove utenti (assegnazione di una "guida" tra le utenti attive)

### Branding — logo e nome

Pilastri decisi (vedi [`branding.md`](./branding.md)): palette **"Inchiostro & oro"** scelta. Resta da definire:

- ❌ **Nome "Vesper" SCARTATO** (10 giugno 2026): `vesper.it` già registrato, `vesper.com` disponibile solo a prezzo molto elevato. Serve **trovare un nuovo nome candidato** e ripetere le verifiche (dominio per primo, poi marchio UIBM/EUIPO, App Store, Play Store, social handle) — vedi `branding.md` sezione 4. Fino alla scelta del sostituto, "Vesper" resta nome di lavoro nel codice/documentazione.
- **Logo**: non ancora deciso. Le proposte AI sono state scartate. Prossimo passo: sviluppare il **brief strutturato** (aggettivi guida + lista "no" + vincoli tecnici) prima di nuove proposte — da allineare comunque al nuovo nome una volta scelto.
- **Tonalità di stato e accessibilità**: definire scale di stato (success/warning/error) e verificare i contrasti AA/AAA della palette in fase di wireframe.

### Punti tecnici da decidere

Vedi [`stack_tecnico.md`](./stack_tecnico.md) per i dettagli completi:

- ~~**T1**: Email applicative per invii programmatici dal backend~~ ✅ Decisione presa il 10 giugno 2026: **Brevo** (provider EU/Francia, free tier 300 email/giorno, GDPR-friendly) — le caselle umane restano su Zoho Mail Free (vedi punto 10 di `stack_tecnico.md`). Verifica del dominio mittente rimandata a quando sarà scelto il nome/dominio definitivo (collegata al punto sopra e a T9); nel frattempo si usa il sender di test/sandbox di Brevo.
- ~~**T2**: Liveness detection per il selfie video — libreria specifica~~ ✅ Decisione presa il 20 maggio 2026: `expo-camera` + revisione manuale (vedi punto 11 di `stack_tecnico.md`)
- **T3**: Monitoraggio errori e crash reporting — direzione provvisoria **Sentry**, da confermare in Tappa 4 (preparazione lancio store)
- ~~**T4**: CI/CD (Expo Application Services o GitHub Actions)~~ ✅ Decisione presa il 20 maggio 2026: EAS per build nativi + GitHub Actions per CI codice (vedi punto 12 di `stack_tecnico.md`)
- **T5**: Strumenti di analytics — decisione rimandata a Tappa 5 (post-lancio), criterio: scegliere lo strumento in base a *cosa* si vuole misurare, non prima
- **T9 (config deploy/auth)**: in produzione bisogna aggiungere l'URL dell'app su Vercel alla **allowlist dei redirect** di Supabase (Authentication → URL Configuration: *Site URL* + *Redirect URLs*). Serve perché i link via email che riportano all'app — conferma registrazione e **reset password** (`redirectTo: window.location.origin`) — funzionino fuori da `localhost`. In dev `localhost` è già ammesso. Da fare quando si fissa il dominio definitivo. Collegato a T1 (SMTP/email applicative).

---

## Priorità BASSA (post-lancio)

### G. Monetizzazione

⚠️ Decisione strategica in sospeso — analisi completata, scelta finale tra founder ancora da fare.

Vedi [`monetizzazione.md`](./monetizzazione.md) per:

- I tre principi guida acquisiti (niente monetizzazione in v1, mai feature che creano gerarchie sociali, mai vendere dati, mai feature di safety/discretion a pagamento)
- Le tre opzioni in valutazione (A: ADV+remove ads, B: supporter puro, C: ibrido evolutivo)
- La domanda di posizionamento strategico a monte ("alternativa a Wapa" vs "cosa diversa community-first") da risolvere prima di scegliere il modello
- Il bottone "Sostieni il progetto" come decisione già acquisita per v1

**Prossimo passo**: conversazione dedicata tra founder per risolvere la domanda di posizionamento (sezione 5 di `monetizzazione.md`).

### H. Espansione internazionale

- Quando e come uscire dall'Italia? Quali paesi europei prioritari?
- Strategia linguistica (multilingua dalla v2?).
- Compliance specifica per paesi diversi (es. policy LGBTQ+ negli store di alcuni paesi).

### Punti tecnici post-lancio

Vedi [`stack_tecnico.md`](./stack_tecnico.md):

- **T6**: CDN per asset statici — Supabase Storage fa già da CDN out-of-the-box, quindi non è "da decidere" in senso stretto. Va valutata un'alternativa (Cloudflare R2, Bunny.net) solo se a regime i costi Supabase per banda immagini diventeranno significativi (Fase C avanzata)
- **T7**: Backup database
- **T8**: Disaster recovery e business continuity
