# Chatroom

Struttura delle chat dell'app: chat principale ("Foyer"), chat tematiche, appartenenza multipla, principi di gestione del traffico.

Ultimo aggiornamento: 1 giugno 2026

---

## Indice

1. Impostazione iniziale (1 principale "Foyer" + 2 tematiche)
2. Scelta finale chat tematiche (in ballottaggio)
3. Espansione e principio di potatura
4. Appartenenza multipla e limite di chat
5. Pagina "Le mie chat" (gestione iscrizioni)

Vedi anche:
- [`permessi_e_strati.md`](./permessi_e_strati.md) per chi può scrivere/leggere ogni chat
- [`moderazione.md`](./moderazione.md) per moderazione e segnalazioni in chat

---

## 1. Impostazione iniziale

- **Scelta**: 1 chat principale + 2 chat tematiche (totale 3 chat al lancio).
- **Motivazione**: in fase di lancio con ~30 utenti iniziali, concentrare il traffico in poche chat evita il "ghost town problem" (chat vuote che scoraggiano la permanenza). Meglio 2 chat vivissime che 5 a metà morte.

### Ruolo della chat principale — "Foyer"

La chat principale si chiama **Foyer** (sostituisce il nome di lavoro "Saluti & random"). È la **piazza comune** della community: tutte le utenti ne fanno parte per definizione ed è **obbligatoria** (non lasciabile — vedi sezione 4). Posto dove:
- Ci si presenta entrando nella community.
- Si fanno conversazioni leggere.
- Va tutto ciò che non rientra altrove.

Le conversazioni a tema vanno nelle chat dedicate.

---

## 2. Scelta finale chat tematiche — DA DECIDERE

Restano in ballottaggio due configurazioni. **Decisione rimandata**, eventualmente sentendo qualche persona del target prima di scegliere.

### Opzione 1 — "Intima + ampia"

1. **Foyer** (principale: saluti, random, cultura, vita quotidiana — tutto il leggero)
2. **Relazioni & affetti** (single, dating, fidanzate, ex, amore)
3. **Cultura & consigli queer** (libri, serie, film, musica, eventi, articoli)

**Vantaggio**: la chat cultura crea forte senso di appartenenza condivisa fin dal giorno 1 ("anche tu hai amato quel libro!"). Facile da animare nei primi giorni (i fondatori postano "che state leggendo/guardando"). Vita quotidiana resta naturalmente nel Foyer.

### Opzione 2 — "Intima + pratica"

1. **Foyer** (principale: saluti, random, cultura, attualità)
2. **Relazioni & affetti** (single, dating, fidanzate, ex, amore)
3. **Vita & dintorni** (lavoro, casa, viaggi, consigli pratici, sfoghi quotidiani)

**Vantaggio**: spazio dedicato per consigli concreti tipo "come trovare casa a Milano da queer". Più orientata all'utilità. Cultura/serie si mischia nel Foyer.

### Comune a entrambe

La chat **"Relazioni & affetti"** è presente in ogni caso, perché beneficia molto di uno spazio dedicato (intimità non si confonde con i saluti).

---

## 3. Espansione e principio di potatura

### Espansione futura

Nuove chat tematiche specifiche verranno aggiunte quando la community crescerà e mostrerà bisogni chiari.

Esempi di chat che potrebbero nascere col tempo (ma NON al lancio):
- Coming out / questioning
- Attivismo & politica LGBTQ+
- Maternità & genitorialità queer
- Salute mentale & supporto
- Eventi Pride / appuntamenti community
- Chat regionali (Milano, Roma, Napoli...) quando si supereranno ~500-1000 utenti attive

### Principio di potatura

Le chat tematiche **non sono per sempre**. Ogni 3-6 mesi rivedere:
- Una chat morta da 2 mesi si chiude o si ridefinisce.
- Obiettivo a regime: 5-8 chat *vivissime*, non 15 a metà vuote.

### Punti aperti sulla struttura

- **Segmentazione per città/regione**: rimandata, valutare quando si superano ~500-1000 utenti attive.
- **Limite di utenti contemporanei prima di sdoppiare la room**: da definire più avanti con dati reali.

---

