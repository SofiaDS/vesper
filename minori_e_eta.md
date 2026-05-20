# Età minima e tutela minori

Tutte le decisioni su età minima per l'iscrizione e procedure per la gestione di sospetti minorenni.

Ultimo aggiornamento: 16 maggio 2026

---

## Indice

1. Età minima — scelta e motivazione
2. Implementazione in fase di iscrizione
3. Implementazione in fase di moderazione
4. Realismo legale — cosa la checkbox NON garantisce
5. I 5 elementi di "diligenza" per posizione legale solida
6. Da approfondire con consulente legale

Vedi anche:
- [`utenti_e_identita.md`](./utenti_e_identita.md) per il flusso completo di iscrizione
- [`moderazione.md`](./moderazione.md) per la categoria segnalazione "sospetto minorenne"
- [`gdpr_e_legale.md`](./gdpr_e_legale.md) per la cornice legale completa

---

## 1. Età minima — scelta e motivazione

- **Scelta**: età minima **18 anni obbligatori**, con doppia barriera (tecnica + dichiarativa).

### Motivazione

- **Tutela legale del progetto**: con minori in un'app con DM privati e tema relazioni/dating, le responsabilità sono enormi.
- **Coerenza con la natura dell'app**: si parla anche di relazioni, dating, sessualità — non spazio per minorenni.
- **GDPR**: <18 in Italia richiede consenso genitoriale documentato, logisticamente impraticabile.

---

## 2. Implementazione in fase di iscrizione

### Doppia barriera

1. **Campo data di nascita obbligatorio**: datepicker che **tecnicamente non permette** di selezionare una data che dia un'età <18 (limite hardcoded nell'app). Non è un rifiuto dopo, è un blocco prima.

2. **Checkbox dedicata** (separata dalle altre, evidenziata):
   > ☐ *Dichiaro di avere almeno 18 anni compiuti. Comprendo che dichiarare il falso sull'età comporta il ban immediato e definitivo dall'app, e che potrebbero esserci conseguenze legali. Sollevo [Nome app] da ogni responsabilità derivante da false dichiarazioni rese al momento dell'iscrizione.*

3. **TOS rinforzati**: sezione "Età minima" esplicita nei Termini di Servizio. Vedi [`gdpr_e_legale.md`](./gdpr_e_legale.md).

---

## 3. Implementazione in fase di moderazione

### Categoria di segnalazione dedicata

**Nuova categoria segnalazione "sospetto minorenne"** aggiunta alle categorie GRAVI (vedi [`moderazione.md`](./moderazione.md)):
- Revisione esclusiva fondatori
- Coda prioritaria
- Gestione molto cauta

### Procedura interna in caso di segnalazione "sospetto minorenne"

1. I fondatori valutano il profilo segnalato.
2. Se il sospetto è fondato → DM all'utente chiedendo conferma dell'età via **caricamento documento d'identità** (uso una tantum, solo per questa verifica).
3. Se la persona conferma >18 con documento valido → caso chiuso, documento **cancellato immediatamente** dopo verifica.
4. Se la persona non risponde entro X giorni (da definire, es. 7) → **ban precauzionale**.
5. Se la persona ammette di essere minorenne → **ban immediato**, conservazione dati minima per tempi di legge, eventuale segnalazione alle autorità competenti se elementi di rischio.

---

## 4. Realismo legale — cosa la checkbox NON garantisce

**Importante saperlo**: la dichiarazione mendace dell'utente è una **forte attenuante** e dà base solida per il ban, ma **NON esonera totalmente** il gestore della piattaforma da obblighi di diligenza.

- In Italia/UE chi gestisce piattaforma con UGC ha obblighi di **"diligenza nell'impedire e rimuovere"** contenuti/utenti problematici.
- Se si sa (o si sarebbe dovuto sapere) che un utente è minorenne e non si agisce, si è comunque responsabili.

Questo significa: la checkbox è necessaria ma non sufficiente. Va accompagnata dai 5 elementi della sezione 5.

---

## 5. I 5 elementi di "diligenza" che rendono la posizione legale davvero solida

1. ✅ **Categoria segnalazione "sospetto minorenne"** nella dashboard (deciso, vedi [`moderazione.md`](./moderazione.md))
2. ✅ **Procedura definita** per gestione segnalazioni di questo tipo (deciso, vedi sezione 3 sopra)
3. **Conservazione delle prove** (data nascita dichiarata, motivo ban) per il tempo legalmente richiesto, poi anonimizzazione
4. **TOS chiari sull'età minima e le conseguenze**
5. **Procedura di comunicazione alle autorità competenti** in casi gravi (es. minore vittima di adescamento)

---

## 6. Da approfondire con consulente legale prima del lancio

- Tempi precisi di conservazione dei dati per casi di ban per minore età.
- Protocollo di segnalazione alle autorità in caso di rischi gravi per minori.
- Dichiarazioni richieste da Apple/Google App Store sulla tutela minori.
