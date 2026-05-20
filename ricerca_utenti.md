# Ricerca utenti

Decisioni di prodotto per la funzione di ricerca/scoperta di altre utenti, in due modalità: **ricerca per nickname** e **ricerca a filtri** con punteggio di affinità.

Ultimo aggiornamento: 19 maggio 2026

---

## Indice

1. Principi guida
2. Modalità di ricerca
3. Chi compare nei risultati — il flag "sono cercabile"
4. Filtri disponibili
5. Affinità e ordinamento risultati
6. Cosa si vede nei risultati
7. Azioni dai risultati
8. Limiti, sicurezza, anti-abuso
9. UX e posizionamento nell'app
9bis. Ricerche recenti
10. Punti aperti

Vedi anche:
- [`profilo_utente.md`](./profilo_utente.md) per i campi del profilo e quali sono filtrabili
- [`permessi_e_strati.md`](./permessi_e_strati.md) per gli Strati e i permessi di DM
- [`moderazione.md`](./moderazione.md) per il sistema di segnalazioni e block

---

## 1. Principi guida

La feature di ricerca è uno spostamento parziale dal modello "chatroom-first" verso un modello "discovery". Per non snaturare l'app, è progettata con questi principi:

- **Opt-in esplicito**: una utente non compare nei risultati a meno che non abbia attivato il flag "sono cercabile". Default OFF.
- **Nessun campo nascosto entra mai nel matching**: la ricerca usa solo dati che l'utente ha reso esplicitamente pubblici.
- **Nessun aggancio diretto**: dai risultati non si manda mai un DM diretto. Si può visualizzare il profilo e, se l'utente lo permette, inviare una richiesta-accettazione (vedi sezione 7).
- **Niente gerarchie visive**: la ricerca non è una vetrina. Risultati non personalizzati per "appeal" presunto. Ordinamento per affinità deterministica, no algoritmi opachi.
- **Rate limit severo**: la ricerca non deve diventare uno strumento di scraping o uso compulsivo.
- **Asimmetria del block**: una utente bloccata non vede e non è vista da chi l'ha bloccata, nei risultati di ricerca come ovunque.

---

## 2. Modalità di ricerca

### A. Ricerca per nickname

- Input: stringa libera.
- Match: **prima esatto, poi parziale** (substring case-insensitive).
- Utile per: ritrovare una persona conosciuta in chatroom di cui ricordi il nickname.
- Comparizione nei risultati: comunque solo utenti con flag "cercabile" ON. **Senza opt-in, neanche il nickname esatto restituisce risultati.**

### B. Ricerca a filtri

- Input: combinazione di filtri (vedi sezione 4).
- Output: lista di utenti cercabili che matchano, ordinate per affinità (vedi sezione 5).
- Utile per: trovare persone con cui si potrebbe avere affinità (interessi simili, stessa zona, stili di vita compatibili).

### Le due modalità sono in UI separate

Per evitare ambiguità: la schermata di ricerca ha due tab/sezioni distinte ("Cerca per nickname" / "Esplora per filtri"). Non si mischiano nello stesso campo input.

---

## 3. Chi compare nei risultati — il flag "sono cercabile"

### Funzionamento

- Flag globale nel profilo utente, **default OFF**.
- L'utente lo attiva esplicitamente dalle impostazioni privacy.
- Quando è OFF: l'utente è invisibile in qualsiasi ricerca (nickname e filtri), come se non esistesse.
- Quando è ON: l'utente compare nei risultati, ma vengono mostrati **solo i campi che ha reso pubblici nel proprio profilo**.

### Requisiti per attivarlo

- Account **verificato** (almeno Strato 1).
- Aver compilato almeno: identità/orientamento (sono obbligatori comunque) + città/regione visibile + almeno 1 interesse.
  - Motivazione: senza nulla di pubblico, la ricerca non avrebbe senso e l'utente comparirebbe come "scheda vuota". Meglio richiedere un minimo di profilo per evitare risultati frustranti.

### Spiegazione all'utente

