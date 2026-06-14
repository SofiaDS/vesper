# Piano restyle UI verso i mockup (app-mockup-dark/light.html)

Obiettivo finale: l'app deve assomigliare ai mockup statici in `mockups/`. Il
restyle CSS "di superficie" (border-radius 8px, badge affinità, bolle chat,
righe DM con avatar, `.pf-section-title`, separatori stat-row, burger item
8px) è **già stato fatto** (giugno 2026). La differenza grossa rimasta è
**architetturale**: i mockup usano un header centrato in oro + una tab bar
in alto con 5 sezioni (Stanze / DM / Ricerca / Profilo / Altro), mentre
l'app oggi usa un burger menu laterale.

Questo file elenca i passi rimanenti in ordine, pensati per essere fatti
**uno alla volta** (ogni passo è una sessione/PR a sé, non tutti insieme).
Per ognuno: cosa fare, file coinvolti, se serve nuova logica/dati o è "solo
frontend".

---

## Step 1 — Header centrato in oro (solo CSS)
- `.app-header h1` → `color: var(--accent-text)`, `text-align: center`,
  `.app-header-center` → `justify-content: center`.
- File: `app/src/index.css` (`.app-header`, `.app-header h1`,
  `.app-header-center`).
- Solo CSS, nessuna nuova logica. Rischio basso: verificare che il back-button
  e il burger a destra non "spingano" il titolo fuori centro su nickname
  lunghi (gestito già da `overflow: hidden; text-overflow: ellipsis`).

## Step 2 — Tab bar di navigazione (Stanze / DM / Ricerca / Profilo / Altro)
Cambio più grande: sostituisce/affianca il burger menu con una tab bar fissa
sotto l'header, come nel mockup (righe ~584-590 di `app-mockup-light.html`).

- Nuovo componente `TabBar` (CSS: `.tabbar`, `.tab`, `.tab.active`,
  `.tab-badge`, `.tab-badge.mention`).
- `Home.tsx`: la logica di stato esiste già (showSearch, showDm, showProfile,
  showAdmin, ecc.) — si tratta di **rimappare** la navigazione su 5 tab
  principali:
  - **Stanze** → stato lobby attuale (room list / chat)
  - **DM** → `showDm` (badge = `pendingDmCount`, già disponibile via
    `usePendingDmCount`)
  - **Ricerca** → `showSearch`
  - **Profilo** → `showProfile`
  - **Altro** → nuovo hub che raccoglie: Impostazioni, Utenti bloccati,
    Legal, e (se staff) Admin — badge = somma di `adminCounts` (già
    disponibile via `useAdminPendingCounts`)
- Il burger menu attuale può restare per le voci che non hanno una tab
  diretta (Impostazioni, Legal, Admin, support links) **dentro il pannello
  "Altro"**, oppure essere sostituito da una lista semplice nello stesso
  stile di `sub-altro-hub` del mockup (righe ~1196-1220).
- **Nessun nuovo dato/logica**: tutti i contatori (DM, Admin) sono già
  calcolati da hook esistenti. È principalmente refactor di navigazione +
  nuovo componente CSS/markup.
- Rischio: è il cambio con superficie più ampia (tocca `Home.tsx` e
  `BurgerMenu.tsx`). Da fare con calma e testare bene tutti i percorsi di
  back-navigation (`useBackNavigation`).

## Step 3 — Hub "Altro" (sostituto leggero del burger menu)
- Nuova schermata `AltroScreen` (o riuso di `BurgerMenu` panel) con le
  sezioni a card del mockup (righe ~1196-1220): "Account & community"
  (Impostazioni, Utenti bloccati, Legal), "Moderazione (staff)" (Admin),
  link supporto.
- Riusa `.card`, `.pf-section-title`, `.link` già esistenti/stilizzati.
- Nessun nuovo dato. Dipende da Step 2.

## Step 4 — Stanze: badge "non letti" / "@menzione" (richiede nuovi dati)
- `.room-card.has-unread` / `.has-mention`, `.unread-pill`, `.mention-pill`
  (mockup righe 336-362).
- **Richiede nuova logica**: per ogni stanza, sapere se l'utente ha
  messaggi non letti e/o è stata menzionata da quando ha letto l'ultima
  volta. Serve uno stato di "ultima lettura per stanza/utente" (nuova
  tabella o colonna in Supabase + hook `useRoomUnread`).
- Da fare **dopo** aver verificato con l'utente se questa feature è
  desiderata (è un pezzo di prodotto a sé, non solo restyle).

