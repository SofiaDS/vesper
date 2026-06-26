# Spec — Infrastruttura

Dominio pubblico: **vespercommunity.com** (registrar + DNS su Vercel). Nome app: **Vesper**.

## Email — tool + funzione

| Tool | Funzione (in breve) |
| --- | --- |
| **Brevo (SMTP/API)** | **Invio** email applicative: magic link, conferme, notifiche. Mittente `no-reply@` |
| **Brevo — autenticazione dominio** | Record DKIM/SPF/DMARC su `vespercommunity.com` (fatti in automatico via integrazione Vercel). Serve a far partire le email come dominio nostro, fuori dallo spam. |
| **ImprovMX** (free) | **Ricezione/inoltro**: gli alias `support@`, `privacy@` inoltrano alla casella Gmail personale. Dipende dai record **MX** su Vercel DNS. |
| **Gmail "Invia come" + Brevo SMTP** | **Risposta** apparendo come `support@vespercommunity.com`. SMTP: `smtp-relay.brevo.com:587`, user = login SMTP Brevo, pass = SMTP key. *(Opzionale per gli store.)* |

### Flusso

- **Inviare** (app → utente): Brevo. ✅ dominio già autenticato.
- **Ricevere** (utente → noi): ImprovMX → Gmail personale.
- **Rispondere come support@**: Gmail "Invia come" via Brevo SMTP (richiede ImprovMX già attivo per ricevere il codice di conferma).

### Note / gotcha

- **SPF unico**: un solo record `v=spf1`. Unire gli include, non duplicare: `v=spf1 include:spf.brevo.com include:spf.improvmx.com ~all`.
- **SMTP ≠ ricezione**: Brevo SMTP invia soltanto; per ricevere servono i record MX (ImprovMX).
- **Ordine**: prima ImprovMX (ricezione), poi Gmail "Invia come" (serve il codice di conferma).
- **`privacy@` deve ricevere davvero**: la privacy policy negli store richiede un contatto funzionante.

### TODO email

- [x] ImprovMX: alias `support@`, `privacy@` → Gmail personale (record MX + SPF su Vercel) ✅
- [x] Gmail "Invia come" `support@` via Brevo SMTP ✅ (testato)
- Mittente email applicative: **From `no-reply@vespercommunity.com`, Reply-To `support@`**
  - [x] Helper custom: secret `BREVO_SENDER_EMAIL` → `no-reply@` + `replyTo` aggiunto in `_shared/sendEmail.ts` (NB: helper oggi **non usato** da nessuna function → prep, nessun redeploy)
  - [ ] **Email di login (magic link/conferme) = Supabase Auth, non l'helper.** Configurare SMTP Brevo in **Supabase → Authentication → SMTP Settings** + Sender = `no-reply@vespercommunity.com` / `Vesper`
- [x] `VAPID_SUBJECT` → `mailto:support@vespercommunity.com` ✅ secret Supabase aggiornato (live a runtime, no redeploy) + default allineato in `_shared/push.ts`

> Indirizzi email in uso: **`privacy@`** (temi privacy) e **`support@`** (tutto il resto). Niente `hello@`.

---

## Hosting & backend — tool + funzione

| Tool | Funzione (in breve) |
| --- | --- |
| **Vercel** | Hosting frontend (PWA) + registrar + DNS di `vespercommunity.com`. |
| **Supabase** (`ywkttzzkvlemtsuoceke`) | DB Postgres, auth, RLS, storage, edge function (incl. push). |
| **Web Push (VAPID)** | Notifiche push; subscription in `push_subscriptions`, invio via edge function `_shared/push.ts`. |

### Config dominio (da fare al cambio dominio)

- **Supabase → Authentication → URL Configuration**: Site URL = `https://vespercommunity.com`, Redirect URLs += `https://vespercommunity.com/**`. *(Senza questo i magic link si rompono.)*
- **Vercel**: `vespercommunity.com` come dominio **primario** (il `*.vercel.app` rediriga lì).

## Rilascio Android / Google Play — tool + funzione

| Tool | Funzione (in breve) |
| --- | --- |
| **Bubblewrap** o **PWABuilder** | Genera la TWA e la build firmata **`.aab`** dalla PWA. |
| **Google Play Console** | Account dev (25$ una tantum), listing, upload AAB, moduli policy. |
| **Play App Signing** | Google ri-firma l'app; fornisce il fingerprint SHA-256 finale. |
| **assetlinks.json** (`app/public/.well-known/`) | Collega TWA ↔ dominio; deve contenere il fingerprint di **Play App Signing**. |

### TODO Android

- [ ] Account Google Play Developer
- [ ] Build `.aab` con host `vespercommunity.com`
- [ ] Aggiungere il fingerprint SHA-256 di Play in `assetlinks.json`
- [ ] Asset listing: icona 512, feature graphic 1024×500, screenshot, descrizioni, categoria
- [ ] Moduli: Data Safety, Content Rating, target audience

## Rilascio iOS / App Store — tool + funzione

| Tool | Funzione (in breve) |
| --- | --- |
| **Capacitor** (o pacchetto iOS di **PWABuilder**) | Wrappa la PWA in un progetto Xcode (WKWebView). **Una PWA pura non si pubblica.** |
| **Xcode + Mac** | Build e submit dell'app iOS. **Vincolo: serve macOS.** |
| **Apple Developer Program** | Account (99$/anno). |
| **APNs** | Push su iOS: il web push del wrapper non basta, va integrato APNs (rivedere `usePushNotifications`/`push_subscriptions`). |

### TODO iOS (rimandabile dopo Android)

- [ ] Decidere Capacitor vs PWABuilder
- [ ] Apple Developer Program
- [ ] Push via APNs
- [ ] Verifica guideline 4.2 (minimum functionality) e 1.2 (UGC: report/block/EULA — in parte già presenti)
- [ ] Screenshot per taglia dispositivo, icona, App Privacy label

## Legale — tool + funzione

| Tool | Funzione (in breve) |
| --- | --- |
| **Privacy Policy** (URL pubblico) | Obbligatoria su entrambi gli store; deve indicare contatto `privacy@` funzionante. |
| **Terms / EULA** | Richiesti per app social/UGC (specie iOS guideline 1.2). |
| **Cancellazione account in-app** (`delete-account`) | Richiesta da Apple; già presente. ✅ |

### TODO legale

- [ ] Privacy policy + Terms redatti e ospitati (account, push, Supabase, Brevo, retention, diritti GDPR)
- [ ] Link a privacy/terms in app e nei listing store

## Blocker trasversali

1. ✅ Nome **Vesper** + dominio **vespercommunity.com** (deciso)
2. [ ] Privacy policy + Terms ospitati
3. [ ] iOS push via APNs (lavoro tecnico più grosso)
4. [ ] Mac per build iOS
