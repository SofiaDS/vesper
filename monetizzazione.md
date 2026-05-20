# Monetizzazione

Decisioni e opzioni in valutazione per il modello di monetizzazione dell'app. Tema strategico che incrocia business, etica e identità del prodotto.

Ultimo aggiornamento: 19 maggio 2026

**Stato**: ⚠️ Decisione strategica in sospeso — da discutere tra founder.

---

## Indice

1. Principi guida
2. Le tre opzioni in valutazione
3. ADV — analisi approfondita
4. Feature a pagamento — cosa funziona e cosa no in un'app comunitaria
5. La domanda di posizionamento (a monte di tutto)
6. Tempistiche
7. Punti aperti

Vedi anche:
- [`stack_tecnico.md`](./stack_tecnico.md) per i costi infrastruttura da coprire
- [`gdpr_e_legale.md`](./gdpr_e_legale.md) per le implicazioni legali dell'ADV su categorie speciali

---

## 1. Principi guida

La monetizzazione di questa app è una **scelta etica oltre che di business**. Le utenti sono spesso vulnerabili (persone non out, fasce economiche fragili, giovani, comunità marginalizzate). Ogni scelta di monetizzazione ha un costo non monetario sulla community.

Punti fermi:
- **Niente monetizzazione in v1**: focus su crescita e qualità della community.
- **Mai feature a pagamento che creano gerarchie di interazione sociale** (es. "più DM se paghi", "boost nei risultati", "vedi chi ha visto il profilo"). Contraddirebbero l'identità chatroom-first non-gerarchica del progetto.
- **Trasparenza totale sul modello**: le utenti devono capire come l'app si sostiene economicamente, sin dal primo accesso.
- **Mai vendere dati**: in nessun caso, sotto nessun modello.

---

## 2. Le tre opzioni in valutazione

### Opzione A — Modello "Wapa-style": ADV + remove ads premium

- App gratuita con annunci pubblicitari.
- Abbonamento premium (~1.99-2.99€/mese) rimuove gli annunci.
- È il modello standard delle app concorrenti del settore (Wapa, Her, Bumble base).

**Pro**:
- Funnel di conversione chiaro: l'utente prova gratis, paga per togliere il fastidio.
- Tasso di conversione tipico più alto (5-10% utenti attivi) rispetto al modello supporter puro.
- Familiare alle utenti, nessuna "educazione" al modello necessaria.
- Reso scalabile in fase matura.

**Contro**:
- Complessità GDPR su categorie speciali (orientamento, identità di genere): serve consenso esplicito separato per ADV personalizzate. Chi nega vede ADV contestuali (CPM ~dimezzato).
- Rischio reputazionale su contenuti pubblicitari (annunci omofobi, conversion therapy mascherate, ecc.). Mitigabile con filtri categorici e scelta di reti curate (es. EthicalAds, Carbon) ma mai del tutto eliminabile.
- Resa economica modesta nei primi 2 anni con utenti italiane di nicchia (CPM 1-5€, serve volume).
- L'app "appesantita" da presenza pubblicitaria — contraddice in parte l'identità di spazio sicuro/curato.

### Opzione B — Modello "supporter puro": donazione/abbonamento di sostegno, niente ADV mai

- App gratuita senza pubblicità.
- Abbonamento opzionale 3-4€/mese o ~30€/anno per supportare il progetto.
- Vantaggi solo cosmetici o personali (avatar extra, temi, salvataggio ricerche illimitato, bio più lunga, modalità incognito), **nessun vantaggio sull'interazione sociale**.
- Modello tipico di progetti a forte identità valoriale: Mastodon, Signal, Wikipedia, Pixelfed.

**Pro**:
- App pulita, nessuna complessità GDPR/ADV.
- Comunica forte i valori del progetto.
- Le utenti che pagano lo fanno per sostenere, non per "essere più degne".
- Coerente al 100% con l'identità chatroom-first non-gerarchica.

**Contro**:
- Conversione più bassa (tipicamente 2-5% utenti attivi).
- Funziona solo se la community ha una forte identità valoriale condivisa.
- Ricavo più modesto, copre infrastruttura ma difficilmente stipendi.
- Richiede educazione/comunicazione del modello alle utenti.

### Opzione C — Modello ibrido evolutivo (raccomandazione di Claude)

- **v1**: gratis senza ADV, focus su crescita.
- **v2** (6-12 mesi dopo lancio): introduzione del modello supporter (4€/mese), **senza ADV**. Si testa se il modello valoriale è sufficiente.
- **v3** (solo se serve, 18+ mesi): se i ricavi supporter non bastano a sostenere l'app, si introducono ADV con la formula "gratis con ADV / supporter no ADV" — il supporter si trasforma automaticamente nel "remove ads" pagante.

