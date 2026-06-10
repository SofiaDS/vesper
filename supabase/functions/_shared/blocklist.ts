// Modulo condiviso: blocklist italiana custom per il filtro AI (P38, soft mode).
// Vedi moderazione.md sez. 6: lista costruita progressivamente dai fondatori
// sulla base dei casi reali. Contiene solo forme aggressive/composte — termini
// riappropriati dalla community (es. "frocia", "lesbica", "ricchione" usati da
// soli) restano fuori di proposito, per evitare falsi positivi.
//
// Match case-insensitive su sottostringa, accenti/spazi non normalizzati:
// da affinare in fase di revisione (vedi sez. 6.1) se emergono elusioni comuni.
const BLOCKLIST: string[] = [
  'frocio di merda',
  'ricchione di merda',
  'lesbica di merda',
  'trans di merda',
  'culattone',
  'figl di puttan',
]

export function containsBlockedTerm(text: string): boolean {
  const lower = text.toLowerCase()
  return BLOCKLIST.some((term) => lower.includes(term))
}
