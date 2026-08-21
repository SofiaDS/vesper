import { useState, type ReactNode } from 'react'
import { AppHeader } from '../../components/AppHeader'
import { Avatar } from '../../components/Avatar'
import { ProfileGallery } from './ProfileGallery'
import { countFactChips, type KeyFact, type FactChipGroup } from './profileFacts'

// Layout condiviso della schermata profilo (mio o altrui) — redesign 2B.
// Dall'alto: header con il solo @nickname (l'avatar sta nell'hero) ed
// eventuale azione a destra, mosaico foto a filo bordo, riga identità con
// l'avatar che risale a sovrapporsi al mosaico, bio, i tre fatti chiave e
// infine «Mostra tutto (N)» che apre il resto sotto forma di chip. Le azioni
// (scrivi/blocca/segnala, oppure modifica) vivono in una barra fissa in basso.
// ProfilePreview e PublicProfileScreen vi inseriscono i propri dati.
export function ProfileLayout({
  onBack,
  backLabel,
  userId,
  nickname,
  avatarPreset,
  bio,
  heroLine,
  keyFacts,
  factChips,
  onReportPhoto,
  actionBar,
}: {
  onBack: () => void
  backLabel?: string
  userId: string
  nickname: string
  avatarPreset: string | null
  bio: string | null
  // "31 anni · Bologna" — già formattata, null se entrambi i dati mancano.
  heroLine: string | null
  // I tre fatti chiave (Si presenta come / Cerca / Parla), già filtrati.
  keyFacts: KeyFact[]
  // Tutti gli altri fatti, come chip sotto «Mostra tutto», raggruppati.
  factChips: FactChipGroup[]
  onReportPhoto?: (photoId: string) => void
  // Barra fissa in basso: contatto (profilo altrui) o modifica (proprio).
  actionBar?: ReactNode
}) {
  const [showAll, setShowAll] = useState(false)
  // `null` finché la galleria non ha risposto: fino ad allora c'è comunque lo
  // scheletro del mosaico, quindi l'avatar può già risalire.
  const [photoCount, setPhotoCount] = useState<number | null>(null)
  const hasMosaic = photoCount == null || photoCount > 0
  const chipCount = countFactChips(factChips)

  return (
    <main className="app profile pf-view">
      <AppHeader onBack={onBack} backLabel={backLabel} title={`@${nickname}`} />

      <ProfileGallery userId={userId} onReportPhoto={onReportPhoto} onLoaded={setPhotoCount} />

      <header className={hasMosaic ? 'pf-idrow' : 'pf-idrow pf-idrow-nophoto'}>
        <span className="avatar-bubble avatar-bubble-hero">
          <Avatar preset={avatarPreset} nickname={nickname} />
        </span>
        <div className="pf-idrow-text">
          <h2 className="pf-hero-nick">@{nickname}</h2>
          {heroLine && <p className="pf-hero-sub">{heroLine}</p>}
        </div>
      </header>

      {bio && (
        <div className="pf-block">
          <p className="pf-bio">{bio}</p>
        </div>
      )}

      {keyFacts.length > 0 && (
        <div className="pf-facts">
          {keyFacts.map((f) => (
            <div key={f.label}>
              <h3 className="pf-section-title pf-fact-label">{f.label}</h3>
              <p className="pf-fact-value">{f.value}</p>
            </div>
          ))}
        </div>
      )}

      {chipCount > 0 && (
        <>
          <div className="pf-block pf-showall">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              aria-controls="pf-all-chips"
            >
              {showAll ? 'Nascondi i dettagli' : `Mostra tutto (${chipCount})`}
            </button>
          </div>
          {showAll && (
            <div id="pf-all-chips">
              {factChips.map((group) => (
                <div key={group.label}>
                  <h3 className="pf-section-title pf-chipgroup-label">{group.label}</h3>
                  <div className="options pf-chips">
                    {group.chips.map((c, i) => (
                      /* Chip di sola lettura: <span>, non bottoni — qui non c'è
                         niente da selezionare, è solo il valore del campo. La
                         chiave include l'indice perché due campi diversi
                         possono avere la stessa etichetta. */
                      <span key={`${i}-${c}`} className="chip chip-static">{c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Si mangia lo spazio che avanza, così con un profilo scarno la barra
          azioni finisce comunque in fondo allo schermo invece di restare
          appesa a metà pagina (vedi .pf-view in index.css). */}
      <div className="pf-fill" aria-hidden="true" />
      {actionBar}
    </main>
  )
}
