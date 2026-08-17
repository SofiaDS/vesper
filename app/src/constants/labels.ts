import type {
  IdentityCategory,
  Language,
  Orientation,
  Smoking,
  Sport,
  Zodiac,
} from '../types/enums'

// Convenzione delle etichette: tutto in minuscolo (normalizzato l'11 ago 2026).
// Prima le liste erano miste — "relazione monogama" accanto a "Amicizia" nello
// stesso menu — perché erano state scritte in momenti diversi. Restano
// maiuscoli solo gli acronimi (LIS, ITS, PhD) e i nomi propri (Islam).
// Le etichette compaiono dentro frasi e come chip nei profili, mai come titoli:
// il minuscolo è la forma che sta bene in entrambi i posti.

export const IDENTITY_LABELS: Record<IdentityCategory, string> = {
  donna_cis: 'donna cis',
  donna_trans: 'donna trans',
  uomo_trans: 'uomo trans',
  nonbinary: 'non binary',
  genderqueer: 'genderqueer',
  agender: 'agender',
  bigender: 'bigender',
  intersex: 'intersex',
  altro: 'altro',
  preferisco_non_specificare: 'preferisco non specificare',
}

export const ORIENTATION_LABELS: Record<Orientation, string> = {
  lesbica: 'lesbica',
  bisessuale: 'bisessuale',
  queer: 'queer',
  pan: 'pan',
  asessuale: 'asessuale',
  polisessuale: 'polisessuale',
  demisessuale: 'demisessuale',
  bicurious: 'bi-curious',
  questioning: 'questioning',
  non_etichettata: 'non etichettatə',
  altro: 'altro',
  preferisco_non_dire: 'preferisco non dire',
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  italiano: 'italiano',
  inglese: 'inglese',
  francese: 'francese',
  tedesco: 'tedesco',
  lis: 'lingua dei segni italiana (LIS)',
}

export const SMOKING_LABELS: Record<Smoking, string> = {
  fuma: 'fumo regolarmente',
  occasionalmente: 'fumo occasionalmente',
  no: 'non fumo',
  non_dico: 'preferisco non dire',
}

export const SPORT_LABELS: Record<Sport, string> = {
  regolarmente: 'regolare',
  saltuariamente: 'saltuaria',
  no: 'no',
  non_dico: 'preferisco non dire',
}

export const ZODIAC_LABELS: Record<Zodiac, string> = {
  ariete: 'ariete',
  toro: 'toro',
  gemelli: 'gemelli',
  cancro: 'cancro',
  leone: 'leone',
  vergine: 'vergine',
  bilancia: 'bilancia',
  scorpione: 'scorpione',
  sagittario: 'sagittario',
  capricorno: 'capricorno',
  acquario: 'acquario',
  pesci: 'pesci',
}