Al momento dell'attivazione, mostrare un testo chiaro:
> "Attivando questa opzione, altre utenti verificate potranno trovarti tramite la ricerca per nickname e per filtri. Vedranno solo le informazioni che hai reso pubbliche nel tuo profilo. Puoi disattivare in qualsiasi momento. Nessuno potrà comunque scriverti direttamente: per contattarti dovrà inviare una richiesta che tu potrai accettare o rifiutare."

---

## 4. Filtri disponibili

Tutti i filtri sono **opzionali e combinabili**. Una utente può lanciare una ricerca con un solo filtro (es. "tutte a Roma") o con più filtri combinati.

| Filtro | Tipo | Note |
|---|---|---|
| **Età** | Range numerico (slider min-max) | Min 18, max 99. Si applica solo a chi ha reso pubblica l'età |
| **Regione** | Multi-select | Lista regioni italiane |
| **Città** | Testo + autocomplete | Lista città italiane principali + free text |
| **Identità di genere** | Multi-select | Vedi opzioni in [`profilo_utente.md`](./profilo_utente.md) |
| **Orientamento** | Multi-select | Vedi opzioni in [`profilo_utente.md`](./profilo_utente.md) |
| **Interessi** | Multi-select (tag) | Si pesca dalla lista predefinita di interessi |
| **"Cerco" / Intenti** | Multi-select | Amicizia / dating / relazione / networking / confronto / solo chattare |
| **Fuma** | Multi-select | Fuma / non fuma / occasionalmente |
| **Sport** | Multi-select | Regolarmente / saltuariamente / no |

**Importante**: i filtri vengono applicati **solo a chi ha reso pubblico quel campo specifico**. Esempio: una ricerca "non fumatrici a Milano" non restituirà utenti che fumano ma hanno il campo "fuma" privato — verranno ignorate, non incluse né escluse arbitrariamente.

### Filtri esplicitamente esclusi

- ❌ **Ricerca per bio (full-text)**: non in v1. La bio è uno spazio narrativo, non un campo di matching. Si valuta in futuro.
- ❌ **Online ora / ultimo accesso**: mai usato come filtro né mostrato nei risultati. Coerente con il principio di non profilazione temporale.
- ❌ **Reputazione / Strato**: non visibile e non filtrabile dalle utenti. Resta uso interno della moderazione.
- ❌ **Distanza geografica precisa (km)**: si filtra per città/regione, non per radius. Nessuna geolocalizzazione live.

---

## 5. Affinità e ordinamento risultati

### Come si calcola l'affinità

Punteggio semplice e trasparente: **+1 per ogni filtro applicato che la utente target rispetta**.

Esempio: l'utente cerca "Roma + sport regolarmente + interessi: libri, cinema, viaggi". Una utente target a Roma che fa sport e ha libri+cinema tra gli interessi avrà 4 match su 5 filtri = affinità 80%.

Più gli **interessi in comune** (oltre a quelli filtrati esplicitamente) contano come piccolo bonus se non sono già stati usati come filtro, per favorire scoperte impreviste.

### Ordinamento

1. Risultati ordinati per punteggio di affinità (decrescente).
2. **A parità di punteggio**: **ordine casuale**, ri-mescolato a ogni ricerca.
   - Motivazione: evita che alcune utenti siano sempre "in cima" per ragioni arbitrarie (alfabetiche, data iscrizione, ecc.). Niente gerarchia implicita.
3. Mostrare il punteggio? **Sì, in forma morbida** ("5 cose in comune" anziché "83%"). Numero, non percentuale, perché meno dating-app-like.

### Numero risultati

- Massimo **20 risultati per ricerca**, paginati 10 alla volta.
- Se ci sono più match, l'utente può "carica altri" fino a un massimo di 50.
- Oltre i 50, l'invito è "raffina i filtri". Evita di trasformare la lista in un catalogo.

---

## 6. Cosa si vede nei risultati

Ogni risultato è una **card compatta** con:

- Avatar preset
- Nickname
- Età (se pubblica)
- Città o regione (a seconda di cosa è pubblico)
- Numero di "cose in comune" (es. "4 cose in comune")
- Eventuali 2-3 tag interessi/lifestyle in comune, evidenziati

