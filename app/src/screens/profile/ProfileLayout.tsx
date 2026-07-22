import type { ReactNode } from 'react'
import { AppHeader } from '../../components/AppHeader'
import { Avatar } from '../../components/Avatar'
import { ProfileGallery } from './ProfileGallery'

// Layout condiviso della schermata profilo (mio o altrui): header con avatar
// in miniatura, icone azione in alto a destra, sezione "hero" con avatar
// grande + nome + info principali, e la pila di card (descrizione, galleria,
// altre informazioni, eventuale card finale). ProfilePreview e
// PublicProfileScreen vi inseriscono i propri dati e azioni.
export function ProfileLayout({
  onBack,
  userId,
  nickname,
  avatarPreset,
  accentColor,
  bio,
  keyFacts,
  rows,
  topActions,
  onReportPhoto,
  bottomCard,
}: {
  onBack: () => void
  userId: string
  nickname: string
  avatarPreset: string | null
  accentColor: string | null
  bio: string | null
  // Identità, orientamento, cosa cerca, età — già formattati; gli assenti (per
  // privacy o perché non impostati) vengono filtrati prima di mostrarli.
  keyFacts: (string | null)[]
  rows: ReactNode[]
  // Icone in alto a destra: modifica (proprio profilo) oppure blocca/segnala (altrui).
  topActions: ReactNode
  onReportPhoto?: (photoId: string) => void
  // Card finale opzionale: zona pericolosa (proprio) o azioni di contatto (altrui).
  bottomCard?: ReactNode
}) {
  const background = accentColor ?? 'var(--accent)'
  const facts = keyFacts.filter((f): f is string => Boolean(f))

  return (
    <main className="app profile">
      <AppHeader
        onBack={onBack}
        title={
          <span className="pf-header-title">
            <span className="avatar-bubble avatar-bubble-sm" style={{ background }}><Avatar preset={avatarPreset} nickname={nickname} /></span>
            <span>@{nickname}</span>
          </span>
        }
      />

      {topActions && <div className="pf-icon-actions">{topActions}</div>}

      <header className="pf-hero">
        <span className="avatar-bubble avatar-bubble-lg" style={{ background }}><Avatar preset={avatarPreset} nickname={nickname} /></span>
        <h2 className="pf-nick">@{nickname}</h2>
        {facts.length > 0 && <p className="pf-key-facts">{facts.join(' · ')}</p>}
      </header>

      {bio && (
        <section className="card box-shadow">
          <h2 className="pf-section-title">Descrizione</h2>
          <p className="pf-bio">{bio}</p>
        </section>
      )}

      <section className="card box-shadow">
        <h2 className="pf-section-title">Foto</h2>
        <ProfileGallery userId={userId} onReportPhoto={onReportPhoto} />
      </section>

      {rows.length > 0 && (
        <section className="card box-shadow">
          <h2 className="pf-section-title">Altre informazioni</h2>
          <div className="pf-rows">{rows}</div>
        </section>
      )}

      {bottomCard}
    </main>
  )
}
