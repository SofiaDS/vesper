# Permessi e strati

Come funziona il sistema di permessi progressivi che gli utenti sbloccano nel tempo, e il sistema di vouching (garanti).

Ultimo aggiornamento: 21 maggio 2026

---

## Indice

1. I 3 strati di permessi progressivi
   1.1. Filtro DM in ricezione (configurabile da Strato 2)
2. Sistema vouching (garanti)
3. Note aperte sulle soglie

Vedi anche:
- [`utenti_e_identita.md`](./utenti_e_identita.md) per come si entra nel sistema (Strato 1)
- [`moderazione.md`](./moderazione.md) per le segnalazioni che impattano la reputazione
- [`appelli.md`](./appelli.md) per come gestire ban erronei e ripristino strati

---

## 1. I 3 strati di permessi progressivi

Dopo la verifica iniziale, ogni utente è automaticamente al **Strato 1**. Sblocca progressivamente i livelli successivi accumulando tempo, attività e buona reputazione.

### Strato 1 — Utente base (subito dopo verifica)

**Permessi attivi**:
- Leggere la chatroom globale e le chat tematiche
- Scrivere in chatroom globale e tematiche
- Modificare il proprio profilo
- Segnalare altri utenti/messaggi

**Permessi NON ancora attivi**:
- Inviare richieste DM
- Foto profilo pubblica (nota: in v1 niente foto, solo avatar — vedi [`profilo_utente.md`](./profilo_utente.md). La distinzione di permesso sulle foto sarà rilevante solo da v2)
- Creare contenuti community avanzati

### Strato 2 — Utente attiva

**Requisiti per arrivarci**:
- 7 giorni di permanenza dalla verifica
- Almeno 20 messaggi scritti in chatroom
- 0 segnalazioni gravi ricevute

**Permessi sbloccati in più**:
- Inviare richieste DM (con requisito: 4-5 messaggi minimi in chatroom + accettazione destinataria)
- Foto profilo pubblica (rilevante quando si introdurranno foto reali in v2, vedi [`profilo_utente.md`](./profilo_utente.md))
- Configurare il proprio **filtro DM in ricezione** (chi può inviarmi richieste). Vedi sotto-sezione 1.1.

### Strato 3 — Utente fidata

**Requisiti per arrivarci**:
- 30 giorni di permanenza dalla verifica
- Almeno 100 messaggi scritti in chatroom
- Reputazione positiva (nessuna segnalazione grave confermata, eventuali segnalazioni lievi gestite)

**Permessi sbloccati in più**:
- Creare gruppi locali (post-MVP)
- Organizzare eventi (post-MVP)
- **Garantire per nuove utenti** (vouching, vedi sezione 2)
- Candidarsi come moderatrice volontaria (vedi [`moderazione.md`](./moderazione.md))

### 1.1. Filtro DM in ricezione (configurabile da Strato 2)

Oltre al requisito generale per inviare richieste DM (mittente almeno Strato 2 + 4-5 messaggi in chatroom + accettazione destinataria), ogni utente da Strato 2 in poi può **restringere ulteriormente chi può inviarle richieste DM** tramite un filtro nel proprio profilo. Il filtro non è obbligatorio (default: aperto a tutte chi soddisfa i requisiti generali) ed è impostazione **interna, non visibile ad altri utenti** (vedi `profilo_utente.md`).

