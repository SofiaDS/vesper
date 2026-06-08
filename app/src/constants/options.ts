import type {
  IdentityCategory,
  Orientation,
  Intent,
  RelationshipStatus,
  RelationshipType,
  Language,
  ChildrenStatus,
  Diet,
  Religion,
  Politics,
  Smoking,
  Sport,
  DmFilter,
} from '../types/enums'

export const IDENTITY_OPTIONS: { value: IdentityCategory; label: string }[] = [
  { value: 'donna_cis', label: 'Donna cis' },
  { value: 'donna_trans', label: 'Donna trans' },
  { value: 'uomo_trans', label: 'Uomo trans' },
  { value: 'nonbinary', label: 'Non binarie' },
  { value: 'genderqueer', label: 'Genderqueer' },
  { value: 'agender', label: 'Agender' },
  { value: 'bigender', label: 'Bigender' },
  { value: 'altro', label: 'Altro' },
  { value: 'preferisco_non_specificare', label: 'Preferisco non specificare' },
]

export const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: 'lesbica', label: 'Lesbica' },
  { value: 'bisessuale', label: 'Bisessuale' },
  { value: 'queer', label: 'Queer' },
  { value: 'pan', label: 'Pan' },
  { value: 'asessuale', label: 'Asessuale' },
  { value: 'polisessuale', label: 'Polisessuale' },
  { value: 'demisessuale', label: 'Demisessuale' },
  { value: 'bicurious', label: 'Bi-curious' },
  { value: 'questioning', label: 'Questioning' },
  { value: 'non_etichettata', label: 'Non etichettatə' },
  { value: 'altro', label: 'Altro' },
  { value: 'preferisco_non_dire', label: 'Preferisco non dire' },
]

export const INTENT_OPTIONS: { value: Intent; label: string }[] = [
  { value: 'monogamia', label: 'relazione monogama' },
  { value: 'poliamore', label: 'relazione poliamorosa' },
  { value: 'mge', label: 'relazione non monogama etica' },
  { value: 'relazione_aperta', label: 'relazione aperta' },
  { value: 'relazione_platonica', label: 'relazione platonica' },
  { value: 'altro', label: 'altro' },
  { value: 'amicizia', label: 'Amicizia' },
  { value: 'networking', label: 'Networking' },
  { value: 'confronto', label: 'Confronto' },
  { value: 'solo_chattare', label: 'Solo chattare' },
  { value: 'supporto', label: 'supporto' },
]

export const RELATIONSHIP_STATUS_OPTIONS: {
  value: RelationshipStatus
  label: string
}[] = [
  { value: 'single', label: 'Single' },
  { value: 'in_relazione', label: 'In una relazione' },
  { value: 'non_dico', label: 'Preferisco non specificare' },
]

export const RELATIONSHIP_TYPE_OPTIONS: {
  value: RelationshipType
  label: string
}[] = [
  { value: 'monogama', label: 'Monogama' },
  { value: 'poliamorosa', label: 'Poliamorosa' },
  { value: 'aperta', label: 'Aperta' },
  { value: 'nme', label: 'Non monogamia etica' },
  { value: 'complicato', label: 'Complicato' },
  { value: 'non_so_ancora', label: 'Non so ancora' },
]

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'italiano', label: 'Italiano' },
  { value: 'inglese', label: 'Inglese' },
  { value: 'francese', label: 'Francese' },
  { value: 'spagnolo', label: 'Spagnolo' },
  { value: 'tedesco', label: 'Tedesco' },
  { value: 'portoghese', label: 'Portoghese' },
  { value: 'arabo', label: 'Arabo' },
  { value: 'cinese', label: 'Cinese' },
  { value: 'russo', label: 'Russo' },
  { value: 'rumeno', label: 'Rumeno' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'lis', label: 'Lingua dei segni italiana (LIS)' },
  { value: 'altro', label: 'Altra lingua' },
]

export const CHILDREN_OPTIONS: { value: ChildrenStatus; label: string }[] = [
  { value: 'ho_figli', label: 'Ho figli' },
  { value: 'non_ho_figli', label: 'Non ho figli' },
  { value: 'vorrei_figli', label: 'Vorrei averne' },
  { value: 'non_vorrei_figli', label: 'Non ne vorrei' },
]

export const DIET_OPTIONS: { value: Diet; label: string }[] = [
  { value: 'vegetariana', label: 'Vegetarianə' },
  { value: 'vegana', label: 'Veganə' },
  { value: 'flexitariana', label: 'Flexitarianə' },
  { value: 'onnivora', label: 'Onnivorə' },
  { value: 'onnivora_consapevole', label: 'Onnivorə consapevole' },
  { value: 'altro', label: 'Altro' },
]

export const RELIGION_OPTIONS: { value: Religion; label: string }[] = [
  { value: 'cattolicesimo', label: 'Cattolicesimə' },
  { value: 'islam', label: 'Islam' },
  { value: 'ebraismo', label: 'Ebraismə' },
  { value: 'buddismo', label: 'Buddismə' },
  { value: 'induismo', label: 'Induismə' },
  { value: 'spiritualita', label: 'Spiritualità personale' },
  { value: 'ateismo', label: 'Ateə' },
  { value: 'agnosticismo', label: 'Agnosticə' },
  { value: 'altro', label: 'Altro' },
]

export const POLITICS_OPTIONS: { value: Politics; label: string }[] = [
  { value: 'progressista', label: 'Progressistə' },
  { value: 'conservatrice', label: 'Conservatorə' },
  { value: 'moderata', label: 'Moderatə' },
  { value: 'libertaria', label: 'Libertariə' },
  { value: 'anarchica', label: 'Anarchicə' },
  { value: 'socialista', label: 'Socialista' },
  { value: 'comunista', label: 'Comunista' },
  { value: 'altro', label: 'Altro' },
]

export const SMOKING_OPTIONS: { value: Smoking; label: string }[] = [
  { value: 'fuma', label: 'Fumo regolarmente' },
  { value: 'occasionalmente', label: 'Fumo occasionalmente' },
  { value: 'no', label: 'Non fumo' },
]

export const SPORT_OPTIONS: { value: Sport; label: string }[] = [
  { value: 'regolarmente', label: 'Regolare' },
  { value: 'saltuariamente', label: 'Saltuaria' },
  { value: 'no', label: 'No' },
]

export const DM_FILTER_OPTIONS: { value: DmFilter; label: string }[] = [
  { value: 'tutte', label: 'Tutte' },
  { value: 'citta', label: 'Dalla mia città' },
  { value: 'intenti', label: 'Con i miei stessi intenti' },
  { value: 'verificate', label: 'Solo verificate' },
]
