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

## STATO (aggiornato 22 giu 2026)
- ✅ **Fatti**: Step 1 (header oro), Step 2 (TabBar), Step 3 (hub Altro),
  Step 7 (`.pf-icon-btn`), Step 8 (toggle ricerca + `.search-cards-grid`),
  Step 9 (`.msg-author` → stile `.chat-sender`), Step 10 (`.admin-subnav`),
  Step 12 (`.brand`), Step 6 (galleria a griglia 3 col),
  Step 11 (toast globale notifiche), Step 4 (badge non letti/menzione stanze),
  Step 5 (DM non letti — esclusa la presenza online, vedi sotto).
- ⏳ **Pendente solo l'apply Supabase**: Step 4/5 richiedono la migration
  `read_markers` (vedi `supabase_step4_5_istruzioni.md`); il client è già
  pronto e tollera l'assenza della migration (nessun badge finché non applicata).
- 🛑 **Non fatto (fuori scope, niente sistema di presenza)**: il `presence-dot`
  online/offline dello Step 5.

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

## Step 4 — Stanze: badge "non letti" / "@menzione" ✅ FATTO (22 giu 2026, serve apply Supabase)
> Migration `read_markers` + RPC `room_unread_counts()`/`mark_read()` + trigger
> di seed all'ingresso stanza + backfill (vedi `supabase_step4_5_istruzioni.md`).
> Client: `lib/reads.ts`, `hooks/useUnreadCounts.ts` (`useRoomUnread`),
> `RoomsScreen.tsx` (classi `has-unread`/`has-mention`, `.unread-pill`,
> `.mention-pill`), `ChatScreen.tsx` (`markRead` entrando/uscendo).

- `.room-card.has-unread` / `.has-mention`, `.unread-pill`, `.mention-pill`
  (mockup righe 336-362).
- **Richiede nuova logica**: per ogni stanza, sapere se l'utente ha
  messaggi non letti e/o è stata menzionata da quando ha letto l'ultima
  volta. Serve uno stato di "ultima lettura per stanza/utente" (nuova
  tabella o colonna in Supabase + hook `useRoomUnread`).
- Da fare **dopo** aver verificato con l'utente se questa feature è
  desiderata (è un pezzo di prodotto a sé, non solo restyle).

## Step 5 — DM: stato "non letto" ✅ FATTO (parte unread; presenza no) (22 giu 2026, serve apply Supabase)
> Stessa migration `read_markers` + RPC `dm_unread_counts()`. Client:
> `useDmUnread` + `DmScreen.tsx` (riga `.dm-conv.has-unread`, pallino `●`,
> nome in grassetto, `.unread-pill`); `markRead('dm', …)` aprendo/uscendo dalla
> conversazione. **Escluso** il `presence-dot` online/offline (manca un sistema
> di presenza realtime — fuori scope, da valutare a parte).

- `.dm-row.unread-row`, `.dm-avatar.unread-avatar`, `.dm-name.unread`,
  `.dm-time.unread`, `.dm-preview.unread`, pallino "●" prima del nome
  (mockup righe 734-778).
- **Richiede nuova logica**: stato letto/non letto per conversazione DM
  (timestamp ultimo messaggio letto). Oggi `dm_conversations` non ha questo
  campo.
- `presence-dot` (online/offline) richiede anche un sistema di presenza —
  probabilmente fuori scope per ora (nessun realtime presence implementato).

## Step 6 — Profilo: galleria foto a griglia 3 colonne ✅ FATTO (22 giu 2026)
> `ProfileGallery.tsx` ora usa `.gallery-strip` come grid 3 col (celle quadrate
> `aspect-ratio:1`, radius 8px come mockup `.pf-gallery`), mantenendo il
> lightbox al click. La cella tratteggiata "+ Aggiungi" del mockup non serve:
> l'upload foto è gestito altrove (`PhotoUploadDialog`/editor profilo).

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

## Step 9 — Chat: dettagli minori ✅ FATTO (22 giu 2026)
- `.chat-sender` (nome mittente sopra la bolla, colore accent-text) vs
  attuale `.msg-author` — verificare coerenza stile.
- `.composer-row` sticky bottom — verificare che il composer attuale sia
  già sticky (probabile sia ok).
- Solo CSS, basso rischio.

## Step 10 — Admin: sub-nav a pillole ✅ FATTO (22 giu 2026)
> Era anche un **bug**: rimosso il burger menu (Step 2), il pannello Admin
> non aveva più modo di cambiare sezione (restava bloccato su "Statistiche").
> Risolto con `.admin-subnav` (pillole + badge rossi) in `AdminScreen.tsx`,
> conteggi riusati da `useAdminPendingCounts` passati da `Home.tsx`.

- `.admin-subnav button` (righe 549-559): pillole con badge rosso per le
  sotto-sezioni admin, invece dell'attuale lista nel burger menu — diventa
  rilevante solo dopo Step 2/3 (quando Admin entra nell'hub "Altro").

## Step 11 — Toast globale ✅ FATTO (22 giu 2026)
> Implementato **senza modifiche a Supabase**: `messages` e `dm_messages` sono
> già nella publication realtime e protette da RLS (`messages_select_member` =
> `is_member`; `dm_messages` select = partecipante), quindi una sottoscrizione
> `postgres_changes` senza filtro consegna solo le righe leggibili dall'utente.
> - `hooks/useMessageNotifications.ts`: listener realtime cross-screen (riusa
>   `useChatCache` per nickname + bloccati). Sopprime i messaggi della stanza
>   che stai leggendo e i DM mentre la sezione Messaggi è aperta; rileva le
>   menzioni `@mionick`; auto-dismiss 6s.
> - `components/GlobalToast.tsx` + `.global-toast` in `index.css` (port del
>   mockup, `--surface-2`→`--surface`, fixed bottom, reduced-motion, a11y).
> - Wire in `Home.tsx`: al click apre la stanza / la sezione DM.
> - ⚠️ **Da verificare lato tuo**: che Realtime applichi davvero la RLS sui
>   `postgres_changes` nel progetto (comportamento standard con RLS attiva, ma
>   confermalo — è ciò che impedisce a un utente di ricevere messaggi di stanze
>   di cui non è membro). Vedi nota in fondo.

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
