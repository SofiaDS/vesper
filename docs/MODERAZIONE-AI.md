# Moderazione AI: proposta di miglioramento

Solo proposta, niente applicato. Va scritta e provata prima su dev.
È la "Settimana 2" di [PIANO-LANCIO.md](PIANO-LANCIO.md).

Codice attuale:
- `supabase/functions/moderate-message/index.ts`
- `supabase/functions/_shared/blocklist.ts`
- `supabase/functions/_shared/openaiModeration.ts`

## Com'è oggi

- **Soft mode**: niente viene bloccato. Il messaggio viene segnato
  `flagged_by_ai = true` e finisce nella coda AiFlags.
- **Blocklist**: 6 frasi, cercate nel testo in minuscolo così come sono scritte.
- **OpenAI** (`omni-moderation-latest`): si usa solo il sì/no `flagged`.
- **In prod** (29 ott): 2 messaggi segnalati su circa 730 (311 in chat, 416 DM).

## Problemi

1. **Lista troppo corta e facile da aggirare.** `fr0cio`, `f.r.o.c.i.o`,
   `frociooo` e `di m3rda` passano. Mancano insulti misogini e transfobici e le
   minacce.
2. **Di OpenAI si usa solo il sì/no.** Il motivo si perde e la soglia non si
   può regolare. OpenAI tende a segnalare come "sexual" conversazioni
   consensuali tra persone adulte queer, mentre spesso non vede l'odio in
   italiano detto "educatamente" (retorica TERF).
3. **Rischi non coperti:** minori che dicono la loro età, outing e doxxing,
   spam e truffe, autolesionismo.
4. **Errori invisibili.** Se OpenAI non risponde o manca la chiave, il
   messaggio passa come pulito. Manca anche un timeout (il webhook ha 5
   secondi).
5. **Nickname e bio** non vengono moderati.

---

## 1. Salvare motivo e priorità

```sql
alter table public.messages
  add column ai_flag_reason text,
  add column ai_flag_priority smallint;
alter table public.dm_messages
  add column ai_flag_reason text,
  add column ai_flag_priority smallint;
-- priority: 1 = urgente (minori, minacce, autolesionismo), 2 = normale
```

In AiFlags comparirebbe un'etichetta tipo "🔴 minori · regola età" oppure
"🟡 odio · OpenAI 0.72", con i messaggi a priorità 1 in cima.

## 2. Normalizzare il testo

```ts
export function normalize(t: string): string {
  const leet: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '@': 'a', '$': 's' }
  return t.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // è → e
    .replace(/[0134@$]/g, (c) => leet[c])                // fr0cio → frocio
    .replace(/(\w)[.\-_*]+(?=\w)/g, '$1')               // f.r.o.c.i.o → frocio
    .replace(/(\w)\1{2,}/g, '$1')                       // frociooo → frocio
}
```

Attenzione: la regola sui numeri va applicata **solo** alla lista di parole,
non alle regole su età e telefono (sotto), che lavorano sul testo originale in
minuscolo.

## 3. Regole italiane per categoria

```ts
type Rule = { reason: string; priority: 1 | 2; re: RegExp; normalized?: boolean }

export const RULES: Rule[] = [
  // Minori: sempre urgente
  { reason: 'minori', priority: 1,
    re: /\b(ho|sono una? di|compio)\s*(1[0-7]|dieci|undici|dodici|tredici|quattordici|quindici|sedici|diciassette)\s*anni\b|\bsono minorenne\b|\b(prima|seconda|terza) media\b/ },
  // Minacce e outing
  { reason: 'minaccia/outing', priority: 1, normalized: true,
    re: /\b(ti ammazzo|ti trovo|so dove (abiti|vivi|lavori)|lo dico a (tutti|tua madre|i tuoi)|ti faccio fare outing)\b/ },
  // Autolesionismo: si segnala per dare supporto, non per punire
  { reason: 'autolesionismo', priority: 1, normalized: true,
    re: /\b(voglio morire|mi ammazzo|farla finita|non voglio piu vivere|mi taglio)\b/ },
  // Odio "educato" che OpenAI in italiano spesso non vede
  { reason: 'odio', priority: 2, normalized: true,
    re: /\b(le trans non sono donne|uom[oi] travestit[oi]|malattia mentale|contro natura)\b/ },
  // Spam e truffe
  { reason: 'spam', priority: 2,
    re: /(t\.me\/|wa\.me\/|onlyfans|telegram|crypto|bitcoin|guadagna da casa)/ },
  // Dati personali (telefono, email)
  { reason: 'dati personali', priority: 2,
    re: /(\+39\s?)?3\d{2}[\s.]?\d{6,7}|[\w.]+@[\w.]+\.\w{2,}/ },
]
```