## 4. Appartenenza multipla e limite di chat

**Decisione (1 giugno 2026)**: un'utente può far parte di **più chat contemporaneamente**, con un tetto massimo.

### Regola

- **Foyer (principale): sempre inclusa e obbligatoria.** Non è lasciabile — è la piazza comune in cui tutte sono presenti per definizione.
- **Chat tematiche (minori): opt-in, fino a un massimo di 3 contemporanee.**
- **Tetto totale: 4 chat** (1 Foyer + max 3 tematiche).

Il numero 3 è **provvisorio**, da calibrare con dati reali dopo il lancio (coerente con le altre soglie del progetto — vedi [`permessi_e_strati.md`](./permessi_e_strati.md) sezione 3 e [`punti_aperti.md`](./punti_aperti.md)).

### Perché un tetto

- **Anti-frammentazione**: è il "ghost town problem" di sezione 1 ribaltato. Se ognuna si iscrive a tutto, il traffico si diluisce e ogni singola chat si svuota. Un tetto spinge a scegliere gli spazi che contano davvero, mantenendo le chat vive.
- **Tecnico/costi**: meno canali realtime sottoscritti per utente = meno carico e meno consumo. Coerente con il principio di cost-consciousness (vedi [`stack_tecnico.md`](./stack_tecnico.md)).

### Al lancio non cambia nulla

Al lancio le chat totali sono 3 (Foyer + 2 tematiche), tutte sotto il tetto di 4. Il limite "morde" solo in fase di **espansione**, quando le chat tematiche supereranno le 3 (vedi principio di potatura, sezione 3). La feature va però **modellata fin da subito** — l'appartenenza è un concetto di prima classe nel modello dati — per non dover rifare l'architettura dopo. Dettagli implementativi in [`stack_tecnico.md`](./stack_tecnico.md).

### Aumento del limite — possibile feature a pagamento

Alzare il numero di chat tematiche accessibili oltre 3 è un **candidato come feature a pagamento** (comodità personale). È però un caso più delicato delle altre comodità, perché sfiora il principio "mai gerarchie di interazione sociale". L'analisi completa e il caveat sono in [`monetizzazione.md`](./monetizzazione.md) sezione 4.

---

## 5. Pagina "Le mie chat" — gestione iscrizioni

Punto di accesso unico per entrare/uscire dalle chat. La pagina mostra **due elenchi distinti**.

### Elenco A — Chat di cui faccio parte

Per ogni chat:
- **Nome** della chat (es. "Foyer", "Relazioni & affetti").
- **Numero di utenti dentro** (eventuale anteprima avatar).
- Tasto **"Esci"** — **disabilitato per il Foyer** (obbligatorio), attivo per le tematiche.

### Elenco B — Chat di cui non faccio parte

Per ogni chat:
- **Nome** della chat.
- **Numero di utenti dentro**.
- Tasto **"Unisciti"** ("Join").

### Comportamento al limite

- Se l'utente è già a 4 chat (Foyer + 3 tematiche) e prova a unirsi a una quinta, il sistema spiega che ha raggiunto il limite e la invita a **uscire da una tematica prima di entrare in un'altra** (oppure, se attiva, ad aumentare il limite — vedi [`monetizzazione.md`](./monetizzazione.md)).
- L'uscita da una chat è **immediata e reversibile** (si può rientrare in qualsiasi momento).
- Uscire da una chat **non cancella** i messaggi già scritti lì: restano nello storico della chat, visibili alle altre.

### Note di coerenza

- **Permessi**: entrare/uscire dalle chat tematiche è disponibile fin dallo **Strato 1** (leggere e scrivere in chatroom è già un permesso base — vedi [`permessi_e_strati.md`](./permessi_e_strati.md) sezione 1). L'appartenenza alle chat è **indipendente** dagli Strati.
- **Block**: il conteggio e l'eventuale anteprima utenti vanno filtrati lato server sulla block list di ciascuna utente, coerentemente con l'invisibilità reciproca (vedi [`block.md`](./block.md) sezione 6).
- **Privacy**: nessuna notifica push del tipo "X è entrata/uscita dalla chat". Le entrate/uscite sono silenziose.
