export type IdentityCategory =
  | 'donna_cis'
  | 'donna_trans'
  | 'uomo_trans'
  | 'nonbinary'
  | 'genderqueer'
  | 'agender'
  | 'bigender'
  | 'altro'
  | 'preferisco_non_specificare'

export type Orientation =
  | 'lesbica'
  | 'bisessuale'
  | 'queer'
  | 'pan'
  | 'asessuale'
  | 'polisessuale'
  | 'demisessuale'
  | 'bicurious'
  | 'questioning'
  | 'non_etichettata'
  | 'altro'
  | 'preferisco_non_dire'

export type Intent =
  | 'amicizia'
  | 'dating'
  | 'relazione'
  | 'networking'
  | 'confronto'
  | 'solo_chattare'
  | 'monogamia'
  | 'poliamore'
  | 'mge'
  | 'relazione_aperta'
  | 'relazione_platonica'
  | 'altro'
  | 'supporto'

export type RelationshipStatus = 'single' | 'in_relazione' | 'non_dico'

export type RelationshipType =
  | 'monogama'
  | 'poliamorosa'
  | 'aperta'
  | 'nme'
  | 'complicato'
  | 'non_so_ancora'
  | 'preferisco_non_specificare'

export type Language =
  | 'italiano'
  | 'inglese'
  | 'francese'
  | 'spagnolo'
  | 'tedesco'
  | 'portoghese'
  | 'arabo'
  | 'cinese'
  | 'russo'
  | 'rumeno'
  | 'hindi'
  | 'lis'
  | 'altro'

export type ChildrenStatus =
  | 'ho_figli'
  | 'non_ho_figli'
  | 'vorrei_figli'
  | 'non_vorrei_figli'

export type Diet =
  | 'vegetariana'
  | 'vegana'
  | 'flexitariana'
  | 'onnivora'
  | 'onnivora_consapevole'
  | 'altro'

export type Religion =
  | 'cattolicesimo'
  | 'islam'
  | 'ebraismo'
  | 'buddismo'
  | 'induismo'
  | 'spiritualita'
  | 'ateismo'
  | 'agnosticismo'
  | 'altro'

export type Politics =
  | 'progressista'
  | 'conservatrice'
  | 'moderata'
  | 'libertaria'
  | 'anarchica'
  | 'socialista'
  | 'comunista'
  | 'altro'

export type EducationLevel =
  | 'preferisco_non_specificare'
  | 'licenza_media'
  | 'diploma'
  | 'qualifica_professionale'
  | 'its'
  | 'laurea_triennale'
  | 'laurea_magistrale'
  | 'master'
  | 'dottorato'
  | 'accademia'
  | 'autodidatta'
  | 'altro'

export type Smoking = 'fuma' | 'no' | 'occasionalmente' | 'non_dico'

export type Sport = 'regolarmente' | 'saltuariamente' | 'no' | 'non_dico'

export type DmFilter = 'tutte' | 'citta' | 'intenti' | 'verificate'

export type Zodiac =
  | 'ariete'
  | 'toro'
  | 'gemelli'
  | 'cancro'
  | 'leone'
  | 'vergine'
  | 'bilancia'
  | 'scorpione'
  | 'sagittario'
  | 'capricorno'
  | 'acquario'
  | 'pesci'

export type RoomKind = 'foyer' | 'tematica'

// Strati di accesso (vedi permessi_e_strati.md).
export type Layer = 1 | 2 | 3
