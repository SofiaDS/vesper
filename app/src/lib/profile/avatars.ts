// Avatar generati localmente con DiceBear (SVG, nessuna chiamata di rete).
// Il profilo salva solo una stringa "dicebear:<stile>:<seed>" nella colonna
// avatar_preset: l'immagine è deterministica dal seed, quindi si ricostruisce
// identica ovunque (chat, DM, card, profilo) senza salvare file.
// I valori legacy (emoji: 'luna', 'stella'…) restano gestiti da glyphFor come
// fallback, così i profili esistenti non si rompono.

import { createAvatar } from '@dicebear/core'
import { adventurer, bottts } from '@dicebear/collection'

export type AvatarStyle = 'adventurer' | 'bottts'

const STYLES = { adventurer, bottts } as const

export const AVATAR_STYLES: { key: AvatarStyle; label: string }[] = [
  { key: 'adventurer', label: 'Personaggi' },
  { key: 'bottts', label: 'Robot' },
]

const PREFIX = 'dicebear:'

// Sfondi morbidi coerenti col tema: DiceBear ne sceglie uno in modo
// deterministico dal seed, così ogni avatar è "finito" e riconoscibile a
// prescindere dal colore accento del profilo.
const BACKGROUND = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'e8b14e']

export function isDicebearAvatar(value: string | null): value is string {
  return !!value && value.startsWith(PREFIX)
}

export function avatarValue(style: AvatarStyle, seed: string): string {
  return `${PREFIX}${style}:${seed}`
}

export function parseAvatar(value: string | null): { style: AvatarStyle; seed: string } | null {
  if (!isDicebearAvatar(value)) return null
  const rest = value.slice(PREFIX.length)
  const sep = rest.indexOf(':')
  if (sep < 0) return null
  const style = rest.slice(0, sep) as AvatarStyle
  const seed = rest.slice(sep + 1)
  if (!(style in STYLES) || !seed) return null
  return { style, seed }
}

// Cache: gli avatar sono deterministici, quindi la data URI dipende solo dalla
// stringa. Evita di rigenerare l'SVG a ogni render (utile in chat con molti
// messaggi dello stesso utente).
const cache = new Map<string, string>()

// createAvatar è generico sullo stile, quindi ogni stile va passato come tipo
// concreto (uno switch), non tramite un lookup che ne produrrebbe l'unione.
function generate(style: AvatarStyle, seed: string): string {
  const common = {
    seed,
    size: 96,
    backgroundColor: BACKGROUND,
    backgroundType: ['solid' as const],
  }
  switch (style) {
    case 'bottts':
      return createAvatar(bottts, common).toDataUri()
    case 'adventurer':
      return createAvatar(adventurer, common).toDataUri()
  }
}

export function avatarDataUri(value: string | null): string | null {
  if (!value) return null
  const cached = cache.get(value)
  if (cached) return cached
  const parsed = parseAvatar(value)
  if (!parsed) return null
  const uri = generate(parsed.style, parsed.seed)
  cache.set(value, uri)
  return uri
}

// Seed della galleria curata mostrata di default nel selettore. Le parole non
// contano di per sé: servono solo a produrre avatar distinti e stabili.
export const GALLERY_SEEDS: Record<AvatarStyle, string[]> = {
  adventurer: [
    'Aurora', 'Milo', 'Nina', 'Leo', 'Sole', 'Vera', 'Enzo', 'Gaia',
    'Bruno', 'Iris', 'Teo', 'Lia', 'Marco', 'Ada', 'Nico', 'Elsa',
    'Piero', 'Zoe', 'Dario', 'Mira',
  ],
  bottts: [
    'Atlas', 'Orbit', 'Nova', 'Pixel', 'Volt', 'Turbo', 'Chip', 'Echo',
    'Radar', 'Bolt', 'Circuit', 'Gizmo', 'Rocket', 'Byte', 'Cosmo', 'Zap',
    'Titan', 'Neon', 'Quark', 'Astro',
  ],
}

// Seed casuale per il pulsante "Mostra altri".
export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10)
}
