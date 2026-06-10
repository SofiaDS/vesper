# Moderazione

Tutte le decisioni su come viene moderata la community: chi modera, come si segnala, filtro AI, dashboard moderatori, gestione casi speciali.

Ultimo aggiornamento: 21 maggio 2026

---

## Indice

1. Chi modera
2. Passaggio dai fondatori ai volontari
3. Categorie di segnalazione
4. Flusso di segnalazione (UX utente)
5. Gestione speciale "cis man / identità falsa"
6. Filtro AI per linguaggio (soft mode)
7. Dashboard moderatori

Vedi anche:
- [`appelli.md`](./appelli.md) per cosa succede dopo un ban
- [`minori_e_eta.md`](./minori_e_eta.md) per la categoria "sospetto minorenne"
- [`stack_tecnico.md`](./stack_tecnico.md) per dettagli implementativi del filtro AI e della dashboard

---

## 1. Chi modera

- **Scelta**: solo i 2 fondatori in fase iniziale. A tendere, moderatori volontari dalla community.
- **Motivazione**: zero costi in fase MVP, controllo totale all'inizio. Opzioni a pagamento escluse per ora, da rivalutare solo se il volume diventerà ingestibile anche con i volontari.

---

## 2. Passaggio dai fondatori ai volontari

- **Quando**: trigger oggettivo — quando il tempo medio di risposta alle segnalazioni supera le **8 ore**.
- **Come si diventa moderatrice**:
  - Auto-candidatura aperta a utenti in Strato 3 (vedi [`permessi_e_strati.md`](./permessi_e_strati.md)), approvata dai fondatori.
  - Oppure invito diretto da parte di un fondatore a un'utente meritevole.
- **Poteri differenziati**:
  - **Volontari**: mute temporaneo, archiviazione segnalazioni lievi, warning agli utenti.
  - **Fondatori**: ban permanenti, gestione appelli, decisioni su casi controversi, gestione segnalazioni "cis man / identità falsa", gestione segnalazioni "sospetto minorenne".

---

## 3. Categorie di segnalazione

### Gravi (ban immediato o rapida revisione fondatori)

- Sospetto uomo cis in malafede / identità falsa (vedi sezione 5)
- **Sospetto minorenne** (procedura specifica, vedi [`minori_e_eta.md`](./minori_e_eta.md))
- Molestie sessuali, contenuti non richiesti, dick pics
- Hate speech (transfobia, bifobia, razzismo, abilismo, ecc.)
- Minacce, doxxing, condivisione di info private
- Spam commerciale o link sospetti
- Account chiaramente fake/bot
- Contenuti illegali (minori, violenza esplicita)

### Lievi (warning + mute temporaneo)

- Linguaggio aggressivo o offensivo in discussioni
- Insistenza dopo un "no" a un DM
- Off-topic ripetuto
- Auto-promozione/pubblicità non commerciale ma ripetuta

### Zona grigia (caso per caso, discussione tra moderatori)

- Conflitti politici interni alla community (dibattiti su identità, terminologia)
- Drama relazionali tra utenti

### Esplicitamente NON segnalabili

- Critiche all'app o ai fondatori (sono opinioni legittime, vanno gestite con risposta pubblica, mai con censura).

---

## 4. Flusso di segnalazione (UX utente)

**Punto di ingresso**:
- Tap su messaggio in chatroom → opzione "segnala"
- Tap sul profilo utente → opzione "segnala"

**Form di segnalazione**:
- Categoria obbligatoria da scegliere (lista delle gravi + lievi + "altro")
- Categoria "cis man / identità falsa" presente come opzione specifica
- Categoria "sospetto minorenne" presente come opzione specifica
- Possibilità di aggiungere testo libero opzionale
- Possibilità di allegare screenshot (opzionale)

**Esperienza utente dopo la segnalazione**:
- **Feedback immediato**: "Grazie, abbiamo ricevuto la segnalazione".
- **Notifica push quando il caso è chiuso**, con esito **vago e generico**:
  - "Abbiamo esaminato la segnalazione e preso provvedimenti"
  - oppure "Abbiamo esaminato la segnalazione, non sono emerse violazioni"
- **Nessuna informazione specifica** sull'azione presa verso l'altro utente (per privacy ed evitare ritorsioni).

---

## 5. Gestione speciale "cis man / identità falsa"

