// Funzioni di formattazione profilo condivise tra ProfileScreen,
// PublicProfileScreen e SearchScreen.

// Avatar preset: placeholder fino all'art definitiva (branding.md).
export const AVATAR_PRESETS: { key: string; glyph: string }[] = [
  { key: 'luna', glyph: '🌙' },
  { key: 'stella', glyph: '⭐' },
  { key: 'foglia', glyph: '🌿' },
  { key: 'onda', glyph: '🌊' },
  { key: 'prisma', glyph: '🔮' },
  { key: 'fiore', glyph: '🌸' },
  { key: 'farfalla', glyph: '🦋' },
  { key: 'fiamma', glyph: '🔥' },
]

export function glyphFor(key: string | null, nickname: string): string {
  return (
    AVATAR_PRESETS.find((a) => a.key === key)?.glyph ||
    nickname.trim().charAt(0).toUpperCase() ||
    '·'
  )
}

export function ageFrom(birth: string | null): number | null {
  if (!birth) return null
  const d = new Date(birth)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export function labelOf<T extends string>(
  opts: { value: T; label: string }[],
  v: T,
): string {
  return opts.find((o) => o.value === v)?.label ?? v
}

export function labelsOf<T extends string>(
  opts: { value: T; label: string }[],
  vs: T[],
): string {
  return vs.map((v) => labelOf(opts, v)).join(', ')
}

// Normalizza come la colonna `ricerca` della tabella comuni (lower + senza accenti).
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