## Step 5 — DM: stato "non letto" (richiede nuovi dati)
- `.dm-row.unread-row`, `.dm-avatar.unread-avatar`, `.dm-name.unread`,
  `.dm-time.unread`, `.dm-preview.unread`, pallino "●" prima del nome
  (mockup righe 734-778).
- **Richiede nuova logica**: stato letto/non letto per conversazione DM
  (timestamp ultimo messaggio letto). Oggi `dm_conversations` non ha questo
  campo.
- `presence-dot` (online/offline) richiede anche un sistema di presenza —
  probabilmente fuori scope per ora (nessun realtime presence implementato).

## Step 6 — Profilo: galleria foto a griglia 3 colonne
- Mockup `.pf-gallery` (righe 456-461): grid 3 colonne, ph quadrati con
  border tratteggiato per "+ Aggiungi".
- Oggi `ProfileGallery.tsx` è uno strip orizzontale con lightbox — **diversa
  UX** (scroll vs grid), già scartato una volta come "troppo cambiamento".
- Step a sé: valutare se passare a grid 3 col mantenendo il lightbox al
  click, o lasciare lo strip ma con celle quadrate in stile mockup.
  Solo frontend, ma è un cambio di layout non banale.

## Step 7 — Profilo: icone azione circolari (`.pf-icon-btn`)
- Mockup: pulsanti "Modifica profilo" / "Blocca" / "Segnala" come cerchi
  `.pf-icon-btn` (righe 441-446) in alto a destra (`.pf-icon-actions`),
  invece dei bottoni testuali attuali.
- File: `ProfileLayout.tsx`, `PublicProfileScreen.tsx` + nuove classi CSS
  `.pf-icon-actions`/`.pf-icon-btn`/`.pf-icon-btn.danger`.
- Solo frontend, basso rischio. Attenzione ad accessibilità (aria-label
  sulle icone, touch target ≥44px).

## Step 8 — Ricerca: card risultati come `.user-card` + toggle Lista/Griglia
- Mockup `.user-card` (righe 489-499) e toggle `seg`/`seg.on` "Lista"/
  "Griglia" (righe 958-961) con `.search-cards-grid` (2 colonne).
- Oggi `UserCard.tsx` è già abbastanza simile (`.search-card`); valutare se
  serve solo restyle CSS o anche il toggle vista lista/griglia (nuovo stato
  locale, no nuovi dati).

## Step 9 — Chat: dettagli minori
- `.chat-sender` (nome mittente sopra la bolla, colore accent-text) vs
  attuale `.msg-author` — verificare coerenza stile.
- `.composer-row` sticky bottom — verificare che il composer attuale sia
  già sticky (probabile sia ok).
- Solo CSS, basso rischio.

## Step 10 — Admin: sub-nav a pillole
- `.admin-subnav button` (righe 549-559): pillole con badge rosso per le
  sotto-sezioni admin, invece dell'attuale lista nel burger menu — diventa
  rilevante solo dopo Step 2/3 (quando Admin entra nell'hub "Altro").

## Step 11 — Toast globale (richiede nuova logica)
- `.global-toast` (righe 524-540): notifica in-app per nuovi messaggi/
  menzioni mentre si è in un'altra schermata.
- **Richiede nuovo sistema di notifiche in-app** (stato globale + realtime
  listener cross-screen). Grosso pezzo di prodotto, da valutare a parte —
  probabilmente l'ultimo step e solo se richiesto esplicitamente.

## Step 12 — Auth/onboarding: dettagli `.brand`
- `.brand h1` color `var(--accent-text)`, letter-spacing — verificare
  `AuthScreen.tsx` sia già allineato (probabile, da controllare).
- Solo CSS, basso rischio.

---

## Note generali
- Ogni step va verificato in **dark e light theme**.
- Gli step 4, 5, 11 richiedono nuova logica/dati (Supabase) e vanno
  discussi a parte prima di partire — non sono "solo restyle".
- Gli step 1, 6, 7, 8, 9, 10, 12 sono principalmente CSS/markup, a basso
  rischio, e possono procedere uno alla volta.
- Lo step 2 (tab bar) è il prerequisito visivo più importante per "sembrare"
  il mockup, ma è anche il più invasivo (`Home.tsx`) — da fare con calma e
  test manuale completo di tutta la navigazione.
- **Test**: niente login/signup reali nei test automatici (vedi nota
  memoria "no-live-auth-testing") — verifica visiva manuale da parte
  dell'utente con le proprie credenziali, oppure review statica del codice.
