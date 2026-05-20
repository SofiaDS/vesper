# Utenti e identità

Decisioni su come gli utenti si iscrivono, dichiarano la propria identità, e vengono verificati.

Ultimo aggiornamento: 16 maggio 2026

---

## Indice

1. Approccio generale alla verifica
2. Flusso completo di iscrizione e verifica
3. Dichiarazione di appartenenza alla community (gate iniziale)
4. Opzioni scartate sulla verifica iniziale
5. Principi etici della verifica
6. Conservazione del video di verifica

Vedi anche:
- [`permessi_e_strati.md`](./permessi_e_strati.md) per cosa succede dopo la verifica
- [`appelli.md`](./appelli.md) per la procedura in caso di rifiuto
- [`minori_e_eta.md`](./minori_e_eta.md) per la verifica dell'età 18+
- [`gdpr_e_legale.md`](./gdpr_e_legale.md) per gli aspetti legali

---

## 1. Verifica identità — approccio generale

- **Opzioni considerate**: servizi automatici (Sumsub, Veriff, Onfido ~€1.35-5 per verifica), gestione manuale, ibrido.
- **Scelta**: gestione manuale interna, almeno per MVP e fase di crescita iniziale.
- **Motivazione**: costo marginale zero, maggior sensibilità contestuale (specie per donne trans, dove i servizi automatici sbagliano), nessuna dipendenza da terze parti, coerenza con la mission.
- **Da rivedere**: quando si supera una certa soglia di registrazioni/giorno (~100-200), valutare layer AI economico (es. AWS Rekognition per pre-filtro liveness) e poi eventualmente servizio automatico oltre le 500/giorno.
- **Nota fondamentale**: il video verifica serve SOLO per verificare che la persona che chiede di iscriversi sia reale. **Non si verifica genere/aspetto dal video**.

---

## 2. Verifica identità — flusso completo

- **Scelta**: combinazione di permessi progressivi + vouching, con verifica iniziale leggera.

**Flusso completo passo-passo**:

1. **Schermata di benvenuto + dichiarazione di appartenenza** (vedi sezione 3 sotto).
2. **Registrazione**: email + nickname + scelta categoria identità + orientamento.
3. **Per FTM e non-binary AFAB**: disclaimer di consapevolezza ("questo spazio nasce dall'esperienza lesbica/queer femminile…") con spunta di accettazione. Niente domande invasive.
4. **Selfie video liveness silenzioso di 3 secondi** (gira la testa). Niente parlare. Stesso flusso per tutte le identità.
5. **Revisione manuale del video** da parte dei fondatori: il moderatore verifica solo che sia una persona reale e viva, NON giudica l'aspetto.
6. **Possibilità opzionale di inserire 2 garanti (vouching)** per fast-track e saltare i 7 giorni iniziali. Vedi [`permessi_e_strati.md`](./permessi_e_strati.md).

**Note aperte**:
- Soglie numeriche del sistema permessi (vedi [`permessi_e_strati.md`](./permessi_e_strati.md)) sono provvisorie, da calibrare con dati reali.
- Sistema "buddy" di accoglienza per nuove utenti: idea valida ma rimandata a v1.1 o v2.

---

## 3. Dichiarazione di appartenenza alla community (gate iniziale)

- **Scelta**: prima ancora dei dati di registrazione, l'utente vede una schermata con dichiarazione esplicita e checkbox obbligatoria.

**Testo da mostrare**:
> *"[Nome app] è uno spazio dedicato alla community lesbica, bisessuale e queer femminile.*
>
> *Sono benvenute donne cis, donne trans, uomini trans e persone non-binary AFAB.*
>
> *L'iscrizione **non è aperta a uomini cis**, per preservare la natura di questo spazio."*
>
> ☐ *Dichiaro sotto la mia responsabilità di riconoscermi tra le categorie ammesse e di non essere un uomo cis. Comprendo che una dichiarazione mendace comporterà il ban definitivo dall'app.*

**Funzionamento**:
- Senza spunta, il pulsante "continua" è disabilitato.
- Con spunta, si procede alla scelta categoria specifica + resto della registrazione.

**Scelta categoria specifica** (dopo la spunta):
- Donna cis
- Donna trans (MTF)
- Uomo trans (FTM)
- Persona non-binary AFAB
- Preferisco non specificare (gestione caso per caso fondatori)

**Privacy**: la categoria specifica serve internamente (attivazione disclaimer FTM/NB, statistiche). Sul profilo pubblico, l'utente decide cosa mostrare separatamente (vedi [`profilo_utente.md`](./profilo_utente.md)).

**Nota su marketing/landing pubblica**: nella comunicazione esterna (sito, store) non serve essere altrettanto espliciti sull'esclusione. Lì basta "spazio per la community lesbica/queer femminile". L'esclusione esplicita ha senso nel momento dell'iscrizione, dove l'utente prende un impegno formale.

**Vantaggio legale**: dichiarazione esplicita + accettazione TOS = base solida e inattaccabile per ban di chi mente. Vedi [`gdpr_e_legale.md`](./gdpr_e_legale.md).

**Da fare**: i Termini di Servizio devono riprendere la clausola "Chi può iscriversi" in modo esplicito.

---

## 4. Opzioni scartate sulla verifica iniziale

- **Filtro nascosto "uomo cis"** (categoria mostrata come ammessa nella UI ma rifiutata internamente, con blacklist email): SCARTATA.
- **Motivazioni dello scarto**:
  - Problema GDPR: principio di trasparenza (art. 5, 13) violato — raccolta di dati biometrici (video facciali, art. 9) da persone che si sa già verranno rifiutate.
  - Inefficace contro malintenzionati: chi vuole infiltrarsi non sceglie mai "uomo cis", quindi il filtro nascosto non lo ferma. Sceglie sempre una categoria ammessa.
  - Penalizza gli onesti: una persona in buona fede (alleato, ricercatore, giornalista) che dichiara onestamente "uomo cis" verrebbe processata fino al selfie e poi rifiutata senza preavviso.
  - Blacklist email facilmente bypassabile (alias Gmail con "+", email usa-e-getta tipo Mailinator).
- **Scelta finale**: trasparenza esplicita con dichiarazione di appartenenza (sezione 3).

---

## 5. Principi etici della verifica

- **Niente domande su corpo, ormoni, chirurgia, deadname**.
- **Nessuna gerarchia visiva** tra categorie verificate (no badge "verified cis" vs "verified trans", se badge esiste è uguale per tutti).
- **Pagina pubblica trasparente** che spiega come funziona la verifica e perché.
- **Team di moderazione formato e sensibile**, idealmente con almeno una persona trans o non-binary AFAB nel team.
- **Principio operativo per i moderatori** (da scrivere nelle linee guida interne):
  > *"Se un fondatore si trova a pensare 'mmm, non sembra abbastanza X' guardando un video, deve fermarsi e approvare. Quel pensiero non è materia di decisione. È un bias da escludere consapevolmente."*

---

## 6. Conservazione del video di verifica

- **Scelta**: cancellazione automatica dopo 30 giorni dal momento della verifica.
- **Motivazione**: GDPR — i video facciali sono dati biometrici (art. 9 categoria particolare), retention va minimizzata.
- **Da fare**: informativa privacy specifica + base giuridica esplicita (consenso) + registro dei trattamenti. Vedi [`gdpr_e_legale.md`](./gdpr_e_legale.md).
