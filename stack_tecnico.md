# Stack tecnico — App community lesbica/queer

Documento dedicato alle decisioni tecniche di progetto: linguaggi, framework, servizi, infrastruttura, costi.
Documento separato da `decisioni_progetto.md` che invece raccoglie le decisioni di prodotto.

Ultimo aggiornamento: 16 maggio 2026

---

## PRINCIPI GUIDA TECNICI

Le scelte tecniche seguono questi principi, in ordine di priorità:

1. **Costi minimi nell'MVP** — il progetto parte senza budget significativo, ogni euro speso va giustificato.
2. **Scalabilità senza refactoring drastici** — se l'app cresce velocemente, non si vogliono "corse per upgrade" o riscritture totali. Meglio una base un po' più costosa subito che dover rifare tutto a 10k utenti.
3. **GDPR-friendly per design** — gli utenti sono vulnerabili (donne queer/trans), i dati restano in Europa per quanto possibile.
4. **Basso vendor lock-in** — preferire tecnologie e formati portabili, evitare scelte che rendono impossibile cambiare provider.
5. **Compatibilità con le skill del fondatore** — JavaScript FE noto, esperienza SQL da progetti universitari. Le scelte favoriscono tecnologie già conosciute o vicine.
6. **Sviluppo veloce per arrivare al lancio** — nei limiti delle altre priorità, ridurre il tempo di sviluppo dell'MVP.

---

## DECISIONI PRESE