**Non si vede**:
- Online status (mai)
- Bio (visibile solo cliccando sul profilo)
- Foto reali (non esistono in v1, e nemmeno in v2 saranno mai in lista)
- Reputazione, strato, data iscrizione
- "Ultimo attivo"

Cliccando sulla card si apre il **profilo pubblico completo** (limitato a ciò che l'utente ha reso visibile).

---

## 7. Azioni dai risultati

Dal profilo trovato via ricerca, l'utente può:

1. **Visualizzare il profilo pubblico** ✅
2. **Inviare una richiesta-accettazione per DM** ✅ — soggetta alle regole DM esistenti (vedi [`permessi_e_strati.md`](./permessi_e_strati.md)): richiedente deve essere almeno Strato 2 con i requisiti DM (4-5 messaggi in chatroom + accettazione destinataria).
3. **Segnalare** ✅ — entry point segnalazione sempre disponibile dal profilo
4. **Bloccare** ✅
5. **Inviare DM diretto** ❌ — **mai** dalla ricerca. Solo richiesta-accettazione.

### Perché niente DM diretto dalla ricerca

La ricerca a filtri è uno strumento di scoperta. Permettere DM diretti la trasformerebbe in un'app di dating con messaggistica aperta. Mantenere la richiesta-accettazione come unico canale preserva il consenso esplicito della destinataria e disincentiva il "cold messaging" di massa.

### Cosa succede a chi non ha ancora i permessi DM

Utenti Strato 1 (o Strato 2 senza ancora 4-5 messaggi in chatroom) possono comunque **cercare e visualizzare profili**, ma il bottone "invia richiesta" è disabilitato con tooltip esplicativo: "Per inviare richieste devi prima essere attiva in chatroom — leggi i requisiti".

---

## 8. Limiti, sicurezza, anti-abuso

### Rate limiting

- **20 ricerche per utente all'ora**, **100 al giorno**.
- Soglie da rivedere con dati reali. L'obiettivo è permettere uso normale (esplorare la community con calma) e scoraggiare scraping/uso compulsivo.

### Block list

- Una utente che ha bloccato un'altra **non la vede mai nei risultati**, e **non viene vista da lei**.
- Asimmetria gestita lato server, non lato client.

### Anti-doxxing

- La ricerca per nickname **non distingue tra account esistenti e non**: nei risultati vuoti non viene detto "questo nickname non esiste". Si dice solo "nessun risultato". Evita che si possa usare la ricerca per scoprire se una persona ha l'account.
- Combinato col flag opt-in OFF di default: nessuno può essere "scovato" senza il proprio consenso esplicito.

### Anti-stalking nickname

- Se un utente cerca lo stesso nickname senza risultati **più di 5 volte in 7 giorni**, mostrare un warning soft: "Non stiamo trovando questa persona. Forse non ha attivato la ricercabilità o ha cambiato nickname". Nessuna conferma né smentita.

### Segnalazione abuso ricerca

- Se una utente segnala di essere stata trovata e contattata in modo sgradito tramite ricerca, la moderazione può consultare i log di chi l'ha cercata di recente (solo a fini di indagine, mai esposti pubblicamente).
- Log delle ricerche conservati per 30 giorni, poi eliminati. Vedi [`gdpr_e_legale.md`](./gdpr_e_legale.md).

### Niente API pubblica

La ricerca è disponibile solo via app/client ufficiale. Nessun endpoint API esposto a terzi che permetterebbe scraping massivo.

---

## 9. UX e posizionamento nell'app

### Dove sta la ricerca nell'app

- Tab dedicata in navigation bar (insieme a Chatroom, DM, Profilo).
- Icona "lente" o "esplora".

### Onboarding alla feature

Al primo accesso alla tab ricerca, mostrare un breve schermata informativa:
- Cos'è la ricerca, cosa NON è (non dating-app, non swipe).
- Come funziona il flag "sono cercabile" (default OFF).
- Come si attiva per essere trovate.
- Pulsante "Attiva la mia visibilità" come call-to-action morbida (non obbligatoria).

### Coerenza visiva

La ricerca **non deve sembrare un'app di dating**. Linee guida:
- Niente layout a swipe / card a tutta pagina.
- Niente "match", "like", "preferiti".
- Lista verticale compatta, tono "directory" più che "vetrina".
- Avatar preset (non foto reali, in linea con v1).

### Asimmetria "vedi vs scrivi" — comunicazione all'utente

Una utente Strato 1 (o Strato 2 senza ancora i requisiti DM) **può cercare e visualizzare profili**, ma non può ancora inviare richieste. Questa asimmetria è intenzionale (vedi sezione 1, principi guida) e va comunicata in modo chiaro per evitare frustrazione. Tre touchpoint:

1. **Onboarding della tab ricerca** (primo accesso): "Qui puoi esplorare e visualizzare profili. Per inviare richieste di contatto serve essere attive in chatroom per qualche messaggio — è il nostro modo per assicurarci che chi si scrive sia davvero parte della community."
2. **Sulla card del profilo trovato**: il bottone "invia richiesta" è disabilitato, con tooltip che indica esattamente cosa manca (es. "Ti mancano 3 messaggi in chatroom per poter inviare richieste").
3. **Dopo l'invio della richiesta**: messaggio di conferma che ricorda che la destinataria deve accettare prima che si apra il DM.

**Importante**: i requisiti per inviare richieste dalla ricerca sono **identici** a quelli generali dei DM definiti in [`permessi_e_strati.md`](./permessi_e_strati.md). Non si introducono soglie diverse per la ricerca, per evitare un sistema a due velocità confuso.

---

## 9bis. Ricerche recenti (v1)

Funzione di comodità per chi usa la ricerca a filtri ripetutamente. Pensata con paletti che evitano la trasformazione in mini-feed compulsivo.

### Cosa si salva

- **Solo le query** (combinazioni di filtri usate), **non i profili visualizzati**.
- Esempio salvato: "Roma + interessi libri/teatro + non fuma". Riproduci la ricerca, non ti viene servita la lista delle persone trovate l'ultima volta.

### Limiti

- **Massimo 5 ricerche salvate** per utente, FIFO (la sesta sostituisce la più vecchia automaticamente).
- **Scadono dopo 30 giorni** se non vengono ri-eseguite, e spariscono dalla lista.
- **Cancellabili manualmente** una per una.
- Nessun bottone "salva come preferita" o "imposta come ricerca principale" — la feature deve restare leggera.

### Cosa NON si salva

- ❌ Profili visualizzati di recente ("ultime persone guardate").
- ❌ Richieste inviate o ricevute (queste vivono nei DM, non nella ricerca).
- ❌ Cronologia ricerche per nickname (la ricerca nickname è puntuale, non si salva).

### Motivazione

Le ricerche per filtri possono essere complesse (5-6 filtri combinati). Ricostruirle ogni volta è friction inutile per chi cerca in modo intenzionale. Salvarle è comodo. Salvare i profili guardati, invece, alimenta il loop dopaminico tipico delle app di dating ed è esattamente ciò che vogliamo evitare.

---

---

## 10. Punti aperti

Da risolvere prima di sviluppo:

- **Sport granulare**: campo singolo (sì/no/saltuariamente) o anche tag di tipo (corsa, yoga, palestra, sport di squadra…)? L'aggiunta di tag aumenta utilità ma anche complessità UI.
- **Soglie rate limit**: 20/ora e 100/giorno sono ipotesi. Da validare con beta.
- **Pesi affinità**: tutti i filtri pesano +1 uguale, oppure alcuni pesano di più (es. città > sport)? Tenuto semplice in v1, da iterare se necessario.
- **Salvataggio ricerca / ricerche frequenti**: ✅ deciso — incluso in v1 con paletti (vedi sezione 9bis).
- **Notifiche da ricerca**: nessuna notifica push "qualcuno ti ha trovata". Da confermare.

Da risolvere prima di v2:

- **Ricerca per affinità "scoperta"**: suggerimenti proattivi tipo "5 persone con cui potresti avere affinità" — interessante ma è esattamente il pattern delle app di dating. Da valutare con cautela.
- **Filtri lifestyle aggiuntivi**: alimentazione, animali, figli, orario chat — solo se richiesti dalle utenti.
