# Sistema di block

Decisioni di prodotto per il sistema di block tra utenti. Tema critico per la sicurezza in un'app che ospita persone potenzialmente vulnerabili (lesbiche, queer, persone trans, donne in contesti familiari ostili).

Ultimo aggiornamento: 20 maggio 2026

---

## Indice

1. Principio guida
2. Perimetro del block — cosa smette di funzionare
3. Visibilità del block — chi sa cosa
4. Cronologia DM precedente al block — scelta dell'utente
5. Gestione e reversibilità
6. Block + ricerca + chatroom — casi limite
7. Block e ban (interazione con moderazione)
8. Anti-aggiramento
9. Punti aperti residui

Vedi anche:
- [`ricerca_utenti.md`](./ricerca_utenti.md) per come il block influisce sui risultati di ricerca
- [`moderazione.md`](./moderazione.md) per interazione tra block, segnalazioni e ban
- [`permessi_e_strati.md`](./permessi_e_strati.md) per i DM

---

## 1. Principio guida

> **Il block in questa app deve essere più protettivo che proporzionato. Meglio un block troppo forte e troppo facile da usare, che un block "bilanciato" che lascia spiragli a chi vuole nuocere.**

Conseguenze pratiche di questo principio, applicate in tutte le sezioni:
- Il block è **hard** (totale), non graduato.
- Si può bloccare con un tap, senza giustificazioni richieste.
- Nessun limite numerico al numero di utenti bloccabili.
- Asimmetrie nel block vengono sempre risolte a favore di chi blocca.
- Nessuna feature che permetta alla persona bloccata di "capire come essere sbloccata" o di contattare chi l'ha bloccata.

---

## 2. Perimetro del block — cosa smette di funzionare

**Scelta**: Hard block ovunque. ✅

Quando A blocca B, scatta una **invisibilità reciproca totale**:

| Area | Effetto del block |
|---|---|
| **DM** | B non può scrivere ad A. Nuovi messaggi falliscono lato client (vedi sezione 3). A non riceve nulla |
| **Profilo** | B non può vedere il profilo di A. Tentativo di accesso → schermata "profilo non esistente" generica |
| **Ricerca per nickname** | B che cerca "A" non la trova mai, anche con nickname esatto |
| **Ricerca a filtri** | A non compare mai nei risultati di B, e viceversa |
| **Chatroom** | A non vede i messaggi di B nelle chatroom condivise. B non vede i messaggi di A. Entrambe restano nella chatroom (nessuna espulsione), ma sono reciprocamente invisibili lato UI |
| **Lista membri chatroom** | Entrambe non compaiono nella lista membri dell'altra |
| **Online status** | Mai visibile reciprocamente (oltre alle regole già definite) |
| **Reazioni/menzioni** | B non può menzionare A in chatroom. Reazioni di B ai messaggi di A non vengono mostrate ad A |

### Perché "invisibilità in chatroom" e non "espulsione"

Espellere una delle due dalla chatroom condivisa sarebbe una punizione per chi non c'entra (la chatroom è un luogo comune). L'invisibilità lato UI mantiene la chatroom funzionante per entrambe senza che si "vedano". È un compromesso tecnico-etico: lato server entrambe sono presenti, lato client è come se l'altra non ci fosse.

### Asimmetria del block

Il block è **dichiarato unilateralmente da A** ma ha **effetti simmetrici sulla visibilità**. Cioè: anche se solo A blocca B, B non vede più A da nessuna parte. La motivazione è che un block "asimmetrico" (B sa ancora dove trovare A) lascia spazio a stalking — esattamente lo scenario da prevenire.

---

## 3. Visibilità del block — chi sa cosa

**Scelta**: Silenzioso, ma con segnale solo se la persona bloccata prova a scrivere. ✅

### Come si comporta il sistema

- **Nessuna notifica push o in-app** alla persona bloccata. Non viene mai detto esplicitamente "sei stata bloccata da X".
- Se la persona bloccata **prova a inviare un DM**, il messaggio non parte e compare un avviso **generico** del tipo: *"Impossibile inviare il messaggio in questo momento."*
- L'avviso è volutamente **ambiguo**: non distingue tra block, account cancellato, problema tecnico, sospensione. Non confermare né smentire che si tratti di un block.
- Se la persona bloccata cerca il nickname di chi l'ha bloccata, riceve lo stesso messaggio dei nickname inesistenti: *"Nessun risultato"* (coerente con la regola anti-doxxing già definita in `ricerca_utenti.md`).
- Se la persona bloccata clicca su un vecchio link al profilo (es. da uno screenshot, da un messaggio in chatroom letto prima del block), riceve: *"Profilo non disponibile."*

### Perché questa scelta (e non "silenzio totale" o "notifica esplicita")

