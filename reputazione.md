# Sistema di reputazione

Decisioni di prodotto per il sistema di reputazione degli utenti. La reputazione è un sistema parallelo agli Strati di permessi: gli Strati gestiscono i permessi crescenti automatici degli utenti onesti, la reputazione marca chi devia da quel percorso.

Ultimo aggiornamento: 20 maggio 2026

**Stato**: 🚧 In fase di definizione — pilastri decisi (sezioni 1-4), visibilità/decadimento e calibrazione ancora da definire (sezioni 5-6).

---

## Indice

1. Scopo del sistema (deciso)
2. Implicazioni di design (decise)
3. Relazione con gli Strati di permessi (decisa)
4. Cosa fa salire e scendere la reputazione (deciso)
5. Visibilità, decadimento, storicizzazione — DA DEFINIRE
6. Attivazione e calibrazione — DA DEFINIRE

Vedi anche:
- [`permessi_e_strati.md`](./permessi_e_strati.md) per gli Strati 1/2/3 (sistema complementare ma indipendente)
- [`moderazione.md`](./moderazione.md) per come i moderatori prendono le decisioni
- [`appelli.md`](./appelli.md) per come la reputazione può essere ripristinata dopo un ban erroneo

---

## 1. Scopo del sistema

**Scelta**: la reputazione è **uno strumento di moderazione invisibile**, e nient'altro.

Cioè: la reputazione è un segnale interno che i moderatori usano per **far emergere pattern** di comportamento problematico che non sono ancora chiari da una singola segnalazione. Non è un sistema di gerarchie, non sblocca permessi, non è visibile agli utenti.

### Esempio d'uso concreto

Arriva una segnalazione su una nuova utente che ha scritto un messaggio borderline. Il moderatore controlla la sua reputazione:
- Se è una utente con reputazione neutra/positiva e 6 mesi di buona condotta, il moderatore probabilmente archivia o manda un warning leggero.
- Se è una utente la cui reputazione è scesa di 5 punti negli ultimi 2 mesi, il moderatore guarda lo storico con più attenzione: forse non è il primo caso di linguaggio aggressivo, forse il pattern è chiaro.

Senza la reputazione, il moderatore dovrebbe scorrere tutta la cronologia delle segnalazioni passate dell'utente a mano, ogni volta. Con la reputazione vede un numero/trend e decide se andare più a fondo.

### Cosa NON fa il sistema

- ❌ Non sblocca permessi (di nessun tipo, in nessuna fase).
- ❌ Non è mai visibile all'utente (nemmeno a sé stessa).
- ❌ Non è mai visibile ad altri utenti (no badge, no indicatori).
- ❌ Non fa scattare azioni automatiche di moderazione (no warning automatici, no mute automatici, no ban automatici).
- ❌ Non fa scattare alert automatici ai moderatori sotto certe soglie.

---

## 2. Implicazioni di design

Dalle scelte sopra, derivano queste regole architetturali:

### 2.1. Tutte le decisioni di moderazione restano umane

La reputazione informa il giudizio dei fondatori, non lo sostituisce. Coerente con il principio già stabilito in [`moderazione.md`](./moderazione.md) sezione 5 (gestione "cis man / identità falsa" con revisione esclusiva dei fondatori): nessuna automazione su decisioni sensibili.

### 2.2. Il sistema è "read-only" per chi non modera

Solo i moderatori (fondatori in fase iniziale, eventualmente volontari in seguito — vedi [`moderazione.md`](./moderazione.md) sezione 1) hanno accesso alla reputazione. Per chiunque altro **non esiste**: non c'è API, non c'è schermata, non c'è badge.

### 2.3. Il sistema deve mostrare pattern, non singoli numeri

Visto che lo scopo è far emergere chi devia da un percorso normale, il valore singolo "reputazione = -3" è meno informativo del trend "reputazione passata da +5 a -3 negli ultimi 60 giorni". Quindi serve **storicizzare** l'andamento, non solo il valore corrente. Dettagli in sezione 5.

### 2.4. Il sistema parte dal giorno 1 del lancio

Diversamente dagli Strati 2/3 (che hanno senso solo con tempo trascorso e attività) e dal vouching (che richiede utenti già in Strato 3), la reputazione **serve subito**. I primi utenti sono quelli che richiedono più attenzione dai moderatori, e il sistema deve già marcare deviazioni di comportamento da quel momento.

### 2.5. La reputazione iniziale è neutra

Ogni utente parte con reputazione **0 (neutra)** appena verificata. Non c'è bonus per i nuovi iscritti, non c'è penalità. Il valore si muove solo in conseguenza di eventi concreti (vedi sezione 4).

---

