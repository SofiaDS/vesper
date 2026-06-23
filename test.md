# Test manuali — restyle UI Step 1–3

Da fare a mano nel browser (dev server), con le tue credenziali. **Ripeti ogni
sezione sia in tema scuro che in tema chiaro** (toggle ora dentro tab "Altro" →
sezione "Sessione").

Avvio dev server: `cd app && npm run dev` poi apri l'URL mostrato.

---

## Step 1 — Header oro centrato

- [ ] Il titolo della schermata è **centrato** orizzontalmente e in **colore oro**.
- [ ] Il titolo resta centrato anche con **nickname/nome schermata lunghi**
      (deve troncare con "…", non spingere fuori centro né andare a capo).
- [ ] Con la **freccia ‹ indietro** a sinistra il titolo resta centrato
      (i due lati sono ora bilanciati a 44px).
- [ ] Su una schermata **senza** freccia indietro (es. lobby Stanze, Profilo,
      Altro) il titolo è comunque centrato.

## Step 2 — Tab bar (Stanze / DM / Ricerca / Profilo / Altro)

- [ ] La tab bar è **fissa sotto l'header** su tutte le schermate post-login.
- [ ] La tab attiva ha testo **oro** e la **lineetta oro** sotto (underline).
- [ ] Toccando una tab si apre la sezione giusta e la tab diventa attiva.
- [ ] Se l'utente **non può usare i DM** (strato < 2) la tab "DM" **non compare**
      e le tab restano distribuite bene (4 invece di 5).
- [ ] Badge **rosso** su una tab con elementi non letti (es. DM) e badge **oro**
      sulla tab "Altro" quando ci sono pratiche di moderazione da gestire (solo staff).
- [ ] La tab bar è leggibile/usabile anche su **schermo stretto** (mobile).

## Step 3 — Hub "Altro" (sostituisce il burger menu ☰)

- [ ] **Il pulsante burger ☰ NON deve più comparire** in nessun header.
- [ ] La tab "Altro" apre una schermata a **card**: *Account & community*,
      *Moderazione (staff)* (solo se staff), *Supporto*, *Sessione*.
- [ ] **Account & community** → Impostazioni, Utenti bloccati, Chi siamo,
      Privacy Policy, Termini di servizio: ognuno apre la schermata giusta.
- [ ] **Moderazione (staff)** → "Apri pannello Admin" apre l'Admin (solo per
      utenti staff; con utente non-staff la card non deve comparire).
- [ ] **Supporto** → "Segnala un bug" e "Dacci un suggerimento" aprono l'email
      precompilata; "Sostieni Vesper ↗" apre il link in **nuova scheda**.
- [ ] **Sessione** → il toggle tema funziona (scuro ↔ chiaro).
- [ ] "Esci" apre un **dialog di conferma** ("Vuoi uscire?"); "Annulla" lo chiude
      senza disconnettere, "Esci" fa il logout. Il dialog si chiude anche con
      Esc / tap fuori, e il focus resta intrappolato dentro il dialog (tastiera).

## Navigazione e tasto "indietro" (importante)

- [ ] Da Altro → Impostazioni → **‹ indietro** torna ad **Altro** (non a Stanze).
- [ ] Da Altro → Utenti bloccati → indietro torna ad **Altro**.
- [ ] Da Altro → Chi siamo/Privacy/Termini → indietro torna ad **Altro**.
- [ ] Da Altro → Admin → indietro torna ad **Altro**.
- [ ] Da **Impostazioni → Utenti bloccati / Privacy** → indietro torna a
      **Impostazioni** (non ad Altro), e un ulteriore indietro torna ad Altro.
- [ ] Toccando un'altra tab principale (Stanze/DM/Ricerca/Profilo) mentre sei
      dentro una sotto-schermata di Altro, si esce correttamente dall'hub.
- [ ] Il **tasto indietro del browser/telefono** segue la stessa logica e non
      lascia schermate "appese" l'una sotto l'altra.

## Regressioni da controllare (la rimozione del burger non deve rompere nulla)

- [ ] Chat / stanze, DM, Profilo, Ricerca, Profilo pubblico: header e
      navigazione funzionano come prima.
- [ ] "Esci" e toggle tema (prima nel burger) restano raggiungibili **solo**
      dall'hub Altro e funzionano.
- [ ] Nessuna schermata mostra header sbilanciato o spazio vuoto dove c'era il ☰.

---

## Step 11 — Toast notifiche in-app (nuovi messaggi / menzioni / DM)

Serve **due account** (A e B). Fai login con A su un dispositivo/finestra e con
B su un'altra (o usa una finestra in incognito).

- [ ] Mentre A è su una schermata **diversa** dalla chat di una stanza X (es.
      lista Stanze, Profilo, Ricerca), B scrive in X → ad A compare un **toast**
      in basso "Nuovo messaggio da @B" con nome stanza e anteprima.
- [ ] **Menzione**: B scrive "@A ciao" in X → il toast di A dice "@A **ti ha
      menzionata**" (icona @).
- [ ] **DM**: B invia un messaggio privato ad A mentre A **non** è nella sezione
      Messaggi → toast "Nuovo messaggio da @B · In privato".
- [ ] **Click sul toast** apre la conversazione giusta (la stanza, o la sezione
      Messaggi).
- [ ] Il toast **scompare da solo** dopo qualche secondo, e la **✕** lo chiude
      subito.
- [ ] **Niente toast quando lo stai già guardando**: se A è dentro la stanza X,
      i messaggi di X **non** generano toast; se A è nella sezione Messaggi, i
      DM non generano toast.
- [ ] **Niente toast dai propri messaggi** né da utenti **bloccate**.
- [ ] Il toast è leggibile e non rotto in **dark e light** (testo non tagliato,
      ✕ sempre visibile anche con nick/stanza lunghi).