**Pro**:
- Permette di partire pulite (no complessità ADV in fase di crescita).
- Testa il modello valoriale prima di ripiegare su ADV.
- Ha un piano B (ADV) senza dover improvvisare in emergenza.
- Coerente con un approccio "founded values first, optimize later".

**Contro**:
- Più complesso da pianificare (tre fasi anziché una).
- Rischia di rimandare la sostenibilità economica.
- Se il modello valoriale non funziona in v2, il pivot a v3 richiede comunicazione delicata alle utenti che si sono fidate del "no ADV mai".

---

## 3. ADV — analisi approfondita

Approfondimento dedicato perché è il punto più delicato.

### Problema 1: GDPR su categorie speciali

L'app raccoglie dati che il GDPR (art. 9) classifica come **categorie speciali**:
- Orientamento sessuale (dichiarato all'iscrizione)
- Identità di genere (idem)
- Eventualmente: ubicazione, interessi sensibili

Le reti ADV (AdMob, Meta Audience Network) di default trasmettono identificatori device + segmenti utente alle reti. Per app generaliste non è problematico; per app con dati di categorie speciali, **serve consenso esplicito separato** per ADV personalizzate.

**Soluzione tipica del settore**:
- Banner di consenso al primo avvio: "Accetti pubblicità personalizzate basate sui tuoi dati?"
- Chi accetta → ADV personalizzate (CPM più alto).
- Chi rifiuta → ADV contestuali (CPM 30-50% più basso).
- Vedi `gdpr_e_legale.md` per dettagli normativi.

**Implicazione economica**: se il 50% delle utenti nega il consenso (probabile per un'app di nicchia attenta alla privacy), il ricavo ADV reale è significativamente più basso delle stime "da brochure".

### Problema 2: conflitto sui contenuti pubblicitari

Le reti ADV mostrano annunci di chiunque paghi. Senza filtri attivi, possibili annunci:
- Contenuti religiosi conservatori
- "Cure" per attrazione dello stesso sesso
- App di dating etero
- Brand con storico omofobo (es. alcune catene di fast food, banche, ecc.)

**Mitigazioni possibili**:
- Filtri categorici lato rete ADV (escludere intere categorie tipo "religion", "alternative health").
- Lista nera di advertiser specifici.
- Scelta di reti più curate (EthicalAds, Carbon — rendono meno ma sono più pulite).
- Whitelisting (solo advertiser pre-approvati) — operativamente pesante.

Nessuna mitigazione è perfetta. Va messo in conto che ogni tanto sgusciano fuori annunci problematici, e ci saranno screenshot indignati sui social. È un rischio reputazionale strutturale dell'opzione A.

### Problema 3: resa economica realistica

CPM tipici 2026 per app verticali italiane: **1-5€ per mille impression**.

Esempio di calcolo:
- 10.000 utenti attive mensili
- Ognuna vede ~50 impression/mese (banner + interstitial)
- = 500.000 impression/mese
- A CPM 3€ → **1.500€/mese di ricavo lordo ADV**
- Meno: commissioni Apple/Google (~15-30%), commissioni rete ADV (~30%)
- Netto reale: **~700-900€/mese**

Per arrivare a un MRR significativo (es. 5.000€/mese) servono **40-50.000 utenti attive**. Realistico in v2-v3, non in v1.

---

## 4. Feature a pagamento — cosa funziona e cosa no

### ❌ Feature da NON proporre mai (creano gerarchie di interazione)

- "Più richieste DM al giorno se paghi" → trasforma in dating-app premium
- "Vedi chi ha visitato il tuo profilo" → ansiogeno, surveillance reciproca
- "Boost del tuo profilo nei risultati di ricerca" → contraddice `ricerca_utenti.md` ("ordine casuale entro stessa affinità")
- "Filtri di ricerca premium" → spacca la community tra "chi può cercare bene" e chi no
- "Badge di status visibile" → contraddice la scelta di reputazione invisibile (vedi `reputazione.md` quando esisterà)

Principio comune: tutto questo gruppo comunica *"se paghi sei più degna di interazione"*. Veleno per una community a forte identità.

### ✅ Feature accettabili (comodità personali, nessun vantaggio sociale)

- **Avatar e temi**: pacchetti avatar preset extra, temi colore app, font personalizzati.
- **Salvataggio illimitato di ricerche**: in v1 il limite è 5 (vedi `ricerca_utenti.md` sez. 9bis). Premium → 20-30.
- **Bio più lunga / più tag interessi**: limiti più alti sui campi del profilo.
- **Modalità incognito**: legge la chatroom senza apparire nella lista membri attivi. Da discutere bene per implicazioni di moderazione.
- **Esportazione dati**: backup mensile dei propri DM in formato leggibile.
- **Notifiche più granulari**: filtri di notifica avanzati.

Tutte queste sono comodità che NON danno vantaggi nelle interazioni con le altre utenti.

---

## 5. La domanda di posizionamento (a monte di tutto)

Prima di scegliere il modello di business, va risolta una domanda di posizionamento strategico:

> **Vogliamo essere un'alternativa migliore a Wapa nello stesso mercato, o vogliamo essere una cosa diversa (community/chatroom-first, non dating)?**

### Se "alternativa migliore a Wapa stesso mercato"

- Le utenti arrivano da Wapa, si aspettano un modello familiare.
- L'opzione A (ADV + remove ads premium) è coerente — converge alla soluzione standard del mercato.
- L'identità del prodotto è "Wapa fatta meglio": più sicura, più curata, più rispettosa.
- Focus: scalabilità, conversione, ottimizzazione funnel.

### Se "cosa diversa, community/chatroom-first"

- Le utenti percepiscono l'app come uno spazio diverso, non come app di dating.
- L'opzione B (supporter puro) è coerente — comunica un modello di business altrettanto diverso.
- L'identità del prodotto è "luogo, non strumento": community curata, no dating-pattern.
- Focus: identità, valori, retention da affezione.

### Se "un misto" — lavoro che resta da fare

Se la risposta è "un misto" (cosa probabilmente vera, non è scelta binaria), serve articolare il misto con precisione:
- In quali aspetti è "come Wapa fatta meglio"? (es. modello chat?)
- In quali aspetti è "una cosa diversa"? (es. focus chatroom prima di DM, no foto in v1, reputazione invisibile)
- Il modello business riflette il quale dei due lati?

**Questo è il prossimo passo strategico da fare tra founder**, prima di decidere monetizzazione.

---

## 6. Tempistiche (qualunque opzione si scelga)

- **Non monetizzare in v1.** Focus su crescita, fiducia, qualità della community.
- **Soglia minima per attivare monetizzazione**: ~5.000 utenti attive mensili E almeno 12 mesi dal lancio. Sotto questi numeri, la monetizzazione genera attrito senza ricavo reale.
- **Decidere il modello entro 6 mesi dal lancio**, non last-minute. Implementarlo richiede 2-3 mesi di sviluppo, comunicazione, eventualmente consulenza legale per il flusso GDPR.

### Cosa serve per sopravvivere fino alla monetizzazione

- **Costi infrastruttura iniziali bassi**: vedi `stack_tecnico.md`. Stime 50-200€/mese nei primi mesi.
- **Tempo founder non remunerato**: realtà di quasi tutte le startup early-stage.
- **Grant/bandi**: esistono fondi per imprenditoria femminile, diversità/inclusione, LGBTQ+ (UE, regionali, fondazioni). Da esplorare in parallelo. Possibile entry: bandi Invitalia "Imprenditoria femminile", fondi regionali, programmi accelerator LGBTQ+ tipo StartOut (USA, ma esistono equivalenti EU).

---

## 7. Punti aperti

### Da decidere a quattro mani tra founder

1. **Posizionamento strategico** (sezione 5): alternativa-a-Wapa vs cosa-diversa vs misto-articolato. **Tutto il resto dipende da questa.**
2. **Modello di monetizzazione**: A, B o C — da scegliere dopo aver risolto il punto 1.
3. **Soglia di utenti attive per attivare monetizzazione**: la stima 5.000 è plausibile ma da validare con dati reali una volta lanciata l'app.

### Da approfondire successivamente

- **Modalità incognito**: feature accattivante ma con implicazioni di moderazione (un'utente che legge senza apparire può facilitare stalking?). Da valutare bene se inclusa nel premium.
- **Reti ADV specifiche**: se si va su opzione A o C-evoluta, scegliere quali reti (AdMob standard vs EthicalAds vs Carbon vs altre). Decisione tecnico-etica.
- **Bandi e grant**: ricerca attiva, in parallelo, indipendentemente dall'opzione scelta.
- **Eventuale modello B2B futuro**: partnership editoriali con realtà allineate (es. libreria queer che paga per sponsorizzare evento in chatroom — non ADV ma partnership curata). Lontano nel tempo, ma vale la pena tenerlo come idea aperta.

### Decisioni di sfondo già acquisite

- ✅ Mai vendere dati a terzi.
- ✅ Mai feature a pagamento che creano gerarchie di interazione (DM extra, boost, vedi-chi-ti-ha-visto).
- ✅ Niente monetizzazione in v1.
