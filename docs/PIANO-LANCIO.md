# Piano di lancio web app — novembre 2026

Obiettivo: Vesper come web app installabile (iPhone e Android, senza Play Store)
pronta in produzione su vespercommunity.com.

- **Lancio pubblico: giovedì 26 novembre.** Margine fino a lunedì 30.
- **Stop alle nuove funzioni: 15 novembre.** Da lì solo correzioni.
- Il rischio maggiore per la data è la parte legale, non il codice. Se non è
  chiusa entro il 25, si fa un lancio "su invito" e si rimanda quello pubblico.

Stato verificato il 29 ottobre (sola lettura, nessuna modifica fatta).

---

## Bloccanti trovati

### Sicurezza (Supabase prod)
- [ ] `search_users` è eseguibile dal ruolo `anon`, cioè senza login, con la
      chiave pubblica che sta nel sito. La funzione non controlla
      `auth.uid() is null`. Verificare se espone profili (orientamento,
      identità) e revocare `EXECUTE` ad `anon`.
- [ ] Vista `public.public_profiles` segnalata come `SECURITY DEFINER` (livello
      ERROR nel security advisor). Verificare che sia voluto o passare a
      `security_invoker`.
- [ ] `fcm_tokens_touch_updated_at` senza `search_path` fisso (warning minore).
- [ ] Auth → attivare **Leaked password protection**.

### Privacy e legale
- [ ] Privacy e termini sono ancora "bozza da validare da un consulente legale".
- [ ] Il titolare è "il team di Vesper": serve un soggetto reale (persona fisica,
      associazione o società) con i dati di contatto.
- [ ] Si trattano dati di categoria particolare (orientamento, identità di
      genere) e un dato biometrico (video di verifica): serve una **DPIA**.
- [ ] In iscrizione mancano le spunte per accettare termini e privacy e il
      **consenso esplicito** (art. 9 GDPR) a dati sensibili e video. Ci sono
      solo la dichiarazione di categoria e le regole di condotta. Va chiarita
      anche la dichiarazione esplicita di maggiore età citata nei termini.
- [ ] I messaggi, DM compresi, vanno a OpenAI (USA): va inserito nella DPIA e
      verificata la retention dei dati lato OpenAI.

### Infrastruttura
- [ ] Supabase è sul piano **Free**: circa 200 connessioni realtime
      contemporanee, 1 GB di storage (i video di verifica lo riempiono in
      fretta) e nessun backup scaricabile. Passare a **Pro** prima del lancio.
- [ ] Ambiente dev da finire (vedi sotto). Serve per testare senza toccare prod.

---

## Settimana 1 · 30 ott – 8 nov: basi

- [ ] **Ambiente dev** (dal PC):
  - [ ] Vercel: le tre variabili `VITE_*` di tipo Config, ambiente Preview,
        branch `dev`, poi Redeploy. Le variabili di Production restano com'erano.
  - [ ] vesper-dev → Edge Functions → Secrets (dal file
        `supabase/.secrets.dev.local`).
  - [ ] Deploy delle edge function su dev
        (`--project-ref wzgygnksbechrrsrxngx --no-verify-jwt`).
        Oggi su dev non ce n'è nessuna.
  - [ ] Database → Webhooks → Enable, poi `supabase/webhooks.template.sql`
        compilato.
  - [ ] Auth → URL Configuration:
    - Site URL `https://dev.vespercommunity.com`
    - Redirect URLs `https://dev.vespercommunity.com/**` e `http://localhost:5173/**`
  - [ ] Controllo: su dev.vespercommunity.com l'account di prod non deve
        esistere.
- [ ] **Contattare un legale o un consulente privacy** (subito: è la cosa con i
      tempi più lunghi). Da portare: titolare, DPIA, revisione di privacy e
      termini, consensi in iscrizione, fornitori extra UE (Vercel, OpenAI,
      ImprovMX).
