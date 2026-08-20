// Avatar generati localmente con DiceBear v10 (SVG, nessuna chiamata di rete).
//
// L'avatar non si sceglie più uno per uno: è **derivato dall'id del profilo**,
// quindi ognuno ne ha uno solo e resta il suo per sempre — anche cambiando
// nickname. L'unica scelta è l'aspetto: due mondi (Pianeti, Costellazioni) e
// per ciascuno qualche variante di colore. Una decisione con sei esiti al
// posto di una griglia da cui pescare all'infinito.
//
// Quanto è "unico" davvero (contato sulle definizioni, agosto 2026): ogni
// stella di sfondo è un alias indipendente del componente `star`, quindi lo
// spazio è ~3·10¹³ immagini per Pianeti e ~6·10¹⁰ per Costellazioni — su 20.000
// uuid casuali, zero doppioni.
//
// Diverso è quanto si *distinguono* a 36px, dove conta solo forma + colori e il
// pulviscolo di stelle non si vede: lì Pianeti ha 126.000 aspetti, Costellazioni
// 4.256 (era 1.520 prima di allargare la tavolozza delle stelle qui sotto). Il
// tetto di Costellazioni sono le 19 forme di costellazione × 2 comete × 8 fondi
// = 304 strutture: nessuna tavolozza lo supera. Per questo il default resta
// Pianeti — Costellazioni è una scelta estetica, non quella che rende più
// riconoscibili in un elenco.
//
// Perché stili astratti e non volti: un avatar umanoide obbliga a scegliere
// tono di pelle, capelli e presentazione di genere, e chi non si ritrova in
// nessuna delle opzioni resta con un'immagine che lo rappresenta male. Ora che
// le foto sono il primo blocco del profilo, all'avatar basta essere un segno
// riconoscibile a 36px in chat, DM e ricerca.
//
// Il profilo salva una sola stringa in avatar_preset:
//   dicebear:<stile>:<preset>:<seed>
// autosufficiente, così ovunque compaia un avatar (chat, DM, card, profilo)
// basta quella per ricostruirlo identico, senza passare anche l'id utente.

import { Avatar, Style } from '@dicebear/core'
import planetsDefinition from '@dicebear/styles/planets.json'
import constellationDefinition from '@dicebear/styles/constellation.json'

export type AvatarStyle = 'planets' | 'constellation'

export const AVATAR_STYLES: { key: AvatarStyle; label: string }[] = [
  { key: 'planets', label: 'Pianeti' },
  { key: 'constellation', label: 'Costellazioni' },
]

// Le palette native di DiceBear sono già "Inchiostro & oro": gli sfondi di
// entrambi gli stili sono blu/viola notturni vicini a --bg, e le stelle di
// constellation sono crema e oro pallido come --text e --accent. Non passiamo
// quindi nessuno sfondo nostro: i preset restringono solo il colore del
// soggetto, che è ciò che distingue un avatar dall'altro.
type Preset = { key: string; label: string; options: Record<string, string[]> }

const PLANETS_PRESETS: Preset[] = [
  // "cosmo" non passa colori: usa tutte e quattordici le tinte di DiceBear.
  // È il preset di default proprio perché è quello che distingue di più gli
  // avatar tra loro in un elenco fitto.
  { key: 'cosmo', label: 'cosmo', options: {} },
  {
    key: 'caldo',
    label: 'caldo',
    options: { planetColor: ['e27a8c', 'e37f64', 'd88a40', 'c1982a', 'd67cb2'] },
  },
  {
    key: 'elettrico',
    label: 'elettrico',
    options: { planetColor: ['39b789', '00b6af', '00b1cf', '47a7e7', '7a9bef', 'a18ee8'] },
  },
]

// Le stelle di DiceBear sono cinque tinte sole, e sono il fattore che
// distingue di più una costellazione dall'altra: con così poche, a 36px in una
// lista di conversazioni due profili diversi si somigliano. Qui la tavolozza
// sale a quattordici tinte, tutte chiare e luminose perché stanno sempre su
// fondi notturni e devono continuare a leggersi come stelle. Le prime cinque
// sono quelle native di DiceBear, poi la crema e l'oro di Vesper e infine una
// rosa di tinte stellari (ambra, corallo, lilla, menta, blu) che allarga la
// gamma senza uscire dal registro.
const STELLE = [
  'ece8dd', 'e7ecf0', 'e9dab2', 'c1e0f0', 'f1d7d2',
  'f7efdd', 'f0c674', 'ffd9a0', 'f2a65a', 'efa08a',
  'd9b8e8', 'b8e0d2', 'cfe3a7', 'a8c4ea',
]

