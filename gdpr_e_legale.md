# GDPR e aspetti legali

Tutti gli aspetti legali e di compliance del progetto: GDPR, TOS, conservazione dati, dichiarazioni store, consulenza legale.

Ultimo aggiornamento: 16 maggio 2026

---

## Indice

1. Quadro generale GDPR
2. Conservazione dei dati (retention)
3. Termini di Servizio (TOS) — clausole essenziali
4. Trasferimenti dati extra-UE
5. Procedure di moderazione documentate
6. DPO (Data Protection Officer)
7. Consulenza legale specializzata
8. Dichiarazioni richieste dagli store

Vedi anche:
- [`utenti_e_identita.md`](./utenti_e_identita.md) per la dichiarazione di appartenenza
- [`minori_e_eta.md`](./minori_e_eta.md) per la tutela minori
- [`stack_tecnico.md`](./stack_tecnico.md) per la scelta dei server in EU

---

## 1. Quadro generale GDPR

L'app tratta dati personali di utenti europei, inclusi **dati di categoria particolare** (art. 9 GDPR). Va trattata con attenzione fin dal design.

### Dati biometrici (video facciali)

- Il selfie video di verifica è un **dato biometrico** = **categoria particolare** ex art. 9 GDPR.
- Richiede **base giuridica esplicita**: consenso informato e libero al momento dell'iscrizione.
- Richiede **informativa privacy specifica** che dichiari:
  - Finalità del trattamento (verifica liveness, no riconoscimento facciale)
  - Tempo di conservazione (vedi sezione 2)
  - Diritti dell'interessato (accesso, rettifica, cancellazione, portabilità)
  - Eventuali trasferimenti a terzi
- Va inserito nel **registro dei trattamenti** ex art. 30 GDPR.

### Dati sensibili dell'identità

- Identità di genere e orientamento sessuale dichiarati = **categoria particolare** (art. 9, orientamento sessuale).
- Richiedono trattamento ad alta protezione e accessi minimizzati.

### Dati comuni

- Email, nickname, città, bio, interessi, messaggi = dati personali "ordinari".
- Vanno trattati comunque secondo i principi GDPR (minimizzazione, finalità, esattezza, conservazione limitata, sicurezza).

---

## 2. Conservazione dei dati (retention)

### Video di verifica liveness

- **Scelta**: cancellazione automatica dopo **30 giorni** dal momento della verifica.
- **Motivazione**: GDPR — retention va minimizzata per dati biometrici. 30 giorni è sufficiente per gestire eventuali appelli.
- **Implementazione tecnica**: Edge Function schedulata su Supabase. Vedi [`stack_tecnico.md`](./stack_tecnico.md).

### Documento d'identità (per verifica età)

- Caricamento una tantum solo in caso di segnalazione "sospetto minorenne".
- **Cancellazione immediata** dopo verifica (entro 24 ore).
- Non viene mai conservato per altri scopi.

### Messaggi in chatroom e DM

