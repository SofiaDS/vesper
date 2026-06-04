# supabase/ — schema e configurazione del database

Schema del database Vesper su Supabase (PostgreSQL, regione Francoforte).
Le migration sono SQL versionabili in `migrations/`.

## Cosa contiene la Fase 1

`migrations/20260604120000_fase1_schema.sql` crea le tabelle essenziali dell'MVP:

| Tabella | Ruolo |
|---|---|
| `profiles` | profilo utente (1:1 con `auth.users`), avatar-only in v1, `is_searchable` opt-in (privacy by default), `strato` 1..3 |
| `chatrooms` | stanze di chat: 1 `foyer` (unica, obbligatoria) + `tematica` |
| `chat_membership` | appartenenza utente↔chatroom; tetto **1 Foyer + max 3 tematiche** |
| `messages` | messaggi di chat, con Realtime attivo |

`migrations/20260604130000_harden_function_grants.sql` restringe i privilegi
EXECUTE sulle SECURITY DEFINER function: i trigger function non sono più
chiamabili via REST RPC e `is_member()` resta eseguibile solo da `authenticated`
(serve alle policy RLS). Azzera 7 degli 8 warning di sicurezza; l'unico residuo
su `is_member` per `authenticated` è atteso e a basso rischio (rivela solo
l'appartenenza del chiamante stesso).

Logica lato DB:
- **Tetto 3 tematiche** e **Foyer non abbandonabile** via trigger.
- **Auto-iscrizione alla Foyer** alla creazione del profilo.
- **Row Level Security** attiva su tutte le tabelle: si leggono/scrivono i messaggi
  solo nelle chatroom di cui si è membri; ognuno scrive solo il proprio profilo
  e le proprie appartenenze.

`seed.sql` inserisce le 4 chatroom di lancio: la Foyer globale + le 3 tematiche
**Wander** (viaggi & eventi), **Pulse** (fitness/sport), **Cult** (arte/cultura),
ognuna con la sua descrizione mostrata sotto al titolo nella UI.

## Cosa è RINVIATO (non in Fase 1)

- `blocks` e filtraggio liste/messaggi per block list (block.md sez. 6) → schema completo successivo.
- Reputazione (reputazione.md), verifica identità/liveness e automazione Strati (permessi_e_strati.md).
- Segno zodiacale derivato da `birth_date` (profilo_utente.md) → calcolo lato app o colonna generata in seguito.
- Vincolo 18+ a livello DB → ora applicato in onboarding (minori_e_eta.md).

## Stato

Schema Fase 1 e hardening **già applicati** al progetto `vesper` (eu-central-1),
con le 3 chatroom seedate. Verificato con `get_advisors` (security).

## Come applicare le modifiche

Per modifiche future hai due strade:
1. **Supabase CLI** (consigliato a regime): `supabase db push` applica le migration in `migrations/`.
2. **SQL Editor**: incollare il contenuto del file ed eseguirlo.

Convenzione nomi file: `<YYYYMMDDHHMMSS>_descrizione.sql`.