const CONSTELLATION_PRESETS: Preset[] = [
  { key: 'cosmo', label: 'cosmo', options: { constellationColor: STELLE } },
  // I due preset "d'atmosfera" restano volutamente stretti — è il loro senso —
  // ma non più a due sole tinte: dentro la loro famiglia hanno comunque di che
  // variare.
  {
    key: 'oro',
    label: 'oro',
    options: { constellationColor: ['e9dab2', 'ece8dd', 'f7efdd', 'f0c674', 'ffd9a0'] },
  },
  {
    key: 'ghiaccio',
    label: 'ghiaccio',
    options: { constellationColor: ['c1e0f0', 'e7ecf0', 'a8c4ea', 'b8e0d2'] },
  },
]

const PRESETS: Record<AvatarStyle, Preset[]> = {
  planets: PLANETS_PRESETS,
  constellation: CONSTELLATION_PRESETS,
}

export function presetsOf(style: AvatarStyle): Preset[] {
  return PRESETS[style]
}

export const DEFAULT_STYLE: AvatarStyle = 'planets'
export const DEFAULT_PRESET = 'cosmo'

const PREFIX = 'dicebear:'

export interface ParsedAvatar {
  style: AvatarStyle
  preset: string
  seed: string
}

export function isDicebearAvatar(value: string | null): value is string {
  return !!value && value.startsWith(PREFIX)
}

function isStyle(v: string): v is AvatarStyle {
  return v === 'planets' || v === 'constellation'
}

export function avatarValue(style: AvatarStyle, preset: string, seed: string): string {
  return `${PREFIX}${style}:${preset}:${seed}`
}

// L'avatar di partenza di chi non ne ha ancora uno: stile e preset di default
// sul proprio id. Non è una scelta lasciata in sospeso, è già il suo avatar.
export function defaultAvatarValue(profileId: string): string {
  return avatarValue(DEFAULT_STYLE, DEFAULT_PRESET, profileId)
}

export function parseAvatar(value: string | null): ParsedAvatar | null {
  if (!isDicebearAvatar(value)) return null
  const parts = value.slice(PREFIX.length).split(':')
  if (parts.length < 3) return null
  const [style, preset, ...rest] = parts
  const seed = rest.join(':')
  if (!isStyle(style) || !seed) return null
  if (!PRESETS[style].some((p) => p.key === preset)) return null
  return { style, preset, seed }
}

// I profili creati prima del passaggio a v10 hanno valori a due segmenti
// (`dicebear:adventurer:<seed>`): quegli stili non esistono più. Invece di
// farli ricadere sull'iniziale del nickname li disegniamo nello stile di
// default riusando il vecchio seed, così l'avatar resta un'immagine finché la
// persona non riapre l'editor. I preset emoji ancora precedenti ('luna',
// 'stella'…) non hanno il prefisso e restano a carico di glyphFor.
function legacyAvatar(value: string): ParsedAvatar | null {
  if (!isDicebearAvatar(value)) return null
  const parts = value.slice(PREFIX.length).split(':')
  const seed = parts[parts.length - 1]
  if (parts.length < 2 || !seed) return null
  return { style: DEFAULT_STYLE, preset: DEFAULT_PRESET, seed }
}

// Cache: gli avatar sono deterministici, quindi la data URI dipende solo dalla
// stringa. Evita di rigenerare l'SVG a ogni render (utile in chat con molti
// messaggi dello stesso utente).
const cache = new Map<string, string>()

// Le definizioni si validano una volta sola alla costruzione di Style: teniamo
// le due istanze in modulo invece di ricrearle a ogni avatar.
const planetsStyle = new Style(planetsDefinition)
const constellationStyle = new Style(constellationDefinition)

function generate({ style, preset, seed }: ParsedAvatar): string {
  const extra = PRESETS[style].find((p) => p.key === preset)?.options ?? {}
  const common = {
    seed,
    size: 96,
    // Entrambi gli stili offrono varianti animate. Il sorteggio casuale non le
    // pesca (hanno peso 0), ma la chiediamo esplicitamente ferma: in una lista
    // di conversazioni ci sono decine di avatar insieme, e comunque non
    // avremmo modo di rispettare prefers-reduced-motion dentro un data URI.
    animationVariant: 'none' as const,
    ...extra,
  }
  return style === 'planets'
    ? new Avatar(planetsStyle, common).toDataUri()
    : new Avatar(constellationStyle, common).toDataUri()
}

export function avatarDataUri(value: string | null): string | null {
  if (!value) return null
  const cached = cache.get(value)
  if (cached) return cached
  const parsed = parseAvatar(value) ?? legacyAvatar(value)
  if (!parsed) return null
  const uri = generate(parsed)
  cache.set(value, uri)
  return uri
}