- [ ] Con "**riduci animazioni**" di sistema attivo il toast appare senza
      scivolare (resta comunque visibile e centrato).

### ⚠️ Verifica privacy/RLS sul realtime (importante)

È solo un test di **comportamento**: conferma che Supabase Realtime filtri i
`postgres_changes` per RLS, cioè che A **non** riceva i messaggi di stanze di
cui non fa parte. È l'unica cosa che impedisce al toast di mostrare messaggi che
A non dovrebbe vedere. Serve una stanza **tematica** (non la foyer: lì sono
iscritte tutte). I badge non letti (Step 4/5) NON c'entrano: sono calcolati
lato server con `auth.uid()`, sicuri a prescindere.

- [ ] **Setup:** A **non** è iscritta a una tematica X (se lo è, "Lascia
      stanza"); B è dentro X. A resta su una schermata **non-chat** (lista
      Stanze o Profilo).
- [ ] B scrive in X → ad A **non** deve comparire **nessun toast**.
      - ✅ Nessun toast = la RLS filtra il realtime, **tutto ok**.
      - ❌ Compare un toast per X (stanza non di A) = la RLS **non** filtra:
        avvisami, restringo la sottoscrizione alle sole stanze dell'utente.
- [ ] **Controprova positiva:** sempre con A su schermata non-chat, B scrive
      nella **foyer** → ad A il toast **deve** comparire (A è membro). Così sai
      che il "niente toast" sopra era il filtro RLS e non un bug generico.
- [ ] **(Opzionale, sicurezza 100%)** Sul browser di A: DevTools → **Network**
      → filtro **WS** → connessione Realtime → tab **Messages**. Mentre B scrive
      in X, **non** deve arrivare nessun frame col `chatroom_id`/corpo di quel
      messaggio. Se arriva, la RLS non filtra.

---

## Step 4 — Badge non letti / menzione nelle Stanze

> Richiede la migration `read_markers` applicata (vedi
> `supabase_step4_5_istruzioni.md`). Senza, semplicemente non compaiono badge.
> Serve un secondo account (B). Ricorda: il rollout segna tutto "già letto",
> quindi i badge compaiono solo per messaggi **nuovi**.

- [ ] B scrive in una stanza X dove sei iscritta; **senza** aprirla, vai alla
      lista Stanze → la card di X mostra **contatore** (pallino oro col numero)
      e il nome stanza in **oro**; la card ha sfondo/bordo oro tenue.
- [ ] Apri X e torna indietro → il badge **sparisce** (l'hai letta).
- [ ] B ti **menziona** ("@tuonick ...") in X → la card mostra anche il
      **pill menzione** (`@`) e ha il **bordo oro pieno** (ring).
- [ ] Mentre sei sulla lista Stanze, un nuovo messaggio di B fa **comparire/
      aggiornare** il badge in tempo reale (entro ~1s).
- [ ] I **tuoi** messaggi non aumentano il contatore.
- [ ] Verifica in **dark e light** (numero leggibile dentro il pill oro).

## Step 5 — Conversazioni DM non lette

> Stesse premesse dello Step 4.

- [ ] B ti invia un DM (conversazione già accettata) mentre **non** sei dentro
      quella conversazione → nella lista Messaggi la riga mostra **pallino ●**,
      nome in grassetto e **contatore** non letti a destra.
- [ ] Apri la conversazione e torna alla lista → gli indicatori **spariscono**.
- [ ] I **tuoi** messaggi non contano come non letti.
- [ ] Verifica in **dark e light**.

## Step 5 (presenza) — pallino "online" nei DM

> Richiede la migration `user_presence` applicata (vedi
> `supabase_step4_5_istruzioni.md`, sezione Presenza online). Serve B con
> "mostra online" **attivo** nelle impostazioni.

- [ ] Con B che ha l'app aperta in **primo piano**, nella lista Messaggi di A
      l'avatar di B mostra un **pallino verde** in basso a destra (può metterci
      fino a ~1 min ad apparire al primo heartbeat).
- [ ] Anche nell'**header della conversazione** con B compare "● online".
- [ ] B **minimizza/chiude** la scheda → dopo ~2-3 min il pallino **sparisce**
      (offline).
- [ ] B disattiva **"mostra online"** nelle impostazioni → A **non** lo vede più
      online (anche se B è attivo).
- [ ] Il pallino verde si distingue bene sull'avatar oro, in **dark e light**;
      il testo "online" è leggibile (contrasto).

---

## Proof icone (Phosphor + Fluent Emoji)

- [ ] **Tab bar** → ogni voce ha un'icona Phosphor (duotone) sopra l'etichetta;
      l'icona della tab attiva diventa oro, le altre restano attenuate.
- [ ] Il **badge** (DM / Altro) compare come pallino in alto a destra sull'icona.
- [ ] **Toggle tema** (Altro → Sessione) usa le icone Sole/Luna Phosphor al posto
      delle emoji; cambia da Sole a Luna passando scuro↔chiaro.
- [ ] **Utenti bloccati vuoto** → mostra l'emoji scudo (Fluent Emoji, da CDN)
      sopra "Non hai bloccato nessuno" (serve connessione per vederla).
- [ ] **Caricamento Utenti bloccati** → spinner Phosphor **SpinnerBall** che gira
      (con scia oro). Con "riduci animazioni" di sistema attivo **non deve girare**
      (resta fermo, il testo "Carico…" resta visibile).
- [ ] Verifica icone/spinner in **dark e light**.

---

> Nota: la verifica del codice è già stata fatta in statica (allineamento ai
> mockup + `tsc -b` pulito). Questi test coprono ciò che richiede un render reale.