## 3. Relazione con il sistema degli Strati di permessi

Reputazione e Strati sono **due sistemi paralleli che non si toccano**:

| Aspetto | Strati (1/2/3) | Reputazione |
|---|---|---|
| Cosa governa | Permessi che la utente può usare | Giudizio dei moderatori su quella utente |
| Visibile all'utente? | Sì (implicitamente, dai permessi sbloccati) | Mai |
| Visibile ad altri utenti? | No | Mai |
| Visibile ai moderatori? | Sì (dashboard) | Sì (dashboard) |
| Influenza decisioni automatiche? | Sì (sblocco automatico tra strati) | Mai |
| Influenza decisioni umane? | No (sono automatiche per definizione) | Sì (informa giudizio dei moderatori) |
| Quando si attiva? | Strato 1 dal giorno 1, Strato 2 dopo 7gg, Strato 3 dopo 30gg | Dal giorno 1 del lancio |

In pratica: un'utente onesta sale automaticamente da Strato 1 a 2 a 3 col passare del tempo e dell'attività. La sua reputazione resta vicina a 0 (neutra) finché non succede niente di notevole. Non c'è interazione tra i due sistemi.

Un'utente che invece accumula problemi può raggiungere uno Strato avanzato (perché ha tempo + messaggi sufficienti) **e contemporaneamente** avere reputazione negativa. Questo è esattamente il caso in cui la reputazione serve: rivela un disallineamento che gli Strati da soli non vedrebbero.

---

## 4. Cosa fa salire e scendere la reputazione

**Logica scelta**: sistema **asimmetrico**. La reputazione parte da **0 (neutra)** e **può solo scendere**. Non esistono eventi positivi che la fanno salire — l'unico movimento verso l'alto è il **decadimento naturale nel tempo** delle penalità (dettagli in sezione 5).

### 4.1. Motivazione della logica asimmetrica

Un sistema simmetrico (reputazione che sale e scende, tipo Reddit karma) è stato scartato per quattro ragioni:

1. **Coerenza con lo scopo invisibile** (sezione 1): serve a far emergere pattern di problemi, non a celebrare buoni utenti.
2. **Semplifica enormemente il design**: niente da calibrare sul lato positivo (quanto vale "non aver avuto segnalazioni"? un commento positivo?). Si calibra solo il lato negativo, che è oggettivo.
3. **Evita gamification involontaria**: in un sistema simmetrico, anche se invisibile, c'è sempre il rischio che prima o poi si decida di "premiare le utenti virtuose" introducendo badge o gerarchie. Esattamente ciò che il progetto ha deciso di non fare (vedi [`profilo_utente.md`](./profilo_utente.md) e [`monetizzazione.md`](./monetizzazione.md)).
4. **Equo rispetto al tempo di permanenza**: in un sistema simmetrico un'utente con 2 anni avrebbe automaticamente reputazione più alta di una nuova iscritta, solo per anzianità. Penalizzerebbe ingiustamente le nuove. Qui sono tutte a 0 finché non succede qualcosa.

### 4.2. Eventi che entrano nel sistema

Il sistema reputazione marca **solo eventi confermati di moderazione** sulla persona stessa. Due eventi, due pesi:

| Evento | Peso | Note |
|---|---|---|
| **Warning** confermato | **−1** | Per segnalazione lieve confermata, oppure per messaggio confermato come violazione dopo flag AI |
| **Mute temporaneo** confermato | **−3** | Sanzione qualitativamente più grave: impedisce di scrivere per N ore/giorni |

Un mute pesa 3 volte un warning (non 2) perché non è "un po' più di un warning" ma una sanzione qualitativamente diversa. Trattarlo come −2 lo banalizzerebbe.

Il "−2" non è usato nella scala iniziale: lascia un piccolo margine per un eventuale evento intermedio futuro, senza dover riprogettare i pesi esistenti.

### 4.3. Eventi che NON entrano nel sistema

Decisione esplicita: i seguenti eventi sono **fuori** dal sistema reputazione, ognuno per motivi specifici.

