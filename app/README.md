# Vesper — app (PWA)

Frontend dell'app Vesper: **PWA in React + Vite + TypeScript**.
Backend: **Supabase** (vedi `../stack_tecnico.md`).

Questa è la base della **Fase 0** (setup ambiente): un'app minimale che verifica
la connessione a Supabase. Per metterla in piedi sulla tua macchina segui
[`SETUP.md`](./SETUP.md).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm install` | installa le dipendenze (una volta) |
| `npm run dev` | avvia il server di sviluppo con hot-reload su http://localhost:5173 |
| `npm run build` | crea la build di produzione in `dist/` |
| `npm run preview` | serve localmente la build di produzione |
| `npm run lint` | controllo qualità codice (ESLint) |

## Struttura

```
app/
├─ index.html              # entry HTML, link al manifest PWA
├─ public/
│  ├─ manifest.webmanifest # metadati PWA (nome, colori, icone)
│  └─ icon.svg             # icona placeholder (palette Inchiostro & oro)
├─ src/
│  ├─ main.tsx             # bootstrap React
│  ├─ App.tsx              # schermata di test connessione Supabase
│  ├─ index.css            # stili + variabili palette
│  └─ lib/
│     └─ supabase.ts       # client Supabase (legge le env VITE_*)
├─ .env.example            # template variabili d'ambiente
└─ ...config (vite, tsconfig, eslint)
```

## Variabili d'ambiente

Crea `.env.local` (NON committarlo) copiando `.env.example` e incolla i valori
dal tuo progetto Supabase (Dashboard → Project Settings → API):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

La `anon key` è pensata per stare nel client: la sicurezza dei dati è garantita
dalle **Row Level Security policy** lato database, che imposteremo più avanti.
