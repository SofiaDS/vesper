# Punti aperti

Tutte le decisioni ancora da prendere, organizzate per priorità.

Ultimo aggiornamento: 16 maggio 2026

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
- **Revisione del filtro AI** dopo 1-2 mesi di dati reali (passaggio a hard mode selettiva o no)

### B. Struttura della chatroom — scelta finale

✅ Struttura base decisa: 1 globale + 2 tematiche (vedi [`chatroom.md`](./chatroom.md)). Resta da definire:

- **Scelta finale tra le 2 opzioni di terna chat** (Intima+ampia vs Intima+pratica). Idea: sentire qualche persona del target prima di decidere.
- **Segmentazione per città/regione**: rimandata, valutare quando si superano ~500-1000 utenti attive.
- **Limite di utenti contemporanei prima di sdoppiare la room**: da definire più avanti con dati reali.

### C. Sistema di reputazione

✅ Struttura strati decisa (vedi [`permessi_e_strati.md`](./permessi_e_strati.md)). Resta da definire il sistema di **calcolo punti reputazione**:

- Quali eventi positivi/negativi contano? Con che peso?
- Visibile solo agli admin, o anche all'utente stessa?
- Decadimento nel tempo delle segnalazioni archiviate?

Questo è il prossimo tema "grosso" da affrontare.

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

- **T1**: Email transazionali — provider per email applicative
- **T2**: Liveness detection per il selfie video — libreria specifica
- **T3**: Monitoraggio errori e crash reporting (Sentry/Bugsnag)
- **T4**: CI/CD (Expo Application Services o GitHub Actions)
- **T5**: Strumenti di analytics (PostHog/Plausible/Mixpanel)

---

## Priorità BASSA (post-lancio)

### G. Monetizzazione

Da affrontare dopo il lancio e dopo aver visto come la community cresce:

- Gratis con donazioni? Premium con feature extra? Sponsorizzazioni eventi LGBTQ+?
- **Mai pubblicità targettizzata** (incoerente con privacy della community).

### H. Espansione internazionale

- Quando e come uscire dall'Italia? Quali paesi europei prioritari?
- Strategia linguistica (multilingua dalla v2?).
- Compliance specifica per paesi diversi (es. policy LGBTQ+ negli store di alcuni paesi).

### Punti tecnici post-lancio

Vedi [`stack_tecnico.md`](./stack_tecnico.md):

- **T6**: CDN per asset statici (avatar preset, ecc.)
- **T7**: Backup database
- **T8**: Disaster recovery e business continuity