| Evento | Perché è fuori |
|---|---|
| **Segnalazione grave confermata** (molestie, hate speech, doxxing, contenuti illegali, ecc.) | Porta a ban diretto. L'utente esce dalla community, la reputazione non serve più |
| **Segnalazione archiviata** (i moderatori hanno deciso che non c'è violazione) | Conseguenza diretta della scelta del 20 maggio 2026: se non c'è violazione confermata, l'utente non ha sbagliato. Far pesare le archiviate penalizzerebbe chi viene segnalata in malafede (drama relazionali, ritorsioni dopo un "no") |
| **Messaggio flaggato dal filtro AI ma archiviato dai moderatori** | Falso positivo del filtro, non colpa dell'utente |
| **Essere bloccata da un singolo utente** | Il block è un atto personale, può essere arbitrario, non è un giudizio della community (vedi [`block.md`](./block.md)) |
| **Block multiplo dello stesso utente da parte di più persone** (soglia review automatica) | Già gestito come trigger di review in [`block.md`](./block.md) sezione 7. Non si duplica in reputazione |
| **Garanzia fallita** (utente garantita rivelatasi problematica) | Ha già un sistema autonomo di conseguenze in [`permessi_e_strati.md`](./permessi_e_strati.md) sezione 2 (3 garanzie fallite = perdita privilegio). Doppia penalizzazione evitata |
| **Recidiva ravvicinata** (warning a poca distanza l'uno dall'altro) | Ogni evento pesa per quello che è, indipendentemente dal tempo trascorso dall'evento precedente. Niente moltiplicatori di recidiva |

### 4.4. Limite consapevole del sistema

Dalle scelte sopra deriva un limite che vale la pena esplicitare:

> Il sistema reputazione **non rileva** un'utente che irrita molte persone con comportamento al limite senza mai violare regole specifiche (es. linguaggio aggressivo non hate speech, attriti sociali ricorrenti, ironia che ferisce ma non viola codice).
>
> Un caso ipotetico di "8 segnalazioni archiviate in 3 mesi su una sola persona" non genera alcun segnale automatico. I moderatori la noterebbero solo aprendo manualmente il profilo e scorrendo la cronologia delle segnalazioni.

Questo limite è **accettato consapevolmente**. L'alternativa (contare le archiviate) avrebbe portato a complessità nelle soglie e a una zona grigia etica.

Se in futuro emergerà che questo limite causa problemi reali (es. persone tossiche che continuano a operare al di sotto della soglia di violazione formale), si valuterà se introdurre un indicatore separato in dashboard ("N archiviate negli ultimi M giorni") **senza modificare il calcolo della reputazione**. Per ora non è previsto.

### 4.5. Soglie indicative per i moderatori

I numeri sotto sono **indicazioni di orientamento iniziali**, non automatismi. Servono solo a dare ai moderatori una griglia interpretativa quando guardano il punteggio in dashboard. Verranno ricalibrati con dati reali (vedi sezione 6).

| Reputazione | Interpretazione | Conseguenze pratiche |
|---|---|---|
| **0** | Utente normale, nessun evento confermato | Caso di default, nessuna attenzione particolare |
| **da −1 a −3** | Qualche evento, ma caso isolato | Non significa niente di particolare. L'attenzione del moderatore va sull'evento specifico in corso, non sul punteggio |
| **da −4 a −9** | Storia di problemi | Una nuova segnalazione su questa persona si guarda con più attenzione al pattern |
| **≤ −10** | Storia pesante | Decisioni da prendere con cautela, probabilmente con consultazione tra i due fondatori. Una nuova segnalazione confermata su questa persona è probabilmente da escalare verso ban definitivo |

**Importante**: queste soglie hanno senso solo provvisoriamente. Cambieranno di significato una volta deciso il **decadimento nel tempo** (sezione 5): un'utente che ha preso 10 warning in un mese è qualitativamente diversa da una che li ha presi diluiti in 5 anni, anche se il valore corrente del punteggio fosse identico.

---

## 5. Visibilità, decadimento, storicizzazione

🚧 **Da definire in sessione successiva.**

Argomenti aperti:
- Storicizzazione: per quanto tempo si conserva l'andamento della reputazione? (vedi anche [`gdpr_e_legale.md`](./gdpr_e_legale.md) per i tempi di retention dei dati di moderazione)
- Decadimento delle segnalazioni archiviate nel tempo: una segnalazione di 1 anno fa pesa quanto una di ieri?
- Decadimento del punteggio negativo: una reputazione molto bassa si "riassorbe" con buona condotta nel tempo?
- Visualizzazione in dashboard: solo valore corrente? Trend? Sparkline? Lista eventi recenti?

---

## 6. Attivazione e calibrazione

🚧 **Da definire in sessione successiva.**

Argomenti aperti:
- Soglie indicative (es. "reputazione sotto -X = guarda con attenzione"): da calibrare con dati reali, ma serve una proposta di partenza
- Processo di revisione (analogo a quello del filtro AI in [`moderazione.md`](./moderazione.md) sezione 6.1): dopo quanto tempo / quanti utenti rivedere le regole?
- Come gestire il ripristino dopo appello accolto (vedi [`appelli.md`](./appelli.md)): la reputazione viene resettata, mantenuta, parzialmente compensata?
