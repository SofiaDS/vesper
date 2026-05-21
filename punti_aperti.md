# Punti aperti

Tutte le decisioni ancora da prendere, organizzate per priorità.

Ultimo aggiornamento: 21 maggio 2026

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

✅ Struttura base decisa: 1 globale + 2 tematiche (vedi [`chatroom.md`](./chatroom.md)). Resta da definire:

- **Scelta finale tra le 2 opzioni di terna chat** (Intima+ampia vs Intima+pratica). Decisione tra founder in sessione dedicata, **entro fine Tappa 2** della roadmap (vedi `stack_tecnico.md`), così la struttura è disponibile per la beta interna PWA in Tappa 3. Possibile input pre-decisione da 2-3 conversazioni informali con persone del target, se i founder lo ritengono utile (non obbligatorio).
- **Segmentazione per città/regione**: rimandata, valutare quando si superano ~500-1000 utenti attive.
- **Limite di utenti contemporanei prima di sdoppiare la room**: da definire più avanti con dati reali.

### C. Sistema di reputazione

✅ Pilastri decisi il 20 maggio 2026 (vedi [`reputazione.md`](./reputazione.md)):
- Scopo: strumento di moderazione invisibile (mai visibile agli utenti, mai automatica)
- Sistema parallelo agli Strati, senza interazione
- Attivo dal giorno 1 del lancio

🚧 Restano da definire in sessioni successive (sezioni 5, 6 di `reputazione.md`):
- ~~Cosa fa salire e scendere la reputazione (eventi e pesi)~~ ✅ Deciso il 20 maggio 2026 (sezione 4 di `reputazione.md`): logica asimmetrica, warning = −1, mute = −3
- Visibilità, decadimento, storicizzazione
- Soglie di calibrazione e processo di revisione

Questo resta il prossimo tema "grosso" da affrontare, ma è ora strutturato in passi gestibili.

---

## Priorità MEDIA

### F. Funzionalità community avanzate (post-MVP)

Da definire quando l'app sarà cresciuta e queste feature avranno senso:

- **Gruppi locali per città** (richiede massa critica di utenti per città)
- **Eventi** (online o in presenza)
- **Forum/post lunghi** (oltre alla chat in tempo reale)
- **Buddy system** per nuove utenti (assegnazione di una "guida" tra le utenti attive)

### Punti tecnici da decidere

Vedi [`stack_tecnico.md`](./stack_tecnico.md) per i dettagli completi:

- **T1**: Email applicative per invii programmatici dal backend (Resend/SendGrid/Mailgun/AWS SES) — le caselle umane sono già decise (Zoho Mail Free, vedi punto 10 di `stack_tecnico.md`)
- ~~**T2**: Liveness detection per il selfie video — libreria specifica~~ ✅ Decisione presa il 20 maggio 2026: `expo-camera` + revisione manuale (vedi punto 10 di `stack_tecnico.md`)
- **T3**: Monitoraggio errori e crash reporting — direzione provvisoria **Sentry**, da confermare in Tappa 4 (preparazione lancio store)
- ~~**T4**: CI/CD (Expo Application Services o GitHub Actions)~~ ✅ Decisione presa il 20 maggio 2026: EAS per build nativi + GitHub Actions per CI codice (vedi punto 11 di `stack_tecnico.md`)
- **T5**: Strumenti di analytics — decisione rimandata a Tappa 5 (post-lancio), criterio: scegliere lo strumento in base a *cosa* si vuole misurare, non prima

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