Questa è la categoria più delicata perché un falso positivo (bannare per errore una donna trans o una donna cis dall'aspetto non convenzionale) ha un costo umano alto.

**Procedura specifica**:
- **Coda prioritaria**: revisione **esclusiva dei fondatori**, mai dei volontari.
- **Account segnalato**: messo silenziosamente in stato "under review" (può continuare a usare l'app, ma le sue azioni sono flaggate per i moderatori).
- **Se confermato**: ban + propagazione ai garanti (sistema vouching, vedi [`permessi_e_strati.md`](./permessi_e_strati.md)).
- **Se non confermato**: segnalazione archiviata.
- **Soglia di insistenza**: se la stessa persona riceve 3+ segnalazioni di questo tipo da utenti diverse, scatta una revisione approfondita anche se le singole segnalazioni sono state archiviate.

**Motivazione della cautela**: il falso positivo qui ha un costo umano alto, quindi cautela massima. L'appello in caso di ban "cis man" è **sempre obbligatorio per principio etico** (vedi [`appelli.md`](./appelli.md)).

---

## 6. Filtro AI per linguaggio (soft mode iniziale)

- **Scelta provvisoria**: attivare un filtro AI dal day-one in **modalità "soft"**, combinato con una **blocklist italiana custom**.

**Funzionamento**:
- Ogni messaggio passa per OpenAI Moderation API + blocklist italiana custom prima/durante la pubblicazione.
- I messaggi flaggati vengono **pubblicati normalmente** (nessun blocco automatico al day-one), ma compaiono nella coda moderatori con etichetta "⚠️ potenziale violazione".
- I fondatori revisionano i flag, decidono se intervenire (ban/warning/mute) o archiviare.

**Motivazione**:
- In una community LGBTQ+ italiana il rischio di falsi positivi è alto: parole come "lesbica", "frocia", "ricchione" sono spesso usate in modo riappropriato/affettuoso dentro la community, ma le AI generaliste le segnalano come hate speech.
- L'AI è meno accurata in italiano che in inglese, specie sullo slang queer.
- Modalità soft permette di **osservare il comportamento del filtro sui dati reali** prima di abilitare blocchi automatici.

**Blocklist italiana custom**: costruita progressivamente dai fondatori, partendo da una lista iniziale di slur transfobici/bifobici/lesbofobici e ampliata sulla base dei casi reali.

**Costi**: OpenAI Moderation API è gratuita. Costo zero in fase iniziale.

**Evoluzione futura (da decidere dopo 1-2 mesi di dati reali)**:
- Mantenere tutto in soft mode (se i falsi positivi sono troppi).
- Passare ad "hard mode selettiva": blocco automatico solo per categorie ad alta confidenza (es. "violence", "sexual/minors", "self-harm"), il resto resta in soft.
- Calibrare le soglie di confidenza dell'API per ridurre falsi positivi.
- **Censura visiva dei messaggi flaggati** (placeholder con emoji, es. 🌈/❤️, al posto del testo nei client finché un moderatore non revisiona): idea emersa il 10 giugno 2026, da valutare con cautela per il rischio di censurare in chat reale termini riappropriati dalla community (vedi sopra) — non da introdurre al day-one.

**Nota importante**: questa configurazione è da considerare come **approccio iniziale di partenza**, non come scelta definitiva. Va rivista dopo il primo mese di lancio sulla base dei dati reali raccolti.

### 6.1. Processo di revisione del filtro AI (deciso il 20 maggio 2026)

La revisione del filtro AI non è un evento "una tantum" dopo il lancio, ma un processo strutturato e ripetibile, in modo che le decisioni si basino su dati reali e non sull'impressione del momento.

**Trigger della revisione**:
- **Prima revisione**: dopo **1 mese** dal lancio effettivo dell'app (non dal day-one tecnico, dal momento in cui ci sono utenti reali che scrivono in chatroom).
- **Revisioni successive**: ogni **3 mesi**, finché il filtro non raggiunge una configurazione stabile.
- **Revisione anticipata su segnale forte**: se in qualsiasi momento la coda dei flag AI ha un tasso di falsi positivi visibilmente alto (>50% archiviati dai moderatori) o sta diventando ingestibile, la revisione viene anticipata senza aspettare la data.

**Dati da raccogliere per la revisione**:
- Numero totale di messaggi flaggati dal filtro nel periodo.
- Esito di ciascun flag: archiviato come falso positivo, confermato con warning, confermato con mute, confermato con ban.
- Distribuzione per categoria OpenAI (hate, violence, sexual, self-harm, ecc.).
- Tasso di precisione per categoria (% di flag confermati come violazione reale).
- Casi notevoli di falsi positivi ricorrenti (es. parole riappropriate dalla community che continuano a essere flaggate).
- Casi notevoli di falsi negativi noti: violazioni reali emerse via segnalazione utente ma che il filtro AI non aveva intercettato.

**Decisioni che la revisione può prendere**:
- Confermare la modalità soft per tutte le categorie.
- Passare a "hard mode selettiva": blocco automatico solo per categorie con precisione molto alta (es. ≥95%) e gravità elevata (probabilmente "sexual/minors", "self-harm/instructions"). Le altre categorie restano in soft.
- Aggiornare la blocklist italiana custom (aggiungere termini emersi come problematici, rimuovere termini che generano troppi falsi positivi nella community).
- Aggiungere allowlist (eccezioni) per termini riappropriati che il filtro continua a flaggare ma che la community usa in modo non offensivo.
- Calibrare le soglie di confidenza dell'API per ridurre falsi positivi.

**Chi conduce la revisione**:
- I due fondatori insieme, in una sessione dedicata.
- I dati vengono estratti dalla dashboard Appsmith (sezione "Coda flag AI" con storico, vedi sezione 7).

**Documentazione delle decisioni**:
- Ogni revisione produce un breve verbale interno con dati raccolti, decisioni prese, motivazione.
- I verbali sono conservati come storico per le revisioni successive (utile per capire trend, non ripetere errori, giustificare cambi di configurazione in caso di contestazioni GDPR).

**Allineamento con altri processi simili**:
- Questo schema (trigger → dati → decisioni → verbale) è il modello da replicare per altri processi di calibrazione del sistema: vedi `permessi_e_strati.md` sezione 3 (calibrazione soglie strati), `reputazione.md` sezione 6 (calibrazione soglie reputazione, ancora da definire). Mantenere uno schema comune semplifica il lavoro dei fondatori.

---

## 7. Dashboard moderatori

- **Scelta**: **Appsmith Community Edition self-hosted su server europeo**.
- **Motivazione tecnica e GDPR**: i dati sensibili (selfie video, messaggi, segnalazioni) restano sulla nostra infrastruttura, non passano per server USA. Vedi [`gdpr_e_legale.md`](./gdpr_e_legale.md) e [`stack_tecnico.md`](./stack_tecnico.md) per dettagli completi.

**Sezioni essenziali della dashboard al day-one**:

1. **Coda verifiche pendenti**: lista nuove registrazioni con selfie video, categoria dichiarata, pulsanti approva/rifiuta.
2. **Coda segnalazioni**: ordinata per gravità, con dettagli, contesto, azioni (archivia/warning/mute/ban).
3. **Coda flag AI** (soft mode): messaggi flaggati dal filtro automatico, con categoria di rischio.
4. **Profilo utente in dettaglio**: dati, storico messaggi, segnalazioni ricevute, azioni subite, garanti/garantite.
5. **Statistiche base**: utenti totali, attive 7gg, nuove registrazioni giorno, ban, tempo medio risposta segnalazioni (per monitorare trigger 8 ore).

**Principi UX della dashboard** (da implementare in fase di build):

- Schermata principale unica con tutte le code in colonne, niente menu nascosti.
- Pulsanti grossi e colorati per azioni frequenti.
- Conferma obbligatoria per azioni irreversibili (ban).
- Storico azioni del moderatore visibile (es. "hai approvato 14 verifiche oggi").
- Filtri salvati per viste ricorrenti.
- Note interne tra moderatori per ogni utente segnalato (textarea condivisa).

**Alternative valutate e scartate**:
- **Retool Cloud**: scartato per problema trasferimento dati USA, anche se più polished.
- **Retool Self-Hosted**: tecnicamente ok ma licenza commerciale, Appsmith open-source è più allineato con i valori del progetto.
- **Tooljet**: vendor lock-in più forte (runtime custom per funzioni avanzate), meno maturo.
- **Budibase**: ottimo per no-code veloce, ma meno flessibile per logiche custom — non gioca a favore del fondatore che è dev.
- **Firebase Console + script custom**: zero dipendenze ma poco usabile per moderatori non tecnici.

---

## Punti aperti sulla moderazione

- **SLA esatti di risposta per segnalazioni gravi** (target <2h?). Vedi [`punti_aperti.md`](./punti_aperti.md).
- ~~**Revisione del filtro AI** dopo 1-2 mesi di dati reali (passaggio a hard mode selettiva o no).~~ ✅ Processo definito il 20 maggio 2026 (vedi sezione 6.1). Resta l'esecuzione al raggiungimento del trigger.
