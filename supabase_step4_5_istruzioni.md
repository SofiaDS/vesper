# Istruzioni Supabase — Step 4 & 5 (badge "non letti")

Queste sono le modifiche da applicare al **tuo** progetto Supabase per far
funzionare i badge dei messaggi non letti nelle Stanze (Step 4) e nei DM
(Step 5). Finché non le applichi, l'app **funziona lo stesso** (i badge
semplicemente non compaiono: il codice client ignora silenziosamente l'assenza
delle nuove funzioni).

## Cosa aggiunge

- Una tabella `read_markers` (una riga per utente + conversazione) che ricorda
  fino a quando hai letto ogni stanza/DM.
- Tre funzioni RPC: `mark_read(...)` (segna come letto) e
  `room_unread_counts()` / `dm_unread_counts()` (calcolano i non letti).
- Un trigger che, quando entri in una stanza (inclusa la foyer al signup),
  parte "tutto letto" — così i non letti contano solo i messaggi successivi al
  tuo ingresso, non l'intera storia della stanza.
- Un **backfill** una-tantum: al momento dell'applicazione, tutte le utenti e
  conversazioni esistenti vengono segnate come "lette adesso" (nessun badge
  enorme sulla cronologia pregressa). Da quel momento i conteggi ripartono.
- Niente colonne nuove su tabelle esistenti, nessun dato sensibile esposto: le
  funzioni filtrano sempre su `auth.uid()` (vedi te stessa).

## Come applicarle

Hai due strade, scegline una.

### Opzione A — Supabase CLI (consigliata)

Il file di migrazione è già nel repo:
`supabase/migrations/20260622000000_read_markers.sql`

Dalla cartella del progetto:

```bash
supabase db push
```

(applica le migrazioni non ancora presenti sul progetto remoto collegato).

### Opzione B — Dashboard (SQL Editor)

1. Vai su **Supabase Dashboard → SQL Editor → New query**.
2. Copia e incolla **tutto** il contenuto del file
   `supabase/migrations/20260622000000_read_markers.sql`.
3. **Run**.

Lo script crea tabella + policy + 3 funzioni. È sicuro su tabelle esistenti
(non tocca dati). Se lo riesegui dà errore su `create table ... read_markers`
perché esiste già: in quel caso va bene, vuol dire che è già applicato.

## Come verificare che sia andata

Nel **SQL Editor**, esegui (da utente loggato/`authenticated` non serve; basta
controllare che gli oggetti esistano):

```sql
-- la tabella esiste?
select * from public.read_markers limit 1;          -- 0 righe va benissimo

-- le funzioni esistono?
select proname from pg_proc
where proname in ('mark_read', 'room_unread_counts', 'dm_unread_counts',
                  'seed_room_read_marker');
-- devi vedere le 4 righe

-- il backfill ha segnato come letto l'esistente?
select scope, count(*) from public.read_markers group by scope;
-- ti aspetti righe 'room' (≈ membership totali) e 'dm' (≈ conversazioni
-- accettate × 2 partecipanti)
```

Poi, nell'app: entra in una stanza con un secondo account che scrive, torna alla
lista Stanze → dovresti vedere il **pallino/contatore** sulla stanza; riaprila e
torna indietro → il badge sparisce (l'hai letta). Stessa cosa per i DM.

## Note tecniche (per quando ci ripenso)

- I non letti si calcolano confrontando `messages.created_at` /
  `dm_messages.created_at` con `read_markers.last_read_at`. Se non hai mai letto
  (nessun marker) contano tutti i messaggi non tuoi.
- `room_unread_counts()` rileva anche le **menzioni** (`@tuonick`) con la stessa
  regola del client (`MentionText`): badge "menzione" oltre al contatore.
- `mark_read('room', <chatroom_id>)` viene chiamato dal client quando apri/esci
  da una chat; `mark_read('dm', <conversation_id>)` quando apri/esci da un DM.
- Le funzioni sono `security definer` ma sicure: ogni query è vincolata a
  `auth.uid()`, quindi un'utente vede solo i propri conteggi.

---

## Presenza online (Step 5 — pallino "online")

**Seconda migration**, separata, per l'indicatore "online" nei DM:
`supabase/migrations/20260623000000_user_presence.sql`. Applicala allo **stesso
modo** (CLI `supabase db push`, oppure incolla il file nell'SQL Editor e Run).
Anche questa è opzionale: senza, semplicemente non compaiono i pallini verdi.

### Cosa aggiunge (presenza)

- Tabella `user_presence` (una riga per utente, `last_seen_at`).
- RPC `touch_last_seen()` — "heartbeat": il client la chiama ogni ~60s mentre la
  scheda è in primo piano per dire "sono attiva adesso".
- RPC `users_online(ids)` — dato un elenco di utenti, restituisce **solo** quelli
  online (last_seen negli ultimi 150s) **e** con `show_online = true`.

### Perché una tabella separata (privacy)

`profiles` è leggibile da chiunque (`profiles_select_authenticated USING (true)`),
quindi mettere `last_seen` lì lo esporrebbe **anche per chi ha disattivato**
`show_online`. Nella tabella `user_presence` ogni riga è leggibile **solo** dalla
diretta interessata; la presenza altrui passa **esclusivamente** da
`users_online()`, che filtra su `show_online` e **non** restituisce mai
l'orario grezzo (solo "online sì/no"). Verificato in review backend.

### Come verificare (presenza)

```sql
-- tabella + funzioni esistono?
select * from public.user_presence limit 1;            -- 0 righe va bene
select proname from pg_proc
where proname in ('touch_last_seen', 'users_online');  -- 2 righe
```

Nell'app (due account, B con `show_online` attivo): apri i DM con A → accanto
all'avatar di B compare il **pallino verde** se B ha l'app aperta in primo piano;
chiudi/min­imizza B e dopo ~2-3 min il pallino sparisce. Se B disattiva
"mostra online" nelle impostazioni, A non deve più vederlo online.
