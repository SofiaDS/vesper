# Audit UX/UI e Accessibilità — Vesper (giugno 2026)

Audit di tutta `app/src` (screens + components) rispetto a "Inchiostro & oro", alle linee guida WCAG AA e alle euristiche di Nielsen. Solo analisi: nessun file di codice modificato.

Convenzioni priorità:
- **P0 (Alta / bloccante)**: impedisce o ostacola seriamente l'uso, problema di accessibilità con impatto ampio.
- **P1 (Media)**: degrada l'esperienza, incoerenza diffusa, accessibilità su flussi secondari.
- **P2 (Bassa / polish)**: rifinitura, delight, coerenza minore.

---

## P0 — Alta priorità

### 1. Contrasto `--error` (#D72638) insufficiente su `--bg`/`--surface` — RISOLTO
- **Schermate**: trasversale — `AuthScreen`, `OnboardingScreen`, `RoomsScreen`, `ChatScreen` (`.chat-error`), `PinLockScreen`, `ReportDialog`, `SearchScreen`, `VerificationScreen`, badge `.rep-active`, ecc. (classe `.err`/`.warn`).
- **Problema**: contrasto misurato `#D72638` su `#171520` = **3.63:1**, su `#221f2e` = **3.24:1**. Sotto la soglia AA 4.5:1 per testo normale (è il colore usato per messaggi di errore — proprio il testo che più conta sia leggibile, incluso da chi ha bassa vista).
- **Soluzione applicata**: introdotta la variabile `--error-text: #FF6B7A` (tema scuro, ≥4.5:1 su `#171520`/`#221f2e`) usata per tutti i `color:` di testo (`.err`, `.warn`, `.btn-ghost`/`.btn-danger`, `.chat-error`, `.rep-active`, `.rep-badge-active`, `.rep-high`, `.verif-rejection`, `.limit-warning`, hover su `.msg-report`/`.reply-bar-cancel`/`.pf-icon-btn.danger`). `--error` resta invariato per badge/sfondi/bordi (contrasto 3:1 ok per quei casi).
- **Motivazione**: accessibilità (WCAG AA 1.4.3); gli errori sono il momento critico in cui l'utente deve capire cosa è andato storto (form di login/registrazione, invio messaggi, segnalazioni).

### 2. Tema chiaro: `--accent` (#B8841F) e `--error` (#D72638) falliscono il contrasto — RISOLTO
- **Schermate**: tutte, quando l'utente attiva il tema chiaro (toggle nel burger menu, `useTheme`/`ThemeToggle`).
- **Problema**: nel blocco `[data-theme="light"]`, `--accent: #B8841F` su `--bg: #f0ece0` = **2.80:1** e su `--surface: #e4dfd0` = **2.48:1** — molto sotto sia 4.5:1 (testo) sia 3:1 (componenti UI grandi). `--accent` è usato per link, titoli `h1`, testo selezionato nei chip, `.pf-label`/`.report-type`, `.dm-conv-name`, ecc. `--error` su bg chiaro = 4.21:1, sotto 4.5:1 per testo normale (ok solo per testo "large"/UI).
- **Soluzione applicata**: introdotte `--accent-text: #7A5510` e `--error-text: #B91C3C` per il tema chiaro (entrambe ≥4.5:1 su `#f0ece0` e `#e4dfd0`), usate per tutti i `color:` di testo dorato/errore (titoli `.brand h1`, `.tagline`, link, `.chip.sel`/`.chip.on`/`.seg.on`, `.report-type`, `.dm-conv-name`, `.rep-low`/`.rep-high`/`.rep-active`, `.verif-countdown`, `.limit-warning`, ecc.). Nel tema scuro `--accent-text` rimane uguale a `--accent` (`#E8B14E`, già conforme), mentre `--accent` ed `--error` restano invariati ovunque siano usati come sfondo/bordo/badge/`accent-color` (servono solo 3:1).
- **Motivazione**: accessibilità — il tema chiaro è già implementato e selezionabile dall'utente, quindi va validato con lo stesso rigore del tema scuro di default.

