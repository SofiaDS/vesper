# Informativa Privacy — bozza per consulente/DPO

Bozza di lavoro da sottoporre a un consulente legale / DPO prima del lancio.
Non è un testo legale definitivo: serve come base di partenza con l'elenco
completo di dati, finalità, basi giuridiche e tempi di conservazione così
come implementati nel prodotto al 10 giugno 2026.

**Nota sui fornitori terzi**: in questa fase Vesper non integra vendor di
analytics o pubblicità. Sono però già attivi due fornitori "funzionali"
(non di marketing), entrambi extra-UE:
- **OpenAI** (Moderation API) — analizza il testo dei messaggi per la
  moderazione automatica dei contenuti.
- **OneSignal** — invio delle notifiche push.

Sono inclusi nella tabella perché trattano dati personali per conto del
titolare anche se non sono "terze parti pubblicitarie". Se si decide di
rimuoverli o sostituirli prima del lancio, vanno tolti anche da qui e
dall'informativa pubblicata in-app.

---

## 1. Tabella dati / finalità / base giuridica / conservazione

| Dato | Categoria | Finalità | Base giuridica | Conservazione |
|---   |---|---|---|---|
| Email | dato comune | account, login, comunicazioni di servizio | esecuzione del contratto | per tutta la vita dell'account |
| Password (hash) | dato comune | autenticazione | esecuzione del contratto | per tutta la vita dell'account |
| Nickname, città, bio, interessi, foto profilo | dato comune | funzionamento del profilo/community | esecuzione del contratto | per tutta la vita dell'account |
| Identità di genere / orientamento sessuale dichiarati | **categoria particolare (art. 9)** | verifica appartenenza alla community a cui Vesper è dedicato | consenso esplicito | per tutta la vita dell'account |
| Età dichiarata (18+) | dato comune (collegato a verifica minori) | verifica maggiore età, accesso al servizio | esecuzione del contratto + obbligo di legge | per tutta la vita dell'account |
| Video di verifica "liveness" | **dato biometrico (art. 9)** | verifica che l'account sia gestito da una persona reale, anti-fake | consenso esplicito | **30 giorni**, poi cancellazione automatica |
| Documento d'identità (solo in caso di segnalazione "sospetto minorenne") | dato comune ad alta sensibilità | verifica eccezionale dell'età | obbligo di legge / legittimo interesse (tutela minori) | **24 ore**, poi cancellazione |
| Messaggi in chat di gruppo e DM | dato comune (può contenere dati particolari se l'utente li scrive) | funzionamento del servizio (messaggistica) | esecuzione del contratto | per tutta la vita dell'account; cancellati/anonimizzati alla cancellazione account |
| Segnalazioni e log di moderazione | dato comune | sicurezza della community, gestione abusi | legittimo interesse | fino a 12 mesi, poi anonimizzati |
| Esito moderazione automatica (testo messaggi → OpenAI Moderation API) | dato comune | rilevare contenuti vietati prima della pubblicazione | legittimo interesse (sicurezza) | non conservato da OpenAI oltre l'analisi (da verificare nel DPA) |
| Token/identificativo dispositivo per push (OneSignal) | dato tecnico | invio notifiche (nuovi messaggi, esiti segnalazioni, ecc.) | consenso (permesso notifiche) | finché l'utente mantiene attive le notifiche |
| Log di accesso/sicurezza | dato tecnico | prevenzione abusi, sicurezza | legittimo interesse | breve termine (da definire, es. 90 giorni) |

---

## 2. Bozza testo informativa (estesa)

### Titolare del trattamento

Il titolare del trattamento dei dati personali raccolti tramite Vesper è
[ragione sociale/persona fisica da definire], contattabile all'indirizzo
privacy@vesperapp.it per qualsiasi richiesta relativa ai dati personali.

### Quali dati raccogliamo e perché

**Dati per creare e gestire l'account**
Email e password servono per permetterti di accedere al servizio. Sono
trattati per dare esecuzione al contratto che accetti iscrivendoti.

**Dati di profilo**
Nickname, città, bio, interessi e foto sono visibili (in tutto o in parte)
ad altri utenti e servono a far funzionare l'esperienza social dell'app.

**Dati su identità di genere e orientamento sessuale**
Vesper è uno spazio dedicato a persone che si riconoscono in specifiche
categorie. La dichiarazione di
appartenenza è un dato di categoria particolare ai sensi dell'art. 9 GDPR e
viene raccolta solo con il tuo consenso esplicito al momento
dell'iscrizione, al solo scopo di garantire che la community resti uno
spazio sicuro per le persone a cui è destinata.

**Verifica dell'età**
Dichiari di avere almeno 18 anni al momento dell'iscrizione. In caso di
segnalazione fondata di età falsa, può esserti richiesto in via eccezionale
un documento d'identità, usato esclusivamente per la verifica e cancellato
entro 24 ore.

**Verifica "persona reale" (video liveness)**
Al momento dell'iscrizione ti viene chiesto un breve video per verificare
che l'account sia gestito da una persona reale e non da un bot o un profilo
falso. Si tratta di un dato biometrico (art. 9 GDPR), trattato solo con il
tuo consenso esplicito. Il video viene cancellato automaticamente dopo 30
giorni e non viene utilizzato per riconoscimento facciale.

**Messaggi**
I messaggi che scrivi nelle chat di gruppo e nei messaggi privati sono
conservati per farti vedere lo storico delle conversazioni. Vengono
analizzati automaticamente (vedi sotto) per individuare contenuti vietati
prima di essere mostrati ad altri utenti.

**Segnalazioni e moderazione**
Se segnali un contenuto o un utente, i dati relativi alla segnalazione
vengono usati dal team di moderazione per valutare il caso e vengono
conservati per gestire eventuali appelli.

**Notifiche push**
Se attivi le notifiche, un identificativo del tuo dispositivo viene
condiviso con il fornitore del servizio di notifiche (OneSignal) per inviarti avvisi
relativi alla tua attività (nuovi messaggi, esiti di segnalazioni, ecc.).

### Con chi condividiamo i dati

- **Supabase** (infrastruttura/database, server in UE): ospita tutti i dati
  dell'app.
- **OpenAI** (Moderation API, USA): riceve il testo dei messaggi per
  l'analisi automatica dei contenuti vietati. Trasferimento extra-UE basato
  su clausole contrattuali standard.
- **OneSignal** (notifiche push, server internazionali): riceve
  l'identificativo del dispositivo per l'invio delle notifiche.

Non vendiamo né cediamo dati a terzi per finalità pubblicitarie o di
profilazione. Non sono attualmente integrati strumenti di analytics o
advertising.

### Per quanto tempo conserviamo i dati

Vedi tabella sopra. In sintesi: i dati biometrici e i documenti d'identità
hanno conservazioni molto brevi (30 giorni / 24 ore); i dati di account,
profilo e messaggi sono conservati finché l'account è attivo e vengono
cancellati o anonimizzati alla sua cancellazione; i log di moderazione sono
conservati fino a 12 mesi.

### I tuoi diritti

Puoi richiedere in ogni momento l'accesso, la rettifica, la cancellazione,
la limitazione del trattamento, la portabilità dei tuoi dati e opporti al
trattamento, scrivendo a privacy@vesperapp.it. Puoi cancellare l'account
autonomamente dalle Impostazioni dell'app. Hai sempre diritto a proporre
reclamo al Garante per la protezione dei dati personali.

### Sicurezza

Adottiamo misure tecniche e organizzative (cifratura delle comunicazioni,
accesso ai dati limitato a personale e moderatori autorizzati) per
proteggere i tuoi dati.

### Modifiche

Questa informativa può essere aggiornata; in caso di modifiche sostanziali
verrai avvisato/a tramite l'app.

---

## 3. Domande aperte da portare al consulente/DPO

- Conferma formulazione esatta della dichiarazione di appartenenza e della
  checkbox età (vedi `utenti_e_identita.md`, `minori_e_eta.md`).
- Conferma tempi di conservazione per messaggi/log moderazione (12 mesi è
  una proposta, non un obbligo di legge).
- Necessità di un registro dei trattamenti ex art. 30 e di un DPO formale.
- DPA da firmare con Supabase, OpenAI, OneSignal + valutazione SCC.
- Se/quando rimuovere OpenAI Moderation (extra-UE) a favore di
  un'alternativa europea.
- Procedura su cosa succede ai messaggi di un account cancellato:
  cancellazione totale o anonimizzazione del solo riferimento all'utente?

---

*Questo documento è la base per il testo che compare in-app in
[`app/src/screens/LegalScreen.tsx`](./app/src/screens/LegalScreen.tsx)
(sezione "privacy"). Va aggiornato in entrambi i posti se cambia qualcosa.*
