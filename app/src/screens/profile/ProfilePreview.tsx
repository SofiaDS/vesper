import {
  IDENTITY_LABELS,
  ORIENTATION_LABELS,
  SMOKING_LABELS,
  SPORT_LABELS,
  ZODIAC_LABELS,
} from '../../constants/labels'
import {
  INTENT_OPTIONS,
  RELATIONSHIP_STATUS_OPTIONS,
  RELATIONSHIP_TYPE_OPTIONS,
  LANGUAGE_OPTIONS,
  CHILDREN_OPTIONS,
  DIET_OPTIONS,
  RELIGION_OPTIONS,
  POLITICS_OPTIONS,
} from '../../constants/options'
import { ageFrom, labelOf, labelsOf } from '../../lib/profile/formatters'
import { ProfileLayout } from './ProfileLayout'
import { ProfileRow } from './ProfileRow'
import { DeleteAccountSection } from './DeleteAccountSection'
import type { Profile } from '../../types'

export function ProfilePreview({
  profile,
  onBack,
  onEdit,
}: {
  profile: Profile
  onBack: () => void
  onEdit: () => void
}) {
  const age = ageFrom(profile.birth_date)
  const rows: React.ReactNode[] = []

  if (profile.show_pronouns && profile.pronouns)
    rows.push(<ProfileRow key="pron" label="Pronomi">{profile.pronouns}</ProfileRow>)
  if (profile.show_city && profile.city)
    rows.push(
      <ProfileRow key="city" label="Città">
        {profile.city}
        {profile.city_province ? ` (${profile.city_province})` : ''}
        {profile.city_region ? `, ${profile.city_region}` : ''}
      </ProfileRow>,
    )
  if (profile.show_birth_date && profile.birth_date)
    rows.push(
      <ProfileRow key="bd" label="Data di nascita">
        {new Date(profile.birth_date).toLocaleDateString('it-IT')}
      </ProfileRow>,
    )
  if (profile.show_relationship && profile.relationship_status)
    rows.push(
      <ProfileRow key="rel" label="Relazione">
        {labelOf(RELATIONSHIP_STATUS_OPTIONS, profile.relationship_status)}
        {profile.relationship_status === 'in_relazione' && profile.relationship_type
          ? ` · ${labelOf(RELATIONSHIP_TYPE_OPTIONS, profile.relationship_type)}`
          : ''}
      </ProfileRow>,
    )
  if (profile.show_languages && profile.languages.length > 0)
    rows.push(
      <ProfileRow key="lang" label="Lingue parlate">{labelsOf(LANGUAGE_OPTIONS, profile.languages)}</ProfileRow>,
    )
  if (profile.interests.length > 0)
    rows.push(<ProfileRow key="int" label="Interessi">{profile.interests.join(', ')}</ProfileRow>)
  if (profile.show_children && profile.children_status)
    rows.push(
      <ProfileRow key="ch" label="Figli">{labelOf(CHILDREN_OPTIONS, profile.children_status)}</ProfileRow>,
    )
  if (profile.show_pets && profile.has_pets != null)
    rows.push(
      <ProfileRow key="pets" label="Animali domestici">
        {profile.has_pets ? (profile.pets_detail ? `Sì — ${profile.pets_detail}` : 'Sì') : 'No'}
      </ProfileRow>,
    )
  if (profile.show_diet && profile.diet)
    rows.push(
      <ProfileRow key="diet" label="Alimentazione">{labelOf(DIET_OPTIONS, profile.diet)}</ProfileRow>,
    )
  if (profile.show_religion && profile.religion)
    rows.push(
      <ProfileRow key="rel2" label="Religione & credo">
        {labelOf(RELIGION_OPTIONS, profile.religion)}
      </ProfileRow>,
    )
  if (profile.show_politics && profile.politics)
    rows.push(
      <ProfileRow key="pol" label="Orientamento politico">
        {labelOf(POLITICS_OPTIONS, profile.politics)}
      </ProfileRow>,
    )
  if (profile.show_smoking && profile.smoking)
    rows.push(
      <ProfileRow key="sm" label="Fumo">{SMOKING_LABELS[profile.smoking] ?? profile.smoking}</ProfileRow>,
    )
  if (profile.show_sport && profile.sport)
    rows.push(
      <ProfileRow key="sp" label="Attività fisica">
        {SPORT_LABELS[profile.sport] ?? profile.sport}
      </ProfileRow>,
    )
  if (profile.show_zodiac && profile.zodiac)
    rows.push(<ProfileRow key="zo" label="Segno">{ZODIAC_LABELS[profile.zodiac]}</ProfileRow>)

  const keyFacts = [
    profile.show_identity ? IDENTITY_LABELS[profile.identity_category] ?? profile.identity_category : null,
    profile.show_orientation && profile.orientations.length > 0
      ? profile.orientations.map((o) => ORIENTATION_LABELS[o] ?? o).join(', ')
      : null,
    profile.show_intents && profile.intents.length > 0 ? labelsOf(INTENT_OPTIONS, profile.intents) : null,
    profile.show_age && age != null ? `${age} anni` : null,
  ]

  return (
    <ProfileLayout
      onBack={onBack}
      userId={profile.id}
      nickname={profile.nickname}
      avatarPreset={profile.avatar_preset}
      accentColor={profile.accent_color}
      bio={profile.bio}
      keyFacts={keyFacts}
      rows={rows}
      topActions={
        <button type="button" className="pf-icon-btn" title="Modifica profilo" aria-label="Modifica profilo" onClick={onEdit}>
          ✎
        </button>
      }
      bottomCard={<DeleteAccountSection profileId={profile.id} />}
    />
  )
}
