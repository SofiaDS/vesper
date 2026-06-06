# Cleanup schedulato — GDPR e manutenzione DB

Documentazione del job di cleanup mensile automatico. Descrive cosa viene pulito,
perché, con quale cadenza, e dove si trova il codice.

Ultimo aggiornamento: 6 giugno 2026

---

## Indice

1. Panoramica
2. Cosa viene pulito e perché
3. Architettura tecnica
4. Configurazione e deploy

Vedi anche:
- [`gdpr_e_legale.md`](./gdpr_e_legale.md) per il quadro legale generale sulla retention
- [`reputazione.md`](./reputazione.md) per la logica degli eventi di reputazione (§5.2)
- [`permessi_e_strati.md`](./permessi_e_strati.md) per il sistema di vouching

---

## 1. Panoramica

Il cleanup mensile è composto da due job `pg_cron` distinti che girano il 1° di ogni
mese, e da un'Edge Function Supabase per la parte che richiede accesso allo Storage.

| Job | Orario (UTC) | Cosa fa |
|---|---|---|
| `vesper-gdpr-db` | 03:00 | Cleanup DB puro — chiama `run_gdpr_cleanup()` |
| `vesper-gdpr-storage` | 03:30 | Cleanup Storage — invoca l'Edge Function via `pg_net` |

---

## 2. Cosa viene pulito e perché

### 2.1 `reputation_events` più vecchi di 12 mesi → DELETE

**Cosa**: righe nella tabella `reputation_events` con `created_at < now() - 12 months`.

**Perché**: gli eventi di reputazione (warning, mute confermati) restano visibili ai
moderatori per ~12 mesi così possono vedere i pattern di comportamento di un utente
nel tempo, non solo il punteggio corrente (reputazione.md §5.2). Dopo 12 mesi
vengono eliminati per GDPR: i log di moderazione non vanno conservati
indefinitamente (gdpr_e_legale.md §2 — "Log moderazione e segnalazioni").

**Cadenza**: mensile è sufficiente — la finestra di retention è 12 mesi, un ritardo
di qualche settimana è irrilevante.

**Questo è il cleanup più importante** del job.

---

### 2.2 `vouch_requests` scadute → UPDATE `status = 'expired'`

**Cosa**: righe in `vouch_requests` con `status = 'pending'` e `expires_at < now()`.

**Perché**: quando una nuova utente chiede a due garanti (Strato 3) di garantire per
lei per saltare lo Strato 1, la richiesta scade dopo 48 ore se i garanti non
rispondono. Il controllo di scadenza esiste già lato client (nell'RPC
`respond_to_vouch`), ma questo cleanup normalizza lo stato sul DB per coerenza,
evitando righe `pending` che nella realtà sono già scadute.

**Cadenza**: mensile è approssimativa (le richieste scadono dopo 48 ore ma vengono
marcate sul DB solo una volta al mese). Non è critico: la scadenza è già applicata
a runtime dall'RPC.

---

### 2.3 Video di verifica identità → DELETE da Storage + null su `profiles`

**Cosa**: file nel bucket `identity-verifications` per profili con
`verification_status IN ('approved', 'rejected')` e `verification_decided_at`
più vecchio di 30 giorni. Dopo la rimozione, `verification_video_path` viene
azzerato su `profiles`.

**Perché**: il video selfie di verifica è un **dato biometrico** (GDPR art. 9 —
categoria speciale). Una volta che la verifica è stata approvata o rifiutata, il
video non ha più scopo e va cancellato nel minor tempo possibile.
La retention massima scelta è 30 giorni dalla decisione, sufficiente a gestire
eventuali richieste di revisione prima della cancellazione definitiva
(gdpr_e_legale.md §2 — "Video di verifica liveness").

**Questo è il cleanup legalmente più sensibile** del job.

**Note implementative**:
- La colonna `verification_decided_at` viene settata dagli RPC `approve_verification`
  e `reject_verification` (migration `20260607020000_verification_decided_at.sql`).
  Profili verificati prima di questa migration hanno `verification_decided_at = null`
  e non vengono toccati dal cleanup finché non si ri-verificano.
- Se la rimozione dallo Storage fallisce, `verification_video_path` non viene
  azzerato (fail-safe: meglio un path orfano che un path che punta al nulla).

---

## 3. Architettura tecnica

```
pg_cron: vesper-gdpr-db (1° mese 03:00)
  └── select public.run_gdpr_cleanup()
        ├── DELETE reputation_events (> 12 mesi)
        └── UPDATE vouch_requests → 'expired'

pg_cron: vesper-gdpr-storage (1° mese 03:30)
  └── pg_net.http_post → Edge Function decay-expired-events
        ├── supabase.rpc('run_gdpr_cleanup')   ← ridondante ma idempotente
        └── Storage.remove(paths) + UPDATE profiles.verification_video_path = null
```

**File rilevanti**:

| File | Contenuto |
|---|---|
| `supabase/migrations/20260607000000_decay_rpc.sql` | RPC `run_gdpr_cleanup()` |
| `supabase/migrations/20260607010000_gdpr_cron.sql` | Creazione job pg_cron |
| `supabase/migrations/20260607020000_verification_decided_at.sql` | Colonna `verification_decided_at` + RPCs aggiornati |
| `supabase/functions/decay-expired-events/index.ts` | Edge Function (Storage cleanup) |

---

## 4. Configurazione e deploy

### 4.1 Prerequisiti
- Estensione `pg_cron` abilitata (Database → Extensions → pg_cron)
- Edge Function `decay-expired-events` deployata

### 4.2 Job Storage — variabili necessarie
Il job `vesper-gdpr-storage` usa le variabili `app.edge_fn_url` e
`app.service_role_key`. Non possono essere impostate via SQL Editor (permessi
insufficienti): vanno configurate tramite il Supabase Dashboard →
**Cron → vesper-gdpr-storage** direttamente come job di tipo Edge Function,
oppure aggiornando il job con i valori hardcoded se si usa il SQL Editor avanzato.

### 4.3 Verificare i job attivi
```sql
select jobname, schedule, active from cron.job order by jobname;
```

### 4.4 Forzare un'esecuzione manuale (test o emergenza)
```sql
-- Solo DB
select public.run_gdpr_cleanup();

-- Verifica quanti video andrebbero puliti
select count(*) from profiles
where verification_status in ('approved', 'rejected')
  and verification_video_path is not null
  and verification_decided_at < now() - interval '30 days';
```