### 1. App mobile — React Native + Expo (TypeScript)
- **Scelta**: React Native con Expo, in TypeScript.
- **Motivazione**:
  - Un solo codebase per iOS e Android (dimezza il lavoro vs sviluppo nativo)
  - JavaScript/TypeScript: territorio familiare al fondatore (esperienza FE)
  - Expo elimina la complessità di setup nativo (no Xcode/Android Studio strettamente necessari all'inizio)
  - Community enorme, librerie pronte per chat UI, image picker, video recording
  - Compatibile con tutti i backend considerati (Firebase, Supabase)
  - TypeScript (vs JavaScript puro) cattura errori prima della produzione, miglior autocomplete
- **Alternative scartate**:
  - **Flutter**: ottimo framework ma richiede di imparare Dart da zero
  - **Sviluppo nativo (Swift + Kotlin)**: massima qualità ma doppio lavoro, tempi 3x
  - **Java per Android**: obsoleto per app moderne, sostituito da Kotlin nel nativo

### 2. Backend — Supabase
- **Scelta**: **Supabase** come backend tutto-in-uno.
- **Cosa include**:
  - PostgreSQL come database (standard, portabile, senza lock-in serio)
  - Auth integrato (email + password, recovery, verifica email)
  - Storage per file (selfie video di verifica, eventuali allegati segnalazioni)
  - Realtime nativo per la chat (i client si abbonano alle tabelle e ricevono push automatici)
  - Edge Functions per logica server-side in TypeScript
  - Server in Europa (Francoforte, Dublino)
- **Motivazione**:
  - PostgreSQL standard sotto il cofano: skill spendibili, query SQL "vere", facile portabilità futura
  - Realtime nativo evita di costruire WebSocket/Socket.IO custom (risparmio settimane di sviluppo)
  - Server EU dedicati = compliance GDPR più semplice rispetto a Firebase (Google USA)
  - Open source: si può sempre migrare ad altro PostgreSQL hosting o self-hostare
  - Free tier generoso: 50.000 utenti attivi mensili, 500MB DB, 1GB storage — copre tutto l'MVP
  - Scaling automatico a costi prevedibili
  - Allineato con i valori del progetto (open source, EU-first)
- **Contro accettati**:
  - Meno maturo di Firebase (4-5 anni vs 15+), ma in forte crescita
  - Community più piccola (ma molto attiva)
  - Notifiche push non incluse (vedi punto 3)
- **Alternative scartate**:
  - **Firebase**: maturo, ma server di Google con sede USA, lock-in alto, Firestore NoSQL meno standard di PostgreSQL
  - **AWS Amplify**: troppo complesso per MVP da fondatore singolo
  - **Backend custom su VPS (PostgreSQL + Node.js)**: rallenta lo sviluppo di mesi, devi gestire auth, realtime, storage manualmente
  - **MongoDB Atlas**: NoSQL non offre vantaggi rispetto a Firestore/Supabase per questo caso, costi più alti del free tier Supabase

### 3. Notifiche push — OneSignal
- **Scelta**: **OneSignal** per le notifiche push iOS+Android.
- **Motivazione**:
  - Gratuito fino a numeri molto alti di utenti
  - Si integra bene con React Native + Expo
  - Indipendente dal backend (non aggiunge lock-in)
  - SDK ben documentato
- **Alternative scartate**:
  - **Firebase Cloud Messaging (FCM)**: gratis ma riporta sotto l'ecosistema Google (anche se usato solo per push non è grave)
  - **Expo Notifications**: ok per prototipi, meno feature di OneSignal per casi reali
- **Da rivedere**: se l'integrazione di OneSignal risulta più complessa del previsto, valutare Expo Notifications come ripiego.

### 4. Filtro AI per moderazione contenuti — OpenAI Moderation API
- **Scelta**: **OpenAI Moderation API** + blocklist italiana custom mantenuta nelle Edge Functions di Supabase.
- **Motivazione**:
  - API gratuita (zero costi)
  - Buon supporto multi-lingua incluso italiano
  - Categorie pre-definite (violence, hate, sexual, self-harm, ecc.)
  - Integrabile facilmente da Edge Function quando arriva nuovo messaggio
- **Blocklist italiana**: lista di parole/regex specifiche per slur transfobici/bifobici/lesbofobici nel contesto italiano, mantenuta dai fondatori, aggiornata sulla base dei casi reali.
- **Modalità iniziale**: soft mode (vedi punto 11 di `decisioni_progetto.md`) — messaggi flaggati visibili ai moderatori senza blocco automatico al day-one.

### 5. Dashboard moderatori — Appsmith self-hosted
(Già definito nel documento `decisioni_progetto.md` punto 12, qui solo riferimento)
- **Scelta**: Appsmith Community Edition self-hosted su VPS europeo.
- **VPS consigliato**: Hetzner Germania (€5-15/mese per VPS Linux base sufficiente).
- **Connessione**: Appsmith si connette direttamente al database PostgreSQL di Supabase via connection string (Supabase espone PostgreSQL standard).

### 6. Versionamento codice — Git + GitHub privato
- **Scelta**: GitHub con repository privato.
- **Motivazione**: standard de facto, gratuito per repo privati, ottima integrazione con tutti gli strumenti (VS Code, CI/CD, Issues, ecc.).
- **Repo separati**:
  - `app-mobile` (codice React Native)
  - `supabase-config` (schema database, edge functions, migrations)
  - `moderator-dashboard` (config Appsmith esportata)

### 7. Ambiente di sviluppo — VS Code
- **Scelta**: Visual Studio Code come IDE principale.
- **Estensioni essenziali**:
  - React Native Tools
  - Expo Tools
  - ESLint + Prettier (qualità codice)
  - GitLens
  - Supabase (estensione ufficiale)

### 8. Linguaggio per logica server-side — TypeScript
- **Scelta**: TypeScript per le Edge Functions di Supabase.
- **Motivazione**: stessa stack del frontend (un solo linguaggio da padroneggiare), cattura errori a compile time, autocomplete migliore di JavaScript puro.

---

## STACK COMPLETO — RIEPILOGO

| Componente | Tecnologia | Costo iniziale | Costo a 10k utenti | Costo a 100k utenti |
|---|---|---|---|---|
| **App mobile iOS+Android** | React Native + Expo (TS) | €0 | €0 | €0 |
| **Database + Auth + Storage + Realtime** | Supabase (PostgreSQL) | €0 (free tier) | ~€25-100/mese | ~€100-500/mese |
| **Notifiche push** | OneSignal | €0 | €0 | €0-50/mese |
| **Filtro AI contenuti** | OpenAI Moderation API | €0 | €0 | €0 |
| **Dashboard moderatori** | Appsmith self-hosted | €0 (Community Edition) | €0 | €0 |
| **VPS per Appsmith** | Hetzner Germania | €5-15/mese | €15/mese | €15-30/mese |
| **Apple Developer Account** | Apple | €99/anno (~€8/mese) | €8/mese | €8/mese |
| **Google Play Developer** | Google | €25 una tantum | — | — |
| **Dominio** | Namecheap o simili | €10/anno (~€1/mese) | €1/mese | €1/mese |
| **Email transazionale** | Supabase incluso fino a soglie | €0 | €0-15/mese | €15-50/mese |
| **Versionamento codice** | GitHub privato | €0 | €0 | €0 |
| **TOTALE STIMATO** | | **~€15-25/mese** | **~€50-150/mese** | **~€140-650/mese** |

---

## PUNTI ANCORA DA DECIDERE

### Priorità ALTA

**T1. Email transazionali — provider per email "non di sistema"**
- Supabase gestisce out-of-the-box le email di sistema (verifica registrazione, recovery password) tramite il proprio servizio di email.
- Da decidere: per email "applicative" più complesse (es. notifica esito appello, comunicazioni community) si usa Supabase o un servizio dedicato come SendGrid/Resend/Mailgun?
- Da valutare quando si arriverà al pezzo di gestione email applicative.

**T2. Liveness detection per il selfie video**
- Il selfie video di 3 secondi per la verifica liveness richiede una libreria specifica per la cattura.
- Opzioni da valutare:
  - `expo-camera` + caricamento video grezzo a Supabase Storage (semplice, moderazione tutta manuale)
  - Librerie con liveness detection client-side (più sofisticato ma più complesso)
- Decisione rimandata alla fase di sviluppo della verifica.

### Priorità MEDIA

**T3. Monitoraggio errori e crash reporting**
- Quando l'app è live, serve sapere quando crasha o ha errori in produzione.
- Opzioni: Sentry (free tier generoso), Bugsnag, LogRocket.
- Da decidere prima del lancio in beta.

**T4. CI/CD (deploy automatico)**
- Sistema per buildare e pubblicare nuove versioni dell'app senza fare tutto a mano.
- Opzioni: Expo Application Services (EAS), GitHub Actions.
- EAS è il default per Expo, si integra natively. Da valutare in fase di lancio.

**T5. Strumenti di analytics**
- Per capire come gli utenti usano l'app (rispettando GDPR).
- Opzioni: PostHog (open source, hostabile EU), Plausible Analytics (EU, privacy-first), Mixpanel (US).
- Per coerenza con i valori del progetto, valutare PostHog self-hosted o Plausible.

### Priorità BASSA (post-lancio)

**T6. CDN per asset statici**
- Quando ci saranno avatar preset, immagini di onboarding, ecc., servirà una CDN per servirli velocemente.
- Supabase Storage può fare da CDN, oppure si valuta Cloudflare R2/Bunny.net.

**T7. Backup database**
- Supabase Pro include backup automatici giornalieri. Sotto free tier, fare backup manuali periodici.
- Importante quando si avrà la prima base utenti reale.

**T8. Disaster recovery e business continuity**
- Cosa succede se Supabase ha un'interruzione? Quanto tempo di downtime è accettabile?
- Definire RPO (recovery point objective) e RTO (recovery time objective) prima del lancio.

---

## NOTE SU INFRASTRUTTURA E HOSTING

### Server e dati: tutto in Europa
- **Supabase**: scegliere regione **Francoforte (eu-central-1)** in fase di setup. È fondamentale per GDPR.
- **Hetzner VPS (Appsmith)**: scegliere data center in Germania.
- **OneSignal**: ha server distribuiti, accettabile con DPA standard.
- **OpenAI**: API USA, ma trasmette solo testo dei messaggi (non dati identificativi), accettabile con DPA.

### Trasferimenti dati extra-UE
- Per OpenAI: testo dei messaggi viene trasmesso negli USA per moderazione. Va dichiarato nell'informativa privacy.
- Da valutare nel tempo: alternative europee per moderazione AI (es. Mistral AI ha modelli francesi, potrebbe arrivare un'API di moderazione).


## ROADMAP DI APPRENDIMENTO/SVILUPPO

Stima realistica per fondatore singolo che impara mentre costruisce, con supporto AI per il codice.

### Fase 0 — Setup e familiarizzazione (2-3 settimane)
- Setup ambiente di sviluppo (Node, Expo, VS Code, Git)
- Tutorial React Native + Expo (app demo "hello world" che gira su telefono)
- Tutorial Supabase (creazione progetto, prime tabelle, autenticazione)
- Ripasso TypeScript se serve
- Connessione tra app React Native ed un Supabase di prova

### Fase 1 — MVP minimale (2-3 mesi)
- Registrazione + login + verifica email
- Schermata di dichiarazione di appartenenza alla community + scelta categoria identità
- Profilo base con avatar preset (no foto)
- Chatroom globale funzionante con realtime
- Sistema base di segnalazioni
- Dashboard Appsmith con coda verifiche e segnalazioni

### Fase 2 — Verifica e moderazione complete (1-2 mesi)
- Selfie video liveness con `expo-camera`
- Sistema vouching (garanti)
- Permessi progressivi automatici (Strato 1 → 2 → 3)
- Filtro AI integrato (OpenAI Moderation + blocklist italiana)
- Procedure appelli via email

### Fase 3 — Chat tematiche + polish (1 mese)
- Aggiunta delle 2 chat tematiche
- DM con sistema accept-request
- Notifiche push (OneSignal)
- Refinement UI/UX

### Fase 4 — Beta privata e lancio (1-2 mesi)
- Submission App Store e Play Store
- Beta test con 20-50 persone della community
- Bug fixing
- Lancio pubblico

**Totale realistico**: **6-9 mesi** per fondatore singolo.

---