- **Silenzio totale** (messaggi che sembrano partire ma non arrivano mai): è inganno. La persona continua a scrivere nel vuoto, accumula frustrazione e poi rabbia. Quando alla fine capisce, l'effetto è peggio della notifica.
- **Notifica esplicita** ("sei stata bloccata da X"): in mano a una persona problematica diventa fuel per ritorsioni — secondo account, ricerca della persona offline, escalation. Inutile e pericoloso.
- **Silenzioso con segnale generico** è il compromesso: la persona capisce che qualcosa non funziona, può smettere di provare, ma non ha conferma certa di essere stata bloccata né l'identità di chi l'ha bloccata (potrebbe essere un altro motivo).

---

## 4. Cronologia DM precedente al block — scelta dell'utente

**Scelta**: la decisione sulla cronologia DM viene **delegata all'utente che blocca**, al momento del block. ✅

### Il dialog di conferma del block

Quando A tappa "blocca" sul profilo o nella chat di B, compare un dialog con tre opzioni (ispirato al pattern di Wapa, img 1 della discussione):

- **Annulla** — il block non viene eseguito.
- **Solo blocca** — viene eseguito il block ma la cronologia DM resta come prima per entrambe (in sola lettura, nessuna delle due può scrivere nuovi messaggi). A mantiene l'evidenza, B mantiene la propria copia.
- **Blocca e cancella i miei messaggi anche per l'altra** — viene eseguito il block E i messaggi scritti da A vengono rimossi anche dal telefono di B. I messaggi scritti da B restano (non si toccano i contenuti altrui). A perde accesso alla cronologia completa? No: A continua a vedere la conversazione integrale dal proprio lato (inclusi i propri messaggi e quelli di B), è solo dal lato di B che spariscono i messaggi di A.

### Perché delegare all'utente

Coerente col principio guida "più protettivo che proporzionato": chi si protegge è la persona meglio posizionata per sapere se ha materiale sensibile da rimuovere o se vuole preservare le prove. Tre vantaggi:

1. **Empowerment**: chi blocca prende una decisione informata invece che subire una scelta di prodotto.
2. **Flessibilità per casi diversi**: chi blocca per molestie vuole tenere le prove → "Solo blocca". Chi blocca dopo aver condiviso materiale sensibile (coming out, foto intime, identità reale) vuole rimuovere ciò che ha mandato → "Blocca e cancella". Una sola scelta di prodotto non copre entrambi i casi.
3. **Asimmetria a senso unico**: si cancellano solo i messaggi scritti da A. Quelli scritti da B restano nei suoi log (sono suoi, A non ha diritto di cancellarli). Questo evita usi abusivi del "cancella per entrambe".

### Limiti tecnici da sapere

- La cancellazione lato client di B **non garantisce** che B non abbia già fatto screenshot. È un best-effort, non una garanzia. Va comunicato nei TOS.
- **Lato server** i messaggi restano nel backend per la durata di legge (vedi `gdpr_e_legale.md`), anche se "cancellati" lato UI di B. La scelta utente riguarda solo la visibilità sul telefono di B.
- **Lo sblocco non ripristina nulla**: se A ha scelto "Blocca e cancella", anche dopo lo sblocco i messaggi rimossi dal telefono di B non tornano. È un punto fermo.

### UX del dialog

- I tre bottoni vanno presentati senza forzare una scelta come "default migliore". L'utente deve poter scegliere consapevolmente.
- Il copy va testato per essere chiaro: la differenza tra "solo blocca" e "blocca e cancella" deve essere immediatamente comprensibile. Da iterare in fase di design.
- Considerare se aggiungere un tooltip/info-icon che spieghi "i messaggi di [B] restano, vengono cancellati solo i miei" per evitare malintesi.

---

## 5. Gestione e reversibilità

**Scelte**:
- Lista persone bloccate visibile ✅
- Sblocco con un tap, immediato ✅
- Nessun cooldown, nessun avviso paternalistico

### Lista persone bloccate

- Accessibile da Impostazioni → Privacy → Persone bloccate.
- Mostra: avatar, nickname, data del block.
- Ordinabile per data (default: più recente in alto).
- Funzione di ricerca interna alla lista (utile se diventa lunga).

### Sblocco

- Tap sul bottone "Sblocca" accanto al nickname.
- Conferma singola: *"Sbloccare [nickname]?"* — Sì / No.
- Effetto **immediato**: la persona torna visibile nelle aree dove prima era invisibile (chatroom, ricerca, profilo).
- **Lo sblocco non ripristina la cronologia DM** (qualunque sia la scelta finale del punto 4).
- **Lo sblocco non rimette in contatto automaticamente**: i nuovi DM richiedono comunque la solita procedura (richiesta-accettazione, requisiti DM).
- La persona sbloccata **non riceve alcuna notifica** dello sblocco. Coerente con la logica silenziosa del block.

### Limite numerico

- **Nessun limite** al numero di utenti bloccabili.
- Motivazione: mettere un cap segnalerebbe che "bloccare troppo è sospetto", e non lo è. Una persona può legittimamente bloccare 5 o 500 utenti — sono fatti sue. In un'app frequentata da potenziali bersagli di stalking, ogni cap sarebbe una limitazione difensiva ingiustificata.

### Re-block

