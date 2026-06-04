# Fase 0 — Setup ambiente (guida passo-passo)

Obiettivo: avere l'app Vesper che gira sul tuo computer, connessa a un progetto
Supabase, e pubblicata online a un URL condivisibile con l'altra founder — con
**aggiornamento automatico a ogni `git push`**.

Tempo stimato: ~1-2 ore la prima volta. Spunta le caselle man mano.

---

## 1. Strumenti sul tuo computer (Windows)

- [ ] **Node.js LTS** (versione 20 o 22) — https://nodejs.org → verifica con `node -v` in Git Bash.
- [ ] **Git** (probabilmente già installato, usi Git Bash) — `git --version`.
- [ ] **VS Code** — estensioni consigliate: ESLint, Prettier, GitLens, e l'estensione ufficiale **Supabase**.
- [ ] Account **GitHub** (ce l'hai già).

## 2. Crea il progetto Supabase

- [ ] Vai su https://supabase.com → **New project**.
- [ ] **Region: Frankfurt (eu-central-1)** ← importante per il GDPR (vedi `stack_tecnico.md`).
- [ ] Scegli un nome (es. `vesper-dev`) e salva la password del database in un posto sicuro.
- [ ] A progetto creato: **Project Settings → API**. Copia:
  - **Project URL** → andrà in `VITE_SUPABASE_URL`
  - **anon public key** → andrà in `VITE_SUPABASE_ANON_KEY`

## 3. Avvia l'app in locale

Dalla cartella `app/` in Git Bash:

- [ ] `cp .env.example .env.local`
- [ ] Apri `.env.local` e incolla URL e anon key del passo 2.
- [ ] `npm install`
- [ ] `npm run dev`
- [ ] Apri **http://localhost:5173** nel browser.

Dovresti vedere la schermata "Vesper · Fase 0" con:
- **"Connessione OK — lo schema del DB non è ancora stato creato"** → perfetto, è lo stato atteso adesso.
- Se vedi "Variabili d'ambiente mancanti" → controlla `.env.local` e riavvia `npm run dev`.

### Prova l'hot-reload
- [ ] Con `npm run dev` attivo, modifica un testo in `src/App.tsx` e salva: la pagina cambia da sola. Questo è il loop di sviluppo veloce che volevi.

### (Facoltativo) verifica la tabella di prova
Nel Supabase Dashboard → **SQL Editor**, esegui:
```sql
create table pingtest (id bigint primary key generated always as identity);
```
Ricarica l'app: ora il messaggio diventa "La tabella di prova esiste". Poi puoi
cancellarla — lo schema vero lo progetteremo insieme nel prossimo step.

## 4. Metti il codice su GitHub (modello monorepo)

`app/` è una **sottocartella** del repo già esistente (docs + codice insieme):
NON fare `git init` dentro `app/`, committi dalla **radice** del repo.

Dalla cartella radice del progetto (quella con i `.md` e dentro `app/`), in Git Bash:

- [ ] (se hai rinominato il repo su GitHub) aggiorna il remote:
  `git remote set-url origin https://github.com/SofiaDS/vesper.git`
- [ ] `git add .`
- [ ] `git commit -m "Fase 0: scaffold PWA + test connessione Supabase; aggiorno doc"`
- [ ] `git push`

> Nota: `app/.gitignore` esclude `node_modules`, `dist` e `.env.local`, quindi le
> dipendenze pesanti e le tue chiavi NON finiscono su GitHub. Giusto così.

## 5. Deploy automatico su Vercel (ogni push → online)

- [ ] Vai su https://vercel.com → accedi con GitHub → **Add New → Project** → importa il repo `vesper`.
- [ ] **Root Directory: `app`** ← fondamentale nel monorepo: dice a Vercel di buildare solo la sottocartella dell'app, ignorando i `.md`.
- [ ] Framework preset: **Vite** (rilevato in automatico). Build: `npm run build`, Output: `dist`.
- [ ] In **Environment Variables** aggiungi `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (gli stessi del `.env.local`).
- [ ] **Deploy**. Ottieni un URL tipo `https://vesper.vercel.app`.
- [ ] D'ora in poi **ogni `git push` su `main` ripubblica l'app automaticamente** in ~30s.

## 6. Condividi con l'altra founder

- [ ] Mandale **solo il link** Vercel. Lei lo apre nel browser del telefono.
- [ ] (Opzionale) Su iPhone: Safari → Condividi → "Aggiungi a schermata Home"; su Android: menu → "Installa app". Diventa un'icona come un'app vera — senza store, senza installazioni complicate.

---

## Fatto? Prossimo step

Quando l'app gira in locale **e** online, siamo pronti per progettare lo
**schema del database** (tabelle `users`/`profiles`, `chatrooms`,
`chat_membership`, `messages`, `blocks`) come migration SQL versionabili.
Dimmelo e partiamo da lì.
