import type {
  IdentityCategory,
  Language,
  Orientation,
  Smoking,
  Sport,
  Zodiac,
} from '../types/enums'

export const IDENTITY_LABELS: Record<IdentityCategory, string> = {
  donna_cis: 'Donna cis',
  donna_trans: 'Donna trans',
  uomo_trans: 'Uomo trans',
  nonbinary: 'Non binary',
  genderqueer: 'Genderqueer',
  agender: 'Agender',
  bigender: 'Bigender',
  altro: 'Altro',
  preferisco_non_specificare: 'Preferisco non specificare',
}

export const ORIENTATION_LABELS: Record<Orientation, string> = {
  lesbica: 'Lesbica',
  bisessuale: 'Bisessuale',
  queer: 'Queer',
  pan: 'Pan',
  asessuale: 'Asessuale',
  polisessuale: 'Polisessuale',
  demisessuale: 'Demisessuale',
  bicurious: 'Bi-curious',
  questioning: 'Questioning',
  non_etichettata: 'Non etichettatə',
  altro: 'Altro',
  preferisco_non_dire: 'Preferisco non dire',
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  italiano: 'Italiano',
  inglese: 'Inglese',
  francese: 'Francese',
  tedesco: 'Tedesco',
  lis: 'Lingua dei segni italiana (LIS)',
  altro: 'Altra lingua',
}

export const SMOKING_LABELS: Record<Smoking, string> = {
  fuma: 'Fumo regolarmente',
  occasionalmente: 'Fumo occasionalmente',
  no: 'Non fumo',
  non_dico: 'Preferisco non dire',
}

export const SPORT_LABELS: Record<Sport, string> = {
  regolarmente: 'Regolare',
  saltuariamente: 'Saltuaria',
  no: 'No',
  non_dico: 'Preferisco non dire',
}

export const ZODIAC_LABELS: Record<Zodiac, string> = {
  ariete: 'Ariete',
  toro: 'Toro',
  gemelli: 'Gemelli',
  cancro: 'Cancro',
  leone: 'Leone',
  vergine: 'Vergine',
  bilancia: 'Bilancia',
  scorpione: 'Scorpione',
  sagittario: 'Sagittario',
  capricorno: 'Capricorno',
  acquario: 'Acquario',
  pesci: 'Pesci',
}
