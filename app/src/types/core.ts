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
  Zodiac,
  RoomKind,
} from './enums'

export interface Profile {
  id: string
  nickname: string
  identity_category: IdentityCategory
  orientations: Orientation[]
  birth_date: string | null
  avatar_preset: string | null
  accent_color: string | null
  bio: string | null
  city: string | null
  city_province: string | null
  city_region: string | null
  pronouns: string | null
  interests: string[]
  intents: Intent[]
  relationship_status: RelationshipStatus | null
  relationship_type: RelationshipType | null
  languages: Language[]
  children_status: ChildrenStatus | null
  has_pets: boolean | null
  pets_detail: string | null
  diet: Diet | null
  religion: Religion | null
  politics: Politics | null
  smoking: Smoking | null
  sport: Sport | null
  dm_filter: DmFilter
  // Colonna generata dal DB: sola lettura.
  zodiac: Zodiac | null
  show_age: boolean
  show_birth_date: boolean
  show_identity: boolean
  show_orientation: boolean
  show_city: boolean
  show_pronouns: boolean
  show_intents: boolean
  show_relationship: boolean
  show_languages: boolean
  show_children: boolean
  show_pets: boolean
  show_diet: boolean
  show_religion: boolean
  show_politics: boolean
  show_smoking: boolean
  show_sport: boolean
  show_zodiac: boolean
  show_online: boolean
  strato: number
  is_searchable: boolean
  verification_status: 'pending' | 'approved' | 'rejected' | null
  verification_video_path: string | null
  verification_rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface Chatroom {
  id: string
  slug: string
  name: string
  description: string | null
  kind: RoomKind
}

export interface InterestCategory {
  label: string
  options: string[]
}