- [ ] Supabase prod → piano Pro, controllare che i backup giornalieri siano
      attivi.
- [ ] Leaked password protection attiva.

## Settimana 2 · 9 – 15 nov: sicurezza, privacy, moderazione

- [ ] Correggere `search_users` (niente `anon`) e `public_profiles`. Prima su
      dev, poi migration su prod.
- [ ] Spunte in iscrizione:
  - [ ] termini e privacy;
  - [ ] consenso esplicito ai dati sensibili e al video;
  - [ ] maggiore età.

  Salvare data e versione del consenso.
- [ ] Verificare che "Cancella account" elimini tutto: foto, video, messaggi o
      anonimizzazione, iscrizioni push, token FCM.
- [ ] Verificare i job GDPR (`vesper-gdpr-db`, `vesper-gdpr-storage`): video
      entro 30 giorni, documenti entro 24 ore, come scritto nella privacy.
- [ ] **Moderazione AI**: vedi la sezione più sotto.
- [ ] **15 nov: stop alle nuove funzioni.**

## Settimana 3 · 16 – 22 nov: test su dev e beta chiusa

- [ ] Telefoni su cui provare:
  - [ ] iPhone con Safari: installazione dalla schermata Home e notifiche
        push, che su iPhone arrivano solo ad app installata;
  - [ ] Android con Chrome: banner di installazione e notifiche;
  - [ ] un Android economico, per lentezza e memoria.
- [ ] Percorso completo di un utente nuovo:
  - [ ] iscrizione ed email di conferma (Brevo);
  - [ ] onboarding, verifica con video, richiesta di garanzia (vouch);
  - [ ] Foyer, stanze tematiche, DM, reazioni, risposte, menzioni;
  - [ ] segnalazione, blocco, notifiche, deep link dalle notifiche;
  - [ ] cambio email e password, reset password, PIN;
  - [ ] cancellazione account.
- [ ] Pannello admin: code di verifica, foto, segnalazioni, flag AI.
- [ ] Beta con 10–20 persone di fiducia per una settimana e un modulo per i bug.
- [ ] Moderazione umana pronta:
  - [ ] chi modera e in quali orari;
  - [ ] tempi di risposta per verifiche e segnalazioni;
  - [ ] regole scritte per avvisi, sospensioni e ban.

## Settimana 4 · 23 – 30 nov: rilascio

- [ ] **Lun 23**: correzione degli ultimi bug bloccanti della beta.
- [ ] **Mar 24**: PR `dev` → `main` col template:
  - [ ] migration e edge function su prod **prima** del merge;
  - [ ] secret e variabili nuove su Supabase prod e su Vercel Production;
  - [ ] `/check-pre-release` senza bloccanti;
  - [ ] prova su prod con un account nuovo.
- [ ] **Mer 25**:
  - [ ] privacy e termini definitivi pubblicati, nota "bozza" rimossa;
  - [ ] email di prova arrivate;
  - [ ] backup attivi.
- [ ] **Gio 26: lancio.** Guida breve "come installare Vesper" su iPhone e
      Android, con screenshot, per i canali social e community.
- [ ] **27 – 30 nov**: ogni giorno log delle edge function, coda di
      moderazione, segnalazioni. Correzioni subito.

---

## Moderazione AI: cosa sistemare

Proposta completa con il codice: [MODERAZIONE-AI.md](MODERAZIONE-AI.md).

Com'è oggi (`supabase/functions/moderate-message`):
- Soft mode: niente viene bloccato, il messaggio viene solo segnato
  `flagged_by_ai` e finisce nella coda AiFlags.
- Controlla due fonti:
  - una blocklist italiana di **6 frasi** (`_shared/blocklist.ts`);
  - OpenAI `omni-moderation-latest`, di cui si usa solo il sì/no `flagged`.
- In prod: 2 messaggi segnalati su circa 730 (311 in chat, 416 DM).