La lista di insulti va ampliata insieme a chi modera. I termini riappropriati
usati da soli ("frocia", "lesbica") restano fuori, come già scritto in
`blocklist.ts`. Le frasi qui sopra sono un punto di partenza: vanno provate
contro i falsi positivi (per esempio "malattia mentale" in una conversazione
di supporto).

## 4. OpenAI con soglie per categoria

```ts
const THRESHOLDS: Record<string, { min: number; priority: 1 | 2 }> = {
  'sexual/minors':          { min: 0.10, priority: 1 },  // basta un sospetto
  'self-harm':              { min: 0.40, priority: 1 },
  'self-harm/intent':       { min: 0.30, priority: 1 },
  'harassment/threatening': { min: 0.40, priority: 1 },
  'hate/threatening':       { min: 0.40, priority: 1 },
  'violence':               { min: 0.60, priority: 2 },
  'hate':                   { min: 0.50, priority: 2 },
  'harassment':             { min: 0.60, priority: 2 },
}
// 'sexual': ignorato nei DM (persone adulte, consensuale);
//           nelle chat pubbliche solo sopra 0.85.

export async function checkOpenAi(text: string, table: string) {
  const res = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'omni-moderation-latest', input: text }),
    signal: AbortSignal.timeout(3000),
  })
  if (!res.ok) return { reason: 'ai_non_disponibile', priority: 2 as const }

  const scores: Record<string, number> = (await res.json()).results?.[0]?.category_scores ?? {}
  const rules = { ...THRESHOLDS }
  if (table === 'messages') rules['sexual'] = { min: 0.85, priority: 2 }

  let best: { reason: string; priority: 1 | 2 } | null = null
  for (const [cat, { min, priority }] of Object.entries(rules)) {
    const s = scores[cat] ?? 0
    if (s >= min && (!best || priority < best.priority)) {
      best = { reason: `${cat} · OpenAI ${s.toFixed(2)}`, priority }
    }
  }
  return best
}
```

Le soglie sono iniziali e vanno tarate con il test del punto 8.

## 5. Errori visibili

- Timeout di 3 secondi (già nel codice sopra).
- In caso di errore il messaggio viene segnato con `ai_non_disponibile`.
  In AiFlags compare un contatore "non controllati": se cresce, vuol dire che
  la chiave è scaduta o il servizio è giù.
- `OPENAI_API_KEY` mancante: un solo log chiaro all'avvio, non a ogni messaggio.

## 6. Messaggi urgenti

Per i flag con priorità 1:
- **notifica push ai moderatori**, usando `send-push`, che c'è già;
- facoltativo, da decidere: il messaggio viene **nascosto subito** e resta in
  attesa di revisione. Solo per minori e minacce, tutto il resto resta in soft
  mode.

## 7. Nickname e bio

Lo stesso controllo (punti 2–4) con un webhook su `profiles` AFTER UPDATE,
quando cambiano `nickname` o `bio`. Il flag va in una coda dedicata in admin.

## 8. Test prima del lancio

Un file `supabase/functions/moderate-message/test-cases.json` con circa 50
frasi, ognuna con il risultato atteso:
- insulti mascherati (fr0cio, f.r.o.c.i.o...): devono essere segnalati;
- chat queer normali e affettuose, anche esplicite in DM: **non** devono
  essere segnalate;
- minori, minacce, outing, spam, autolesionismo: devono essere segnalati con
  la priorità giusta.

Si lanciano su dev e si controlla quante risposte sono corrette prima di
passare a prod.

---

## Ordine consigliato

| # | Cosa | Perché prima |
|---|---|---|
| 1 | Motivo e priorità (punto 1) | Senza, chi modera non sa cosa sta guardando |
| 2 | Soglie OpenAI (punto 4) | Toglie il rumore e prende i casi gravi |
| 3 | Regole italiane (punto 3) e normalizzazione (punto 2) | Copre minori, outing e spam |
| 4 | Errori visibili (punto 5) | Evita buchi silenziosi |
| 5 | Urgenti, profili, test (punti 6–8) | Rifinitura prima del lancio |

Stima: 1–2 giorni di lavoro, su dev, poi una migration e il deploy di
`moderate-message` su prod insieme alla PR di rilascio.
