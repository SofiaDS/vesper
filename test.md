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
- [ ] **Sessione** → il toggle tema funziona (scuro ↔ chiaro) e "Esci" fa il
      logout dall'app.

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

> Nota: la verifica del codice è già stata fatta in statica (allineamento ai
> mockup + `tsc -b` pulito). Questi test coprono ciò che richiede un render reale.
