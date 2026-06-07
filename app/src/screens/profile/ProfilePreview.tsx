import { AppHeader } from '../../components/AppHeader'
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
  DIET_OPTIONS,
  RELIGION_OPTIONS,
  POLITICS_OPTIONS,
} from '../../constants/options'
import { glyphFor, ageFrom, labelOf, labelsOf } from '../../lib/profile/formatters'
import { PhotoCarousel } from '../../components/PhotoCarousel'
import type { Profile } from '../../types'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pf-row">
      <span className="pf-label">{label}</span>
      <span className="pf-value">{children}</span>
    </div>
  )
}

export function ProfilePreview({
  profile,
  onBack,
  onEdit,
  onOpenBlocked,
}: {
  profile: Profile
  onBack: () => void
  onEdit: () => void
  onOpenBlocked: () => void
}) {
  const age = ageFrom(profile.birth_date)
  const rows: React.ReactNode[] = []

  if (profile.show_pronouns && profile.pronouns)
    rows.push(<Row key="pron" label="Pronomi">{profile.pronouns}</Row>)
  if (profile.show_city && profile.city)
    rows.push(
      <Row key="city" label="Città">
        {profile.city}
        {profile.city_province ? ` (${profile.city_province})` : ''}
        {profile.city_region ? `, ${profile.city_region}` : ''}
      </Row>,
    )
  if (profile.show_age && age != null)
    rows.push(<Row key="age" label="Età">{age} anni</Row>)
  if (profile.show_birth_date && profile.birth_date)
    rows.push(
      <Row key="bd" label="Data di nascita">
        {new Date(profile.birth_date).toLocaleDateString('it-IT')}
      </Row>,
    )
  if (profile.show_identity)
    rows.push(
      <Row key="id" label="Identità">
        {IDENTITY_LABELS[profile.identity_category] ?? profile.identity_category}
      </Row>,
    )
  if (profile.show_orientation && profile.orientations.length > 0)
    rows.push(
      <Row key="or" label="Orientamento">
        {profile.orientations.map((o) => ORIENTATION_LABELS[o] ?? o).join(', ')}
      </Row>,
    )
  if (profile.show_relationship && profile.relationship_status)
    rows.push(
      <Row key="rel" label="Relazione">
        {labelOf(RELATIONSHIP_STATUS_OPTIONS, profile.relationship_status)}
        {profile.relationship_status === 'in_relazione' && profile.relationship_type
          ? ` · ${labelOf(RELATIONSHIP_TYPE_OPTIONS, profile.relationship_type)}`
          : ''}
      </Row>,
    )
  if (profile.show_intents && profile.intents.length > 0)
    rows.push(
      <Row key="in" label="Cosa cerco">{labelsOf(INTENT_OPTIONS, profile.intents)}</Row>,
    )
  if (profile.interests.length > 0)
    rows.push(<Row key="int" label="Interessi">{profile.interests.join(', ')}</Row>)
  if (profile.show_diet && profile.diet)
    rows.push(
      <Row key="diet" label="Alimentazione">{labelOf(DIET_OPTIONS, profile.diet)}</Row>,
    )
  if (profile.show_religion && profile.religion)
    rows.push(
      <Row key="rel2" label="Religione & credo">
        {labelOf(RELIGION_OPTIONS, profile.religion)}
      </Row>,
    )
  if (profile.show_politics && profile.politics)
    rows.push(
      <Row key="pol" label="Orientamento politico">
        {labelOf(POLITICS_OPTIONS, profile.politics)}
      </Row>,
    )
  if (profile.show_smoking && profile.smoking)
    rows.push(
      <Row key="sm" label="Fumo">{SMOKING_LABELS[profile.smoking] ?? profile.smoking}</Row>,
    )
  if (profile.show_sport && profile.sport)
    rows.push(
      <Row key="sp" label="Attività fisica">
        {SPORT_LABELS[profile.sport] ?? profile.sport}
      </Row>,
    )
  if (profile.show_zodiac && profile.zodiac)
    rows.push(<Row key="zo" label="Segno">{ZODIAC_LABELS[profile.zodiac]}</Row>)

  return (
    <main className="app profile">
      <AppHeader backLabel="‹ Stanze" onBack={onBack} title="Il mio profilo" />

      <p className="hint">Anteprima: così appari alle altre persone.</p>

      <button
        type="button"
        className="link"
        style={{ display: 'block', marginLeft: 'auto' }}
        onClick={onEdit}
      >
        Modifica
      </button>

      <div className="profile-card">
        <div className="avatar-preview">
          <PhotoCarousel
            userId={profile.id}
            fallback={
              <span
                className="avatar-bubble"
                style={{ background: profile.accent_color ?? 'var(--accent)' }}
              >
                {glyphFor(profile.avatar_preset, profile.nickname)}
              </span>
            }
          />
          <span className="pf-nick">@{profile.nickname}</span>
        </div>

        {profile.bio && <p className="pf-bio">{profile.bio}</p>}

        {rows.length > 0 ? (
          <div className="pf-rows">{rows}</div>
        ) : (
          <p className="hint">
            Per ora le altre persone vedono solo il tuo nickname e l'avatar.
            Tocca "Modifica" per scegliere cosa mostrare.
          </p>
        )}
      </div>

      <div className="pf-actions">
        <button type="button" className="link" onClick={onOpenBlocked}>
          Persone bloccate
        </button>
      </div>
    </main>
  )
}
