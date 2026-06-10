import { ageFrom } from '../../lib/profile/formatters'
import { ProfileLayout } from './ProfileLayout'
import { buildProfileRows, buildKeyFacts, type ProfileFacts } from './profileFacts'
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

  // ProfilePreview mostra il proprio profilo: i campi nascosti dai flag
  // show_* vanno passati come null così buildProfileRows/buildKeyFacts
  // li omettono — stessa logica di filtraggio già usata da public_profiles,
  // qui replicata esplicitamente perché lavoriamo sui dati grezzi.
  const facts: ProfileFacts = {
    pronouns: profile.show_pronouns ? profile.pronouns : null,
    city: profile.show_city ? profile.city : null,
    city_province: profile.show_city ? profile.city_province : null,
    city_region: profile.show_city ? profile.city_region : null,
    birth_date: profile.show_birth_date ? profile.birth_date : null,
    relationship_status: profile.show_relationship ? profile.relationship_status : null,
    relationship_type: profile.relationship_type,
    languages: profile.show_languages ? profile.languages : null,
    interests: profile.interests,
    children_status: profile.show_children ? profile.children_status : null,
    has_pets: profile.show_pets ? profile.has_pets : null,
    pets_detail: profile.pets_detail,
    diet: profile.show_diet ? profile.diet : null,
    religion: profile.show_religion ? profile.religion : null,
    politics: profile.show_politics ? profile.politics : null,
    smoking: profile.show_smoking ? profile.smoking : null,
    sport: profile.show_sport ? profile.sport : null,
    zodiac: profile.show_zodiac ? profile.zodiac : null,
    identity_category: profile.show_identity ? profile.identity_category : null,
    orientations: profile.show_orientation ? profile.orientations : null,
    intents: profile.show_intents ? profile.intents : null,
    age: profile.show_age ? age : null,
  }
  const rows = buildProfileRows(facts)
  const keyFacts = buildKeyFacts(facts)

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
