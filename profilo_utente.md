# Profilo utente

Decisioni sui campi del profilo utente, sulla loro visibilità, sul sistema di avatar preset, e sull'evoluzione futura con foto reali.

Ultimo aggiornamento: 21 maggio 2026

---

## Indice

1. Principi guida del profilo
2. Tabella campi del profilo
3. Campi esplicitamente esclusi
4. Identità visiva — avatar preset (v1)
5. Evoluzione v2 — foto reali con permessi granulari

Vedi anche:
- [`utenti_e_identita.md`](./utenti_e_identita.md) per come si compilano i campi identità/orientamento durante l'iscrizione
- [`minori_e_eta.md`](./minori_e_eta.md) per la verifica dell'età 18+
- [`ricerca_utenti.md`](./ricerca_utenti.md) per come i campi vengono usati nella ricerca/scoperta

---

## 1. Principi guida del profilo

- **Campi obbligatori per il sistema, visibilità sempre scelta dall'utente** dove possibile.
- **Modello identità visiva**: **solo avatar preset in v1** (no foto reali). Vedi sezione 4.
- **Privacy by design**: ogni campo nasce non-pubblico, l'utente decide attivamente cosa rendere visibile.
- **Filtri di ricerca**: alcuni campi possono essere usati come filtro dalla feature di ricerca utenti (vedi [`ricerca_utenti.md`](./ricerca_utenti.md)). Un campo è "filtrabile" **solo se l'utente lo ha reso pubblico E ha attivato il flag globale "sono cercabile"**. Nessun campo nascosto viene mai usato per il matching, nemmeno in modo aggregato.

---

## 2. Tabella campi del profilo

Colonna "Filtrabile": indica se il campo può essere usato come filtro nella ricerca utenti, **a condizione che l'utente lo abbia reso pubblico e abbia attivato l'opt-in "sono cercabile"**.

| Campo | Obbligatorio | Visibilità di default | Filtrabile | Note |
|---|---|---|---|---|
| **Nickname** | Sì | Sempre pubblico | Sì (ricerca esatta/parziale) | Unico nella community |
| **Email** | Sì | **Mai pubblica, mai** | No | Solo per recovery e comunicazioni di sistema |
| **Data di nascita** | Sì | Età calcolata, utente sceglie se mostrare | Sì (range età) | Datepicker blocca <18 hardcoded |
| **Identità di genere** | Sì (a iscrizione) | Utente sceglie se mostrare | Sì (multi-select) | Donna cis / Donna trans / Uomo trans / NB-AFAB / preferisco non specificare |
| **Orientamento** | Sì (a iscrizione) | Utente sceglie se mostrare | Sì (multi-select) | Lesbica / Bi / Queer / Pan / Questioning / preferisco non dire |
| **Città/regione** | Sì | Utente sceglie se mostrare | Sì (per regione e per città) | Utile per future espansioni (gruppi locali) |
| **Pronomi** | No | Utente sceglie se mostrare | No (visualizzati ma non filtrabili) | Incentivati ma opzionali |
| **Bio breve** | No (fortemente consigliata) | Pubblica se compilata | No (ricerca full-text non prevista in v1) | Max ~300 caratteri |
| **Interessi (tag)** | No | Pubblici se compilati | Sì (multi-select) | 4-5 tag, scelti da lista predefinita o liberi |
| **"Cerco" / Intenti** | No | Utente sceglie se mostrare | Sì (multi-select) | Amicizia, dating, relazione, networking, confronto, solo chattare |
| **Fuma / Non fuma** | No | Utente sceglie se mostrare | Sì | Opzioni: fuma / non fuma / occasionalmente / preferisco non dire |
| **Sport / Attività fisica** | No | Utente sceglie se mostrare | Sì | Opzioni: sì regolarmente / saltuariamente / no / preferisco non dire. Eventualmente tag di tipo (es. corsa, yoga, palestra) — da valutare |
| **Filtro DM** | No | Interno, non visibile | No | Chi può scrivermi: tutte / dalla mia città / con miei stessi intenti / verificate da X mesi. Configurabile da Strato 2 (vedi [`permessi_e_strati.md`](./permessi_e_strati.md) sezione 1.1) |
| **Online status** | No | **Default OFF, opt-in** | No | Mai orari precisi, max "online" o "online di recente". **Mai mostrato nei risultati di ricerca**, anche se attivo nel profilo |
| **Cercabile** (flag globale) | No | **Default OFF, opt-in** | (è il flag stesso) | Quando OFF, l'utente non compare mai nei risultati. Vedi [`ricerca_utenti.md`](./ricerca_utenti.md) |