- Si può ribloccare immediatamente dopo aver sbloccato, senza cooldown. Nessuna soglia "non puoi bloccare di nuovo questa persona per X giorni".

---

## 6. Block + ricerca + chatroom — casi limite

### Caso: la persona bloccata era una garante (sistema vouching)

- Vedi `permessi_e_strati.md` per il sistema vouching.
- Il block tra garante e garantita **non revoca automaticamente il vouching** già concesso. Lo strato dell'altra persona resta valido.
- Motivazione: il vouching è un atto formale di responsabilità verso la community, il block è un atto personale. Mischiarli porterebbe a vouching usati strumentalmente nelle dispute.
- **Eccezione**: se una utente segnala che la sua garante l'ha bloccata in modo abusivo (es. dopo che ha denunciato un suo comportamento), la moderazione può rivedere il vouching caso per caso.

### Caso: chatroom condivise con molti membri

- L'invisibilità reciproca funziona indipendentemente dal numero di membri.
- **Lato performance**: la lista membri di una chatroom va filtrata lato server per ciascuna utente sulla base della sua block list. Tecnicamente fattibile, ma è un punto da segnalare in `stack_tecnico.md` perché incide su come si caricano le liste.

### Caso: messaggi citati / risposte a un messaggio della persona bloccata

- Se C cita un messaggio di B (che A ha bloccato), A continua a non vedere il contenuto citato di B. Vede solo: *"[messaggio non disponibile]"* o equivalente.
- Coerente con la logica di invisibilità totale.

### Caso: A blocca B, poi A è bloccata da C; B e C non si conoscono

- Block tra A e B e block tra A e C sono **eventi indipendenti**. B e C continuano a vedersi normalmente.
- Nessuna logica "amico del bloccato è bloccato".

### Caso: persona bloccata riferita in un messaggio di terze parti

- Se in chatroom C scrive *"sono d'accordo con quello che ha detto B prima"* (con menzione testuale, non tag), A vede il messaggio di C normalmente. Il filtro di invisibilità si applica solo a contenuti **prodotti direttamente** dalla persona bloccata, non a menzioni indirette di terze parti.
- Motivazione: applicare il filtro anche alle menzioni indirette richiederebbe scansione semantica e censurerebbe conversazioni legittime.

---

## 7. Block e ban (interazione con moderazione)

- **Se la persona bloccata viene poi bannata** dalla piattaforma: il block resta nei record ma non ha più effetto pratico (la persona non è più nella community). Nessuna notifica all'utente che aveva bloccato — la persona semplicemente "sparisce" dall'app intera.
- **Se la persona bannata viene poi unbannata** via appello: i block precedenti tornano automaticamente attivi. L'unban non azzera le block list di nessuno.
- **Block come segnale per la moderazione**: se un singolo account viene bloccato da un numero anomalo di utenti diverse in un intervallo breve (soglia da definire, es. 10 block in 7 giorni), il sistema genera **automaticamente una review** della moderazione su quell'account. Non è una sanzione automatica, è un segnale di allerta. Dettagli in `moderazione.md`.

---

## 8. Anti-aggiramento

### Aggiramento via secondo account

- Una persona bloccata potrebbe tentare di creare un secondo account per aggirare il block.
- **Gestione**: si appoggia al sistema di verifica identità (vedi `utenti_e_identita.md`) — la verifica dovrebbe rendere costoso/improbabile creare account duplicati.
- Se nonostante questo viene segnalato un account-fantoccio di una persona bannata o di una utente che ha aggirato un block, la moderazione procede a **ban diretto** del fantoccio (vedi `moderazione.md`).
- **Non serve logica specifica nel sistema block** per questo: è un tema di verifica e moderazione, non di feature block.

### Aggiramento via screenshot e contatto esterno

- Se B ha screenshot del profilo o dei DM di A presi prima del block, e prova a contattarla fuori dall'app o a usarli per ritorsione: questo esce dal perimetro tecnico dell'app. È un caso di stalking che va gestito fuori (denuncia, autorità competenti).
- La documentazione di TOS deve essere chiara: l'app fa il massimo per proteggere ma non può controllare contenuti già usciti dalla piattaforma.

---

## 9. Punti aperti residui

- **Soglia "review automatica per block multipli"** (sezione 7): quanti block in quanto tempo fanno scattare la review? Ipotesi iniziale 10 in 7 giorni, da validare con dati reali una volta lanciata l'app.
- **Block list importabile/esportabile?**: utile in caso di migrazione o backup. Tendenzialmente no in v1, da rivalutare.
- **Notifica a chi blocca se l'utente bloccata viene bannata?**: no in v1 (la persona "sparisce" e basta). Si può aggiungere in futuro come informazione opzionale ("una persona che avevi bloccato non è più nella community"), ma rischia di esporre informazioni di moderazione.
- **Copy esatto del dialog di block** (sezione 4): le diciture "Solo blocca" / "Blocca e cancella i miei messaggi anche per l'altra" sono di lavoro. Da raffinare in fase di design UX per essere chiare e non spaventose.