### 3. ~~Nessun focus management/Escape nelle modali (`ReportDialog` e simili)~~ — RISOLTO
- **Componenti**: `ReportDialog.tsx` (riusato in `ChatScreen`, `PublicProfileScreen`, gallerie foto), `PhotoUploadDialog.tsx`, lightbox in `ProfileGallery`.
- **Problema**: `.modal` ha `role="dialog" aria-modal="true"` ma:
  - nessun focus iniziale spostato sul dialog/primo campo all'apertura;
  - nessun keydown handler per `Escape` → chiusura;
  - nessun focus trap (Tab può uscire dal modal e finire su elementi sottostanti, alcuni invisibili dietro l'overlay);
  - alla chiusura il focus non torna al trigger che ha aperto il dialog.
- **Miglioramento proposto**: aggiungere in `ReportDialog` (e idealmente in un hook condiviso `useModalA11y`) — `useEffect` che sposta il focus sul container del modal o sul primo campo interattivo all'apertura, listener `keydown` per `Escape` → `onClose()`, semplice focus trap (Tab/Shift+Tab ciclico tra gli elementi focusabili del `.modal`), e ripristino del focus sul trigger alla chiusura.
- **Motivazione**: accessibilità da tastiera (WCAG 2.1.2 No Keyboard Trap, 2.4.3 Focus Order) — utenti che navigano da tastiera/screen reader non hanno modo standard di chiudere il dialog né sanno dove si trovano.
- **Fix applicata**: nuovo hook condiviso `app/src/hooks/useModalA11y.ts` (focus iniziale sul primo elemento focusabile o sul container `.modal`/`.lightbox` con `tabIndex={-1}`, `Escape` → `onClose`, focus trap Tab/Shift+Tab, ripristino del focus sul trigger alla chiusura). Integrato in `ReportDialog.tsx`, `PhotoUploadDialog.tsx` (collegato a `close`, che ferma anche lo stream camera) e nel lightbox di `ProfileGallery.tsx` (condizione `opened != null`, chiusura via `setOpenIdx(null)`); aggiunto anche `role="dialog" aria-modal="true" tabIndex={-1}` al lightbox, che ne era privo.

### 4. Nessuna `aria-live` region per feedback asincroni — RISOLTO
- **Fix applicata**: aggiunti `role="alert"` (errori, equivale a `aria-live="assertive"`) e `role="status"` (conferme/info, equivale a `aria-live="polite"`) ai messaggi di feedback transitori non legati a un campo form specifico, senza introdurre nuove librerie o un sistema di toast globale.
- **`role="alert"` (errori `.err` / `.chat-error` / `.warn`)**: `App.tsx` (banner "Supabase non configurato"), `components/ReportDialog.tsx`, `components/PhotoUploadDialog.tsx` (3 occorrenze), `screens/PinLockScreen.tsx` ("PIN errato"), `screens/DmScreen.tsx`, `screens/ChatScreen.tsx`, `screens/BlockedUsersScreen.tsx`, `screens/RoomsScreen.tsx`, `screens/PublicProfileScreen.tsx` (errore caricamento profilo), `screens/SearchScreen.tsx`, `screens/OnboardingScreen.tsx` (`vouchErr` e `error`), `screens/AuthScreen.tsx`, `screens/UpdatePasswordScreen.tsx`, `screens/VerificationScreen.tsx` (2 occorrenze), `screens/profile/PinSetupSection.tsx` (set + change PIN), `screens/profile/ProfileEditor.tsx` (errore foto + errore salvataggio), `screens/profile/DeleteAccountSection.tsx`, `screens/admin/AdminStats.tsx`, `screens/admin/UserReputation.tsx` (3 occorrenze), `screens/admin/ModeratorManagement.tsx`, `screens/admin/ReportsModeration.tsx` (2 occorrenze), `screens/admin/ReputationModeration.tsx`, `screens/admin/AiFlags.tsx`, `screens/admin/PhotoModeration.tsx`, `screens/admin/VerificationModeration.tsx`.
- **`role="status"` (conferme/info)**: `components/ReportDialog.tsx` (pannello "Segnalazione inviata"), `screens/AuthScreen.tsx` (`info`), `screens/PublicProfileScreen.tsx` (`dmFeedback`, es. "Richiesta inviata."), `screens/profile/ProfileEditor.tsx` (messaggio `.ok` di avanzamento strato raggiunto), `screens/admin/ModeratorManagement.tsx` (`info`).
- **Nota**: non toccati i messaggi di errore già associati a un campo specifico (nessuno usava ancora `aria-describedby` al momento del fix) né gli stati di solo caricamento/`hint` puramente informativi non legati a un'azione asincrona dell'utente.
- **Motivazione**: accessibilità — feedback di sistema (Nielsen #1) ora raggiunge gli utenti di screen reader, in un'app dove azioni come "segnalazione inviata" o "richiesta DM inviata" sono importanti per la fiducia nell'app.

### 5. Touch target troppo piccoli su azioni chat frequenti — RISOLTO
- **Componente**: `ChatScreen.tsx` — `.msg-reply` (↩) e `.msg-report` (⚑), `.msg-reaction-add` (+ reazione), `.reply-bar-cancel` (✕ nella barra "rispondi a").
- **Problema**: questi pulsanti avevano `padding: 0`, `font-size: 0.72rem`/`0.85rem` e nessuna `min-width`/`min-height`: l'area cliccabile reale era di pochi px, ben sotto i 44×44px raccomandati, su un layout mobile-first a 420px dove sono azioni usate spesso (rispondi, segnala, reagisci) e vicine tra loro (`.msg-footer` con `gap: 6px`).
- **Soluzione applicata**: l'icona/testo visibile resta delle stesse dimensioni (font-size invariati a 0.72rem/0.85rem), ma l'area di tocco è stata portata a ≥44×44px:
  - `.msg-reply` / `.msg-report`: `min-width/min-height: 44px`, `padding: 0.4rem 0.6rem`, con `margin: -0.55rem 0` per non spingere giù il layout della bolla (l'area in eccesso ricade nel padding della bolla, dove non c'è `overflow: hidden`); `.msg-footer` portato a `display: inline-flex` centrato e `gap` ridotto a `0.25rem` (compensato dal padding interno dei bottoni, che di fatto aumenta lo spazio tra le zone cliccabili).
  - `.msg-reaction-add`: cerchio tratteggiato lasciato invariato (1.4rem), aggiunto uno pseudo-elemento `::before` di 44×44px ancorato al bordo inferiore (`bottom: 0`, esteso solo verso l'alto/lati) e invisibile (`position: relative` sul bottone) per estendere solo l'area cliccabile senza ingrandire il cerchio visibile e senza invadere la riga `.msg-footer` sottostante.
  - `.reply-bar-cancel`: `min-width/min-height: 44px`, `display: inline-flex` centrato, compensato con margini negativi per non allargare la `.reply-bar`.
- **Verifica**: `npx tsc --noEmit` ok. Verifica visiva eseguita con harness Playwright (markup reale + `index.css` dal dev server) su desktop/mobile (1280px/390px) ed entrambi i temi: aree di tocco confermate ≥44×44px, nessun overflow. Era stata rilevata una sovrapposizione di ~15px tra l'hit-area di `.msg-reaction-add` e `.msg-reply` nella riga sottostante (un tap sul "+" reazioni poteva attivare "rispondi"); risolta ancorando `::before` al bordo inferiore del bottone reazione invece di centrarlo simmetricamente. Riverificato con `elementFromPoint`: nessun doppio-trigger residuo.
- **Motivazione**: accessibilità motoria/touch (WCAG 2.5.5 / linee guida mobile) — l'app è "mobile-first 420px" e queste azioni compaiono su ogni messaggio.

---

## P1 — Media priorità

### 6. `AuthScreen`: errori di validazione non collegati ai campi (`aria-describedby`)
- **Schermata**: `AuthScreen.tsx`.
- **Problema**: `error && <p className="err">{error}</p>` è renderizzato sotto il form ma non è associato via `aria-describedby` a `email`/`password`/`confirmPassword`. Per uno screen reader, il messaggio d'errore (es. "Le password non coincidono.") non è collegato al campo che l'ha generato.
- **Miglioramento proposto**: dare un `id` al paragrafo di errore (es. `id="auth-error"`) e referenziarlo con `aria-describedby` sui campi pertinenti (o almeno sul form), oltre a `aria-invalid="true"` sul campo in errore quando applicabile.
- **Motivazione**: accessibilità form (WCAG 3.3.1/3.3.3).

### 7. `BurgerMenu`: focus trap e gestione Escape mancanti
- **Componente**: `BurgerMenu.tsx`.
- **Problema**: il pannello `.burger-panel` usa `aria-hidden={!open}` ma quando aperto non intrappola il focus (si può Tab-are dietro l'overlay), non chiude su `Escape`, e alla chiusura il focus non torna al `BurgerMenuButton` che l'ha aperto. Inoltre quando `aria-hidden="true"` il pannello chiuso può ancora contenere elementi focusabili raggiungibili da tastiera (se non `inert`/`tabIndex=-1`), creando un "focus invisibile".
- **Miglioramento proposto**: aggiungere `inert` (o impostare `tabIndex={-1}` su tutti gli item) quando chiuso; gestire `Escape` per chiudere; al primo render dopo apertura spostare il focus sul primo voce di menu o sul pannello stesso; restituire il focus al bottone burger alla chiusura.
- **Motivazione**: accessibilità da tastiera — il burger menu è il principale (unico) meccanismo di navigazione dell'app, presente in ogni schermata post-login.

### 8. Stato vuoto generico/poco guidato in `SearchScreen` quando 0 risultati con filtri
- **Schermata**: `SearchScreen.tsx`.
- **Problema**: il messaggio "Nessun risultato. Forse non ci sono utenti cercabili che corrispondono — prova a cambiare i filtri." è corretto ma non offre un'azione diretta (es. bottone "Modifica filtri" che riapra `showFilters`, o "Pulisci filtri"). L'utente deve scrollare manualmente verso l'alto per ritrovare i filtri (probabilmente collassati, dato `setShowFilters(false)` dopo la ricerca).
- **Miglioramento proposto**: aggiungere un CTA secondario sotto il messaggio di stato vuoto, es. `<button className="btn-secondary" onClick={() => setShowFilters(true)}>Modifica filtri</button>`.
- **Motivazione**: usabilità/recupero errori (Nielsen #5/#9) — evita un vicolo cieco percepito.

### 9. `SearchScreen`: lista filtri molto lunga e priva di gerarchia visiva
- **Schermata**: `SearchScreen.tsx` (tab "Per filtri").
- **Problema**: 9 `fieldset` consecutivi (Età, Regione, Città, Identità, Orientamento, Interessi, Cerco, Fumo, Sport, Segno zodiacale) tutti con lo stesso peso visivo, ognuno con `ChipGroup` potenzialmente molte chip (es. 20 regioni, suggerimenti interessi). Su schermo 420px, scorrere tutto prima di premere "Cerca" è oneroso; nessun indicatore di "quanti filtri attivi" finché non si invia la ricerca.
- **Miglioramento proposto**: 1) raggruppare in sezioni collassabili (accordion) con solo 2-3 sezioni aperte di default (es. Età/Regione/Identità) e le altre chiuse mostranti solo il titolo + eventuale conteggio selezioni; 2) mostrare un badge "N filtri attivi" vicino al pulsante "Cerca" sempre visibile (sticky in fondo), così l'utente capisce lo stato senza scrollare. Riusare `.stats-title`/`.badge` esistenti per coerenza visiva.
- **Motivazione**: usabilità (riconoscimento > ricordo, riduzione carico cognitivo), coerente con il tono "intimo, non opprimente" del brand.

### 10. Mancanza di `prefers-reduced-motion` per transizioni
- **CSS**: `index.css` — `.burger-panel` (`transition: transform 0.25s ease, box-shadow 0.25s ease`), `.toggle-pill`/`.toggle-knob`, `.avatar-opt` (`transform: scale`), `bottomRef.current?.scrollIntoView({ behavior: 'smooth' })` in `ChatScreen`.
- **Problema**: nessuna media query `@media (prefers-reduced-motion: reduce)` per disattivare/ridurre queste animazioni. Per utenti sensibili al movimento, lo scroll automatico "smooth" della chat ad ogni nuovo messaggio può essere fastidioso.
- **Miglioramento proposto**: aggiungere in `index.css` un blocco globale:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
  }
  ```
  e in `ChatScreen` condizionare `behavior: 'smooth'` vs `'auto'` in base a `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
- **Motivazione**: accessibilità (WCAG 2.3.3), basso sforzo per beneficio ampio.

### 11. `RoomsScreen`/`ChatScreen`: stato di errore generico senza azione di retry
- **Schermate**: `RoomsScreen.tsx` (`{error && <p className="err chat-error">{error}</p>}`), `ChatScreen.tsx` (stesso pattern).
- **Problema**: se il caricamento stanze/messaggi fallisce, l'utente vede solo un testo d'errore (con contrasto insufficiente, vedi punto 1), senza un pulsante "Riprova". Vicolo cieco se la connessione torna.
- **Miglioramento proposto**: aggiungere un piccolo `<button className="btn-secondary btn-sm" onClick={retry}>Riprova</button>` accanto al messaggio d'errore, dove `retry` richiama l'hook di fetch (`useRooms`/`useChatMessages` già espongono o possono esporre una funzione di refetch).
- **Motivazione**: error recovery (Nielsen #9) — evita che l'utente debba uscire e rientrare dalla schermata per ritentare.

### 12. Etichette icon-only con solo `title` (no `aria-label`) da verificare in modo sistematico
- **Componenti**: in generale buona copertura (`aria-label` presente su molti pulsanti icona: `pf-icon-btn`, `msg-avatar-btn`, `BurgerMenuButton`, `lightbox-close` manca però `aria-label` — verificare `ProfileGallery.tsx`).
- **Problema**: `lightbox-close` (`✕` nel lightbox foto) e `carousel-report`/`carousel-nav` (in `PhotoCarousel`/`ProfileGallery`) andrebbero verificati uno per uno per assicurare `aria-label` coerente (es. "Chiudi", "Foto precedente", "Foto successiva", "Segnala foto").
- **Miglioramento proposto**: passare in rassegna `ProfileGallery.tsx`, `PhotoUploadDialog.tsx` e aggiungere `aria-label` mancanti sui pulsanti icon-only (azione concreta, scoping limitato).
- **Motivazione**: accessibilità screen reader — pulsanti senza testo visibile né `aria-label` sono annunciati come "button" senza contesto.

### 13. Messaggio "Sostieni Vesper ↗" nel burger apre link esterno senza preavviso
- **Componente**: `Home.tsx` (menuItems), apre `window.open(SUPPORT_URL, '_blank', ...)`.
- **Problema**: `SUPPORT_URL` è ancora un placeholder (`https://www.example.com`, vedi commento `TODO(P30)`) — non bloccante per UX in sé, ma quando sarà sostituito con un link reale, l'apertura in nuova scheda di un dominio esterno (Ko-fi/PayPal) andrebbe segnalata (es. "(si apre in una nuova scheda)" nell'`aria-label`) per orientamento utente.
- **Miglioramento proposto**: aggiungere `aria-label="Sostieni Vesper, si apre in una nuova scheda"` alla voce di menu quando il link reale sarà attivo.
- **Motivazione**: orientamento/prevedibilità (Nielsen #1), basso sforzo.

---

## P2 — Bassa priorità / Polish

### 14. `.link.back` (‹) come unico back affordance — buona ma piccola
- **Componente**: `AppHeader.tsx`.
- **Problema**: `.app-header .link.back` ha `padding: 0.25rem 0.5rem; font-size: 1.5rem` — area cliccabile approssimativamente 24×36px circa, sotto i 44px raccomandati, anche se ha `aria-label`/`title` corretti.
- **Miglioramento proposto**: aumentare il padding verticale/orizzontale o `min-width`/`min-height: 44px` mantenendo l'icona "‹" piccola e centrata.
- **Motivazione**: touch target — è il pulsante "indietro" presente in quasi ogni schermata.

### 15. Onboarding ricerca (`search-onboarding`) e history non persistono visivamente la scelta "Capito"
- **Schermata**: `SearchScreen.tsx`.
- **Problema**: minore — il box di onboarding scompare definitivamente dopo "Capito" (localStorage), corretto, ma non c'è modo di rivederlo (es. da un futuro "Aiuto"). Non bloccante ora, segnalato per coerenza futura con altre spiegazioni in-app.
- **Miglioramento proposto**: nessuna azione immediata; se in futuro si aggiunge una sezione "Guida"/FAQ, includere questi testi.
- **Motivazione**: coerenza/scalabilità futura.

### 16. Stato disabilitato dei bottoni "Manda messaggio" comunica solo via `title`
- **Schermata**: `PublicProfileScreen.tsx`.
- **Problema**: quando `strato < 2`, il bottone "Manda messaggio" è `disabled` con spiegazione solo nel `title` (tooltip, non accessibile su mobile/touch e poco visibile). L'utente su mobile non saprà perché il pulsante è disabilitato.
- **Miglioramento proposto**: aggiungere sotto il bottone un `<p className="hint">` visibile sempre (non solo al hover) con lo stesso testo del `title` ("Per inviare messaggi privati devi essere attiva in chatroom per almeno 7 giorni e aver scritto 20 messaggi"), così il requisito è chiaro anche su touch.
- **Motivazione**: prevenzione errori/orientamento (Nielsen #1, #5) — importante perché è un requisito "nascosto" che genera confusione ("perché non posso scrivere a questa persona?").

### 17. Coerenza terminologica "Esci" usato per due azioni diverse
- **Schermate**: `RoomsScreen.tsx` (bottone "Esci" = lascia una stanza tematica) vs `BurgerMenu.tsx` (voce "Esci" = logout dall'app).
- **Problema**: stesso testo per due azioni di significato molto diverso (una reversibile/leggera, l'altra logout). Rischio di click errato percepito come più grave di quanto sia (lasciare una stanza) o sottovalutato (logout).
- **Miglioramento proposto**: rinominare il bottone di `RoomsScreen` in "Lascia stanza" o "Abbandona", lasciando "Esci" solo per il logout nel burger menu.
- **Motivazione**: coerenza terminologica/prevenzione errori — piccola modifica di label, alto valore di chiarezza.

### 18. `rep-mid` (#e8914e, sistema reputazione staff) molto simile a `--accent` (#E8B14E)
- **Schermata**: `screens/admin/UserReputation.tsx`/`ReputationModeration.tsx` (classi `.rep-low`/`.rep-mid`/`.rep-high`).
- **Problema**: `--accent` (#E8B14E, usato per `.rep-low`) e `#e8914e` (`.rep-mid`) sono percettivamente molto simili (entrambi arancio/oro caldi), mentre `.rep-high` usa `--error` (rosso). Per uno staff member che deve distinguere rapidamente "basso" vs "medio" rischio reputazionale, la differenza cromatica è troppo sottile (specie con daltonismo rosso-verde/protanopia, dove arancio e rosso possono confondersi ulteriormente).
- **Miglioramento proposto**: per `.rep-mid`, scegliere un colore più distinto da `--accent` (es. derivare dal corallo `#EC6A55` di branding.md non ancora wired, che si posizionerebbe visivamente tra oro e rosso-errore in modo più distinguibile) oppure aggiungere un'icona/etichetta testuale ("Basso"/"Medio"/"Alto") oltre al colore — quest'ultimo già presente come `.rep-label`, verificare che sia sempre visibile e non solo color-coded.
- **Motivazione**: accessibilità (non affidarsi solo al colore, WCAG 1.4.1) + coerenza palette, area a basso traffico (solo staff) quindi priorità bassa.

### 19. Messaggi "muted"/`.hint` con opacità 0.55-0.7 su testo informativo importante
- **Schermate**: trasversale — `.hint` (`opacity: 0.55`), `.muted` (`opacity: 0.6`), `.search-aff`, `.pf-label` (`opacity: 0.6`), `.dm-section-title` (`opacity: 0.45`).
- **Problema**: `--text` (#F7EFDD) ha contrasto 15.75:1 su `--bg`, quindi anche al 55% di opacità resta sopra 4.5:1 (≈ 8.7:1, ampiamente sufficiente) — **non è un problema di contrasto numerico**. Tuttavia alcuni di questi testi (es. `.hint` con suggerimenti operativi come "Stanze tematiche: 1/3" o gli hint sotto i bottoni disabilitati di punto 16) trasmettono informazioni funzionali, non solo decorative: vale la pena verificare visivamente che restino leggibili e non vengano percepiti come "disabilitati"/non importanti per via dell'opacità ridotta.
- **Miglioramento proposto**: nessuna modifica numerica necessaria (contrasto ok); solo verifica visiva in browser che `.hint` non sia confuso con testo disattivato quando comunica un vincolo attivo (es. punto 16). Possibile micro-distinzione: usare opacità leggermente più alta (0.7-0.75) per hint "attivi/azionabili" vs 0.55 per hint puramente informativi.
- **Motivazione**: gerarchia visiva/usabilità, verifica da fare con `vesper-tester` o ispezione manuale.

### 20. Verifica manuale richiesta — non eseguibile da codice
- Le seguenti voci richiedono verifica visiva/funzionale in browser (consigliato uso di `/run` o `vesper-tester`):
  - Rendering effettivo dei contrasti corretti dopo eventuali fix (specialmente tema chiaro).
  - Ordine di tabulazione reale su `SearchScreen` (molti campi/fieldset) e `ProfileEditor`.
  - Comportamento dello screen reader su `BurgerMenu` aperto/chiuso e su `ReportDialog`.
  - "Feel" generale delle transizioni (burger panel, lightbox, toggle tema) e percezione di reattività su mobile reale.
  - Verifica che il banner di installazione PWA (`.install-banner`, fixed in basso) non copra contenuti interattivi su schermi piccoli (es. composer chat, bottoni "Cerca").

---

## Riepilogo

| Priorità | N. voci |
|---|---|
| P0 (Alta) | 5 |
| P1 (Media) | 8 |
| P2 (Bassa/polish) | 7 |
| **Totale** | **20** |

Aree più toccate: contrasto colori (palette "Inchiostro & oro" su testo di errore, sia tema scuro che chiaro), gestione focus/tastiera nelle modali e nel burger menu, feedback asincroni privi di `aria-live`, touch target nelle azioni dei messaggi chat.

Nessun file di codice è stato modificato in questo audit.