### Note sui nuovi campi lifestyle

I campi **fuma/non fuma** e **sport** sono pensati come prima coppia di campi "lifestyle filtrabili". Altri possibili candidati (da valutare in iterazioni future, non in v1):
- Alimentazione (onnivora / vegetariana / vegana / preferisco non dire)
- Animali (sì / no / vorrei)
- Figli (ho / vorrei / non vorrei / preferisco non dire)
- Orario preferito di chat (mattina / sera / notte)

**Principio**: aggiungere lifestyle solo se richiesti dalle utenti reali una volta lanciata l'app, per non trasformare il profilo in un questionario invasivo. Ogni nuovo campo aumenta la frizione di iscrizione e il rischio di profilazione/discriminazione.

---

## 3. Campi esplicitamente esclusi

Campi che sono stati discussi e **decisi di non includere**, con motivazione:

- ❌ **Nome e cognome reali**: rischio doxxing, outing involontario, incoerenza con modello nickname-based.
- ❌ **Contatti social esterni** (Instagram, ecc.): si vuole che le utenti restino nell'app, riduce rischio doxxing/stalking.
- ❌ **Email pubblica**: vulnerabilità a phishing, può rivelare identità reale.
- ❌ **Stato relazione**: troppo invasivo, può creare situazioni complicate.
- ❌ **Religione, politica**: polarizzanti, non utili al profilo (se ne può parlare in chat).
- ❌ **Stato lavorativo dettagliato** (azienda, posizione): rivela troppo sull'identità reale.
- ❌ **Numero di telefono**: mai, in nessuna forma.

---

## 4. Identità visiva — avatar preset (solo v1)

### Scelta v1

**Solo avatar preset, niente foto reali**.

### Motivazione

- **Coerenza con la natura dell'app**: ci si conosce attraverso parole, non immagini. Opposto del modello Tinder.
- **Massima sicurezza per utenti vulnerabili**: niente screenshot rubati, niente reverse image search, niente outing involontario.
- **Egualitarismo visivo**: nessuna gerarchia implicita basata sull'aspetto.

### Implementazione

- Set di ~20-30 avatar preset disegnati per la community, stilizzati, colorati, non realistici.
- L'utente sceglie un avatar all'iscrizione e può cambiarlo in qualsiasi momento.
- Stesso avatar usato in chatroom, DM, profilo.
- Comunicazione del principio nei TOS: "questa è un'app dove ci si conosce dalle parole, non dalle foto".

---

## 5. Evoluzione v2 — foto reali con permessi granulari (idea futura, non v1)

### Caratteristiche previste

- Le foto reali **non sostituiscono mai l'avatar** nelle chatroom/DM — restano nel profilo, visibili a chi clicca sul nickname.
- Numero massimo: 3-5 foto.
- **Permessi granulari di visibilità** (punto chiave):
  - Foto visibili a tutte le utenti verificate (opzione più aperta)
  - Foto visibili solo a chi ha già chattato con me in DM
  - Foto visibili solo a chi ho approvato manualmente (whitelist)
- Sistema di moderazione delle foto da definire (filtro AI per nudità/contenuti inappropriati + revisione manuale su segnalazione).

### Quando introdurla

Dopo aver osservato come la community vive senza foto in v1. Se emerge una richiesta diffusa e legittima si valuta. Se la community funziona bene senza, si lascia così.

**Stato**: idea documentata per il futuro, non implementare in v1.