### Problemi
1. **Blocklist troppo corta e facile da aggirare.** Il confronto è sul testo
   esatto in minuscolo:
   - "fr0cio", "f r o c i o", "frociooo" e "di m3rda" passano;
   - gli accenti non vengono normalizzati;
   - mancano del tutto insulti misogini, transfobici e lesbofobici, minacce e
     incitamento.
2. **Del risultato di OpenAI si usa solo il sì/no.** Le categorie e i punteggi
   vengono buttati, quindi:
   - non si può regolare la soglia;
   - chi modera non vede il motivo della segnalazione.

   OpenAI tende a segnalare come "sexual" anche conversazioni consensuali tra
   persone adulte queer, e questo crea rumore, soprattutto nei DM. Al
   contrario, l'odio in italiano detto "educatamente" (retorica TERF, "uomo
   travestito", "le trans non sono donne") spesso non viene preso.
3. **Rischi tipici di questa community, oggi non coperti:**
   - **minori**: frasi come "ho 16 anni" o "sono minorenne" vanno sempre
     segnalate con priorità alta;
   - **outing e doxxing**: numeri di telefono, indirizzi, "so dove abiti",
     "lo dico a tutti";
   - **spam e truffe**: link a Telegram/WhatsApp, crypto, OnlyFans, escort;
   - **autolesionismo**: va segnalato, ma la risposta giusta è il supporto,
     non la sanzione.
4. **Errori invisibili.** Se OpenAI non risponde o manca `OPENAI_API_KEY`, il
   messaggio passa come "pulito" e l'errore resta solo nei log. Manca anche un
   timeout sulla chiamata (il webhook ha 5 secondi).
5. **Testi non moderati:** nickname, bio e testi del profilo. Un nickname
   offensivo oggi non viene segnalato.

### Proposte (in ordine di priorità)
- [ ] Salvare il **motivo** del flag (blocklist o categoria OpenAI con
      punteggio) e mostrarlo in AiFlags.
- [ ] **Soglie per categoria** invece del sì/no:
  - sempre: `sexual/minors`, `self-harm*`, `harassment/threatening`,
    `hate/threatening`, `violence`;
  - soglia più alta: `hate`, `harassment`;
  - `sexual` tra persone adulte: ignorato nei DM, soglia alta nelle chat
    pubbliche.
- [ ] **Regole italiane aggiuntive** (regex, non solo frasi esatte):
  - [ ] normalizzare il testo prima del confronto: minuscole, accenti, numeri
        al posto delle lettere (0→o, 3→e, 1→i, 4→a), lettere ripetute,
        spazi e punti in mezzo alle parole;
  - [ ] età dichiarata sotto i 18 anni ("ho 1[0-7] anni", "sono minorenne",
        "faccio la terza media"...);
  - [ ] numeri di telefono, email e link esterni nei primi messaggi di un
        account nuovo;
  - [ ] lista ampliata di insulti e frasi d'odio, da costruire con chi
        modera. I termini riappropriati usati da soli restano fuori, come
        già scritto nel codice.
- [ ] **Priorità alta** in coda (e notifica push ai moderatori) per minori,
      minacce e autolesionismo. Valutare di **nascondere subito** solo quei
      messaggi, in attesa di revisione.
- [ ] Timeout di circa 3 secondi sulla chiamata OpenAI e, in caso di errore, un
      flag `ai_check_failed` invece del silenzio.
- [ ] Moderare anche nickname e bio quando cambiano.
- [ ] Prima del lancio: provare su dev un set di circa 50 messaggi di test
      (insulti, falsi positivi queer, minori, spam) e controllare cosa viene
      preso.

---

## Riferimenti
- Progetto Supabase prod: `ywkttzzkvlemtsuoceke` · dev: `wzgygnksbechrrsrxngx`
- Flusso di rilascio: `.github/pull_request_template.md`
- Template webhook: `supabase/webhooks.template.sql`
