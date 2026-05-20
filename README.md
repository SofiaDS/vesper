# App community lesbica/queer — Documentazione di progetto

Repository di tutte le decisioni di prodotto e tecniche del progetto. Ogni file tratta un tema specifico, in modo da essere navigabile senza scrollare un singolo documento gigante.

Ultimo aggiornamento: 20 maggio 2026

---

## CONCEPT

**Cosa**: App mobile (iOS + Android) per connettere donne lesbiche, bisessuali, queer e persone della comunità LGBTQ+ femminile, partendo dall'Italia.

**Modello**: Chatroom-first community (non swipe/match come Tinder). Le persone si conoscono nella chatroom globale, poi possono passare a messaggi privati. In aggiunta, una funzione di **ricerca utenti opt-in** permette di trovare persone specifiche per nickname o di esplorare per filtri di affinità.

**Target**: Donne cis, donne trans (MTF), uomini trans (FTM), persone non-binary AFAB. Orientamenti: lesbiche, bisessuali, queer, pan, in questioning.

**Stato**: Idea — fase di progettazione pre-sviluppo.

---

## MAPPA DEI DOCUMENTI

### Decisioni di prodotto

| File | Contenuto |
|---|---|
| [`utenti_e_identita.md`](./utenti_e_identita.md) | Verifica identità, dichiarazione di appartenenza, categorie, esclusione uomini cis, principi etici |
| [`permessi_e_strati.md`](./permessi_e_strati.md) | I 3 strati di permessi progressivi, sistema vouching (garanti), reputazione |
| [`moderazione.md`](./moderazione.md) | Chi modera, segnalazioni, filtro AI, gestione casi speciali, dashboard moderatori |
| [`appelli.md`](./appelli.md) | Procedure di appello per rifiuto verifica e ban |
| [`profilo_utente.md`](./profilo_utente.md) | Campi profilo, visibilità, avatar preset, evoluzione v2 con foto |
| [`ricerca_utenti.md`](./ricerca_utenti.md) | Ricerca per nickname e per filtri di affinità, opt-in, anti-abuso |
| [`block.md`](./block.md) | Sistema di block tra utenti, perimetro, visibilità, gestione |
| [`chatroom.md`](./chatroom.md) | Struttura delle chat (1 globale + 2 tematiche), opzioni in ballottaggio |
| [`minori_e_eta.md`](./minori_e_eta.md) | Età minima 18+, doppia barriera, procedura sospetto minorenne |
| [`gdpr_e_legale.md`](./gdpr_e_legale.md) | Aspetti GDPR, compliance, TOS, consulenza legale, conservazione dati |
| [`monetizzazione.md`](./monetizzazione.md) | Modello di business, opzioni ADV/supporter/ibrido, posizionamento strategico |
| [`punti_aperti.md`](./punti_aperti.md) | Tutte le decisioni ancora da prendere, divise per priorità |

### Decisioni tecniche

| File | Contenuto |
|---|---|
| [`stack_tecnico.md`](./stack_tecnico.md) | Stack tecnologico completo, costi, roadmap di sviluppo |

---

## COME USARE QUESTI DOCUMENTI

- **Ogni decisione presa** è registrata con: contesto, opzioni considerate, scelta finale, motivazione, note aperte.
- **Decisioni scartate** sono mantenute con la motivazione (utile tra mesi per non ripensarci).
- **Riferimenti incrociati** tra file espliciti quando un tema tocca più documenti (es. "vedi `moderazione.md` punto X").
- **Aggiornare il file rilevante** ogni volta che una decisione viene presa o modificata, e aggiornare la data in alto.
