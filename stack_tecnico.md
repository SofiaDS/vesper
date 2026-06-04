# Stack tecnico — App community lesbica/queer

Documento dedicato alle decisioni tecniche di progetto: linguaggi, framework, servizi, infrastruttura, costi.
Documento complementare ai file di decisioni di prodotto (vedi `README.md` per la mappa completa).

Ultimo aggiornamento: 4 giugno 2026

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

### 1bis. Strategia di delivery — PWA-first (React + Vite), poi Capacitor

- **Decisione (4 giugno 2026)**: si parte con una **PWA** (Progressive Web App) in **React + Vite + TypeScript**, non con React Native + Expo da subito. Il nativo arriva in un secondo momento avvolgendo lo stesso codice con **Capacitor**.
- **Motivazione** (legata ai requisiti operativi dei founder):
  - **Iterazione immediata**: ogni `git push` su GitHub innesca un deploy automatico su Vercel/Netlify → l'app aggiornata è online in ~30s su un URL, senza alcun passaggio da store. In locale, hot-reload istantaneo con `npm run dev`.
  - **Test senza attrito per chi non è tecnico**: l'altra founder testa aprendo **un semplice link** nel browser (con opzione "Aggiungi a schermata Home"). Niente installazione di app, niente Expo Go/QR, niente TestFlight/inviti store.
  - **Sfrutta la skill esistente**: esperienza FE web (React/JS) spendibile direttamente.
  - **Nessuna policy store da gestire in fase iniziale** (utile per un'app LGBTQ+).
  - **Backend invariato**: Supabase è identico per PWA o nativo, quindi nessun lavoro buttato nel passaggio.
- **Contro accettati**:
  - Su **iOS** alcune capacità native sono limitate nella PWA: web push solo se l'app è aggiunta alla Home; cattura video per verifica liveness fattibile ma meno fluida del nativo.
  - Nessuna presenza su App Store / Play Store finché non si fa il wrap con Capacitor.
- **Percorso nativo (più avanti)**: **Capacitor** impacchetta la stessa codebase React in app native iOS/Android, sbloccando push robuste (OneSignal), fotocamera per la verifica e presenza sugli store, **senza riscrivere il frontend**.
- **Rapporto con la decisione 1**: React Native + Expo resta valido come opzione per il nativo, ma il percorso scelto è **PWA → Capacitor** per minimizzare il time-to-launch. La decisione 1 va letta come "stack mobile di riferimento", superata in pratica da questa per la fase MVP.

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
- **Modalità iniziale**: soft mode (vedi `moderazione.md` sezione 6) — messaggi flaggati visibili ai moderatori senza blocco automatico al day-one.

### 5. Dashboard moderatori — Appsmith self-hosted

(Già definito in `moderazione.md` sezione 7, qui solo riferimento)

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

### 9. Feature "Segnala un problema" — mailto pre-compilato

- **Scelta**: bottone "Segnala un problema" in Impostazioni che apre il client email predefinito dell'utente con destinatario e oggetto pre-compilati. Pattern ispirato a Wapa (img 13 della discussione del 20 maggio 2026).
- **Motivazione**:
  - Zero overhead per le utenti (niente form custom, niente accesso ai dati del device da richiedere).
  - Zero infrastruttura lato backend in v1 (nessuna API da costruire, nessun database di issue tracking).
  - Triage rapido lato team grazie ai tag nell'oggetto.
  - Filtri email automatici per smistare le segnalazioni.
- **Cosa pre-compilare nell'oggetto**:
  - Tipo di segnalazione (scelto dall'utente prima di aprire l'email tramite un piccolo selettore): `#crash`, `#bug`, `#feedback`, `#a11y`.
  - Piattaforma (auto): `#android` o `#ios`.
  - Versione app (auto): `#v1.2.3`.
  - Identificatore utente parziale/hash (auto): `#u-XXXXX` — **non l'email reale, non il nickname**, per privacy in caso di forward.
  - Session ID o report UUID (auto): `#s-XXXXX` — utile per correlare con log lato server.
- **Cosa NON pre-compilare**: email reale dell'utente, nickname, città, coordinate GPS.
- **Corpo email**: vuoto, con placeholder che suggerisce cosa includere ("Descrivi cosa stavi facendo quando è successo, cosa ti aspettavi, cosa è successo invece...").
- **Destinatario**: mailbox dedicata (es. `bug@[dominio]`) **separata** da:
  - quella di supporto generale,
  - quella di gestione appelli (vedi `appelli.md`),
  - quella di comunicazione legale/GDPR (vedi `gdpr_e_legale.md`).
  La separazione permette filtri e routing diversi, e tiene pulite le caselle.
- **Implementazione tecnica**: API `Linking.openURL("mailto:...")` di React Native, 5 righe di codice. Nessuna libreria esterna richiesta. Vedi anche T3 (Sentry/Bugsnag) per crash reporting automatico — bug report manuale e crash report automatico sono complementari, non alternativi.
- **Posizionamento UX**: Impostazioni → Help / Supporto → "Segnala un problema". Distinto da:
  - "Segnala un utente" (dentro chatroom/profilo, va alla moderazione, vedi `moderazione.md`).
  - "Appello" (flusso email dedicato già definito in `appelli.md`).
  - "Sostieni il progetto" (donazione esterna, vedi `monetizzazione.md`).
- **Gratis per tutti**: rientra nella categoria support/safety di `monetizzazione.md` sezione 4 — mai dietro paywall.

### 10. Appartenenza alle chat — modello multi-room

- **Decisione di prodotto**: vedi `chatroom.md` sezioni 4-5 (un'utente sta in più chat con tetto 1 Foyer obbligatoria + max 3 tematiche).
- **Modello dati**: tabella di join `chat_membership` (`user_id`, `chatroom_id`, `joined_at`). L'appartenenza è un concetto di prima classe da subito, anche se al lancio (3 chat totali) il tetto non "morde" ancora.
- **Enforcement del limite**: regola applicativa lato client + blindatura lato DB con `CHECK`/trigger PostgreSQL su Supabase (Foyer non lasciabile; max 3 righe "tematica" per `user_id`). Evita aggiramenti via client manomesso.
- **Realtime**: ogni client si abbona **solo** ai canali delle chat di cui fa parte → meno sottoscrizioni per utente, meno carico e consumo (coerente coi principi di costo).
- **Liste membri / conteggi**: il numero utenti e l'eventuale anteprima nella pagina "Le mie chat" vanno filtrati lato server sulla block list di ciascuna utente (vedi `block.md` sezione 6). Punto di attenzione su come si caricano le liste a chatroom popolose.
- **Al lancio**: tutte auto-iscritte a Foyer + 2 tematiche; la UX di join/leave e il tetto diventano rilevanti solo quando le chat tematiche supereranno le 3 (fase di espansione, vedi `chatroom.md` sezione 3).

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
| **Dominio principale** | Porkbun/OVH (.it) | €7-8/anno (~€0.7/mese) | €0.7/mese | €0.7/mese |
| **Dominio difensivo** | Cloudflare Registrar (.com) | €9/anno (~€0.8/mese) | €0.8/mese | €0.8/mese |
| **Email applicative (sistema)** | Supabase incluso fino a soglie | €0 | €0-15/mese | €15-50/mese |
| **Email caselle dedicate** | Zoho Mail Free (5 caselle) | €0 | €0 | €0 (o ~€5/mese se serve upgrade Lite) |
| **PWA hosting** | Vercel/Netlify Free | €0 | €0 | €0-20/mese (se bandwidth alta) |
| **Versionamento codice** | GitHub privato | €0 | €0 | €0 |
| **TOTALE STIMATO** | | **~€17-27/mese** | **~€52-152/mese** | **~€145-675/mese** |

---

## PUNTI ANCORA DA DECIDERE

### Priorità ALTA

**T1. Email — Zoho Mail Free per tutte le caselle**

- Supabase gestisce out-of-the-box le email di sistema (verifica registrazione, recovery password) tramite il proprio servizio di email.
- **Provider per caselle dedicate**: **Zoho Mail Free** (decisione del 20 maggio 2026).
  - 5 caselle gratis sul dominio dell'app, 5 GB per casella, IMAP/POP3/SMTP completi.
  - Webmail, app mobile, possibilità di inviare *da* ogni casella (non solo ricevere).
  - Server EU disponibili, DPA disponibile per compliance GDPR.
- **Caselle email da creare**:
  - `bug@[dominio]` → bug report tecnici (feature "Segnala un problema", vedi punto 9 sopra)
  - `help@[dominio]` o `support@[dominio]` → supporto generale
  - `appelli@[dominio]` → gestione appelli (vedi `appelli.md`)
  - `privacy@[dominio]` o `dpo@[dominio]` → richieste GDPR e data protection (vedi `gdpr_e_legale.md`) — casella tenuta separata per audit trail su richieste con scadenze legali (es. 30 giorni risposta GDPR)
  - `info@[dominio]` o `hello@[dominio]` → contatti generali (sito, comunicazione esterna)
- **Motivazione della scelta Zoho**:
  - Cloudflare Email Routing (solo forwarding) sarebbe stato sufficiente per le caselle "leggere", ma `privacy@`/`dpo@` ha esigenze di audit trail e capacità di inviare risposte ufficiali da quell'indirizzo. Avere due provider diversi (Cloudflare per le leggere, Zoho per la legale) aggiungerebbe complessità senza risparmiare nulla: tanto vale partire con Zoho per tutto.
  - 5 caselle gratis = esattamente le 5 che servono. Senza margine ma sufficiente. Se in futuro serviranno più caselle (es. `eventi@`, `partnership@`), si valuterà l'upgrade a Zoho Mail Lite (~€1/mese per casella).
- **Alternative considerate e scartate**:
  - **Cloudflare Email Routing**: gratis e illimitato, ma solo forwarding (non si può inviare da bug@dominio direttamente). Inadatto a casella legale/GDPR.
  - **ProtonMail Free**: una sola casella, no custom domain nel free tier.
  - **Google Workspace / Microsoft 365**: ~€6/mese per casella, overkill in v1.
- **Da decidere ancora**: per email "applicative" inviate dal backend (es. notifica esito appello automatica, comunicazioni community) — si usa Supabase, o un servizio dedicato tipo Resend/SendGrid/Mailgun? Le caselle Zoho sono per email "umane" (lette e scritte dai founder), non per invio massivo programmatico dal codice.

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

**T5. Strumenti di analytics**

- Per capire come gli utenti usano l'app (rispettando GDPR).
- Opzioni: PostHog (open source, hostabile EU), Plausible Analytics (EU, privacy-first), Mixpanel (US).
- Per coerenza con i valori del progetto, valutare PostHog self-hosted o Plausible.

**T9. Filtraggio lato server delle liste membri chatroom in base alla block list**

- Conseguenza dell'invisibilità reciproca decisa in `block.md` sezione 6: la lista membri di una chatroom va filtrata lato server per ciascuna utente sulla base della propria block list.
- Tecnicamente fattibile con join su tabella `blocks` durante il caricamento della lista membri, ma incide su performance quando le chatroom diventano grandi e/o le block list lunghe.
- Da progettare in fase di sviluppo della chatroom: serve indice su `blocks(blocker_id, blocked_id)` e probabile caching della block list dell'utente attiva lato client per filtrare anche i messaggi in arrivo via realtime.
- Stesso pattern si applica al filtraggio dei risultati di ricerca (`ricerca_utenti.md` sezione 8) e dei messaggi citati (`block.md` sezione 6).

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