- Conservati per la durata della vita dell'account.
- Alla cancellazione dell'account → cancellazione o anonimizzazione dei messaggi.
- Da definire con consulente legale: se anonimizzare (rimuovere collegamento all'utente ma lasciare il testo) o cancellare completamente i messaggi.

### Dati di account bannato

- In caso di ban: conservazione minima per il tempo legalmente richiesto, poi anonimizzazione.
- **Eccezione**: ban per minore età → conservazione dati identificativi per tempi specifici (da definire con consulente).

### Log moderazione e segnalazioni

- Conservati per il tempo necessario alla gestione dei casi e di eventuali appelli (es. 12 mesi).
- Anonimizzati dopo questo periodo.

---

## 3. Termini di Servizio (TOS) — clausole essenziali

I TOS devono contenere almeno le seguenti clausole:

### Chi può iscriversi

Riprende la dichiarazione di appartenenza (vedi [`utenti_e_identita.md`](./utenti_e_identita.md) sezione 3):

> *"L'iscrizione a [Nome app] è riservata a persone che si riconoscono in una delle seguenti categorie: donne lesbiche/bisessuali/queer, donne trans, uomini trans, persone non-binary AFAB. Al momento dell'iscrizione, l'utente dichiara sotto la propria responsabilità di rientrare in tale platea. Una dichiarazione mendace costituisce violazione dei presenti Termini e comporta il ban immediato e definitivo dall'app."*

### Età minima

Sezione esplicita sull'età minima 18+ e le conseguenze della dichiarazione mendace. Vedi [`minori_e_eta.md`](./minori_e_eta.md).

### Regole della community

- Comportamenti vietati (hate speech, molestie, doxxing, ecc.)
- Procedura di segnalazione
- Procedure di moderazione e ban
- Possibilità e modalità di appello

### Trattamento dati e diritti dell'utente

- Riferimento all'informativa privacy
- Diritti GDPR esercitabili e come
- Punto di contatto per richieste

### Comportamento dell'utente

- Veridicità dei dati forniti
- Rispetto delle regole della community
- Conseguenze in caso di violazione

---

## 4. Trasferimenti dati extra-UE

Tutti i dati vengono mantenuti su server europei dove possibile. Vedi [`stack_tecnico.md`](./stack_tecnico.md) per i dettagli infrastrutturali.

### Eccezioni note

- **OpenAI Moderation API**: il testo dei messaggi viene trasmesso negli USA per moderazione. **Va dichiarato nell'informativa privacy**. Da valutare nel tempo alternative europee (es. Mistral AI).
- **Web Push (VAPID)** (notifiche push): NB — implementazione attuale NON usa OneSignal. Le push sono recapitate dai servizi push di browser/OS (Google FCM, Apple, Mozilla); viene trasmesso solo un identificativo tecnico (endpoint subscription), non il contenuto del profilo. Da dichiarare nell'informativa.

### Per ogni servizio extra-UE

- Firmare il **DPA** (Data Processing Agreement) con il fornitore.
- Includere le **SCC** (Standard Contractual Clauses) post-Schrems II.
- Dichiarare nell'informativa privacy.

---

## 5. Procedure di moderazione documentate

La piattaforma deve avere procedure di moderazione **documentate e applicate in modo coerente**, per dimostrare diligenza in caso di contestazioni.

### Documenti interni da preparare

- **Linee guida per i moderatori**: cosa segnalare, come gestire ogni categoria, principi etici (incluso il principio anti-bias di [`appelli.md`](./appelli.md)).
- **Procedura escalation**: quando un caso passa dai volontari ai fondatori.
- **Procedura sospetto minorenne**: passi specifici (vedi [`minori_e_eta.md`](./minori_e_eta.md)).
- **Procedura segnalazioni cis man**: gestione cauta (vedi [`moderazione.md`](./moderazione.md)).

---

## 6. DPO (Data Protection Officer)

- **Quando è necessario**: dipende dal volume di dati trattati. La legge richiede un DPO quando:
  - Si effettua "monitoraggio regolare e sistematico su larga scala", oppure
  - Si trattano dati di categoria particolare su larga scala.
- **Probabilmente necessario** quando l'app supererà alcune migliaia di utenti attivi, vista la natura dei dati (biometrici, orientamento, identità).
- **Da valutare con consulente legale** prima del lancio: è meglio nominarne uno fin da subito o aspettare?

---

## 7. Consulenza legale specializzata

**Da prevedere prima del lancio**: consulenza specializzata in app social + GDPR + diritto LGBTQ+ se possibile.

**Budget stimato iniziale**: €500-1500 per la preparazione di:
- Informativa privacy
- Termini di Servizio
- Registro dei trattamenti
- Procedure documentate
- Eventuale DPA con i fornitori

**Da chiedere specificamente al consulente**:
- Conferma della formulazione esatta della dichiarazione di appartenenza (vedi [`utenti_e_identita.md`](./utenti_e_identita.md)) e della checkbox età (vedi [`minori_e_eta.md`](./minori_e_eta.md)).
- Tempi precisi di conservazione dei dati per casi di ban per minore età.
- Protocollo di segnalazione alle autorità in caso di rischi gravi per minori.
- Validazione della scelta backend (Supabase EU vs alternative).
- Necessità di DPO.

---

## 8. Dichiarazioni richieste dagli store

Apple App Store e Google Play Store richiedono dichiarazioni specifiche al momento della submission, in particolare per app social:

### Apple App Store

- **Privacy Nutrition Labels**: dichiarazione dettagliata di tutti i dati raccolti, finalità, e collegamento all'utente.
- **App Tracking Transparency** (ATT): se si fa tracking cross-app (per ora non previsto).
- **Sign in with Apple**: obbligatorio se si offrono altri metodi di social login (per ora non previsto, solo email).
- **Content moderation policy**: per app con UGC, dichiarazione esplicita delle politiche di moderazione (link a TOS).
- **Age rating**: probabilmente 17+ vista la natura dell'app.
- **Tutela minori**: dichiarazione esplicita che l'app è per maggiorenni.

### Google Play Store

- **Data safety form**: simile alle nutrition labels Apple.
- **Politiche su contenuti sensibili**: dichiarazione di moderazione.
- **Age rating**: tramite questionario IARC.
- **Politiche LGBTQ+**: Google Play in alcuni paesi ha policy restrittive — verificare prima del lancio in mercati internazionali.

---

## Riepilogo "cose da fare" prima del lancio

- [ ] Informativa privacy completa, con sezione dedicata ai dati biometrici
- [ ] Termini di Servizio con tutte le clausole essenziali (sezione 3)
- [ ] Registro dei trattamenti ex art. 30 GDPR
- [ ] DPA firmati con tutti i fornitori (Supabase, OneSignal, OpenAI)
- [ ] SCC per trasferimenti extra-UE
- [ ] Linee guida moderatori scritte
- [ ] Valutazione necessità DPO
- [ ] Consulenza legale specializzata
- [ ] Privacy Nutrition Labels (Apple) e Data Safety form (Google)
- [ ] Age rating sugli store