**Opzioni disponibili** (selezionabili una alla volta, non combinabili in v1):
- **Tutte** (default): chiunque soddisfi i requisiti generali può inviarmi richieste.
- **Dalla mia città**: solo utenti che hanno reso pubblica la propria città e che sono nella mia stessa città.
- **Con i miei stessi intenti**: solo utenti che hanno reso pubblico almeno un valore del campo "Cerco / Intenti" in comune con il mio.
- **Verificate da almeno X mesi**: solo utenti la cui verifica iniziale risale ad almeno 3 / 6 / 12 mesi prima (soglia scelta dall'utente).

**Come si comporta il sistema quando una richiesta viene bloccata dal filtro**:
- Lato mittente: stessa esperienza prevista per altri casi di non-recapito (vedi `block.md` sezione 3). Messaggio generico "Impossibile inviare la richiesta in questo momento", senza dire perché. Evita che si possa "scoprire" il filtro impostato dall'altra utente.
- Lato destinataria: nessuna notifica, la richiesta non arriva mai.
- Lato moderazione: i tentativi falliti **non vengono loggati** come segnale di reputazione (vedi `reputazione.md` sezione 4.3) — il filtro DM è un legittimo strumento di confort dell'utente, non un evento di moderazione.

**Cosa il filtro DM NON fa**:
- Non sostituisce il sistema di block (sono livelli diversi: il filtro restringe chi può scrivere in prima istanza, il block è una risposta a una persona specifica).
- Non è visibile ad altri (un'utente non sa se sta tentando di scrivere a qualcuna che ha attivato un filtro).
- Non si applica retroattivamente: conversazioni già aperte non vengono interrotte dall'attivazione del filtro.

**Perché è attivabile da Strato 2**:
Da Strato 2 si può sia inviare sia ricevere richieste DM. Configurare il filtro da Strato 1 non avrebbe senso perché in quella fase non si ricevono ancora richieste in modo significativo.

---

## 2. Sistema vouching (garanti)

Il vouching è un meccanismo di "fast-track" per le nuove utenti: chi viene garantita da 2 utenti già attive può saltare i 7 giorni iniziali dello Strato 1.

**Come funziona durante la registrazione**:

1. Durante l'iscrizione, la nuova utente può inserire i nickname di 2 utenti già attive che la conoscono.
2. I 2 garanti ricevono una notifica push: "X vuole iscriversi e ti indica come garante — confermi che è una persona reale che conosci?".
3. Se entrambi confermano entro 48 ore → la nuova utente entra direttamente nello **Strato 2** (salta i 7 giorni iniziali).
4. Se uno dei due non conferma o passano 48 ore → la nuova utente entra normalmente nello Strato 1, e il processo procede senza fast-track.

**Chi può fare il garante**: solo utenti che hanno raggiunto lo **Strato 3** (vedi sezione 1).

**Responsabilità condivisa dei garanti**:
Il sistema funziona perché chi garantisce si assume una piccola responsabilità per chi entra. Le regole:

- Se la persona garantita viene poi bannata per un comportamento grave (es. risulta essere un uomo cis in malafede, vedi [`moderazione.md`](./moderazione.md)), anche i garanti subiscono conseguenze:
  - +1 "garanzia fallita" sul loro profilo
  - I privilegi di garantire vengono temporaneamente sospesi
- **3 garanzie fallite** = **perdita permanente del privilegio di garantire**.

**Perché è un buon sistema**:
- Disincentiva il vouching alla leggera (chi garantisce ha qualcosa da perdere).
- Replica il funzionamento delle community lesbiche reali (ci si conosce attraverso amiche di amiche).
- Permette di evitare il selfie video iniziale per chi ha già un radicamento nella community.

**Limiti e cautele**:
- Il sistema è **inutile all'inizio** (non ci sono ancora utenti in Strato 3 che possono garantire). Si attiva di fatto dopo i primi 30+ giorni dal lancio.
- Crea potenzialmente barriere per chi non conosce nessuno nella community (spesso le persone più isolate, che hanno più bisogno della community). Per questo il vouching è solo un'**alternativa opzionale**, non l'unico modo per entrare.

---

## 3. Note aperte sulle soglie

Le soglie numeriche attualmente fissate (7 giorni, 20 messaggi, 30 giorni, 100 messaggi, 48 ore di conferma vouching, 3 garanzie fallite) sono **provvisorie**. Vanno calibrate con dati reali dopo il lancio.

Esempi di scenari in cui vanno riviste:
- Se le utenti raggiungono 20 messaggi in mezza giornata → la soglia da 7gg + 20msg di fatto è solo "7gg". Va alzata la soglia messaggi o abbassata quella tempo.
- Se quasi nessuno arriva a 100 messaggi → lo Strato 3 diventa irraggiungibile, va abbassata.
- Se troppi vouching falliscono → forse la soglia di 3 garanzie fallite è troppo alta, o il sistema attira persone che garantiscono troppo facilmente.

**Quando rivedere**: dopo i primi 3 mesi di lancio, basandosi sulle statistiche reali della dashboard moderatori.

---

## Punti collegati al sistema di reputazione

Il **sistema di reputazione** è trattato in un file dedicato: vedi [`reputazione.md`](./reputazione.md).

Pilastri già decisi (sezioni 1-4 di `reputazione.md`):
- Reputazione come strumento di moderazione **invisibile**: non sblocca permessi, non è mai visibile agli utenti, non fa scattare azioni automatiche.
- È un sistema **parallelo** agli Strati di permessi, non sostitutivo. Gli Strati restano l'unico meccanismo che governa chi può fare cosa.
- Si attiva dal giorno 1 del lancio.
- Logica asimmetrica: la reputazione parte da 0 e può solo scendere. Warning = −1, mute temporaneo = −3. Solo eventi confermati di moderazione sulla persona stessa entrano nel sistema.

Restano da definire (sezioni 5-6 di `reputazione.md`): visibilità in dashboard, decadimento nel tempo, storicizzazione, soglie di calibrazione e processo di revisione.
