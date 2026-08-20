import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { FieldHead } from './ChoiceField'
import {
  AVATAR_STYLES,
  DEFAULT_STYLE,
  avatarValue,
  parseAvatar,
  presetsOf,
  type AvatarStyle,
} from '../../lib/profile/avatars'

// Contenuto del foglio «Avatar»: due schede (Pianeti, Costellazioni) e, sotto,
// le varianti di colore di quella scelta.
//
// «Unico e irripetibile» non è una formula pubblicitaria: il seed è l'id del
// profilo, e lo spazio delle immagini generate è ~3·10¹³ per Pianeti e ~6·10¹⁰
// per Costellazioni. Due persone non avranno mai lo stesso avatar — che è cosa
// diversa dal quanto si distinguono a 36px, su cui vedi la nota in avatars.ts.
//
// Le anteprime mostrano SEMPRE il proprio avatar — lo stesso seed in tutte le
// caselle, quindi lo stesso pianeta o la stessa costellazione — cambiando solo
// i colori. Mostrare avatar di altre persone farebbe scegliere una cosa e
// riceverne un'altra: qui la scelta è l'aspetto, non quale avatar ti tocca.
export function AvatarPicker({
  value,
  seed,
  nickname,
  onChange,
}: {
  value: string | null
  /** Id del profilo: è da lì che nasce l'avatar, e non cambia mai. */
  seed: string
  nickname: string
  onChange: (value: string) => void
}) {
  const current = parseAvatar(value)
  const [style, setStyle] = useState<AvatarStyle>(current?.style ?? DEFAULT_STYLE)
  const activePreset = current?.style === style ? current.preset : null

  return (
    <div className="field pf-field" role="group" aria-labelledby="pf-avatar-title">
      <FieldHead legend="Avatar" titleId="pf-avatar-title" />
      <p className="hint">
        Il tuo avatar è <strong>unico e irripetibile</strong>: nasce dal tuo
        profilo, non ne esiste un altro identico e non cambia mai, nemmeno se
        cambi nickname. Qui scegli solo che aspetto ha.
      </p>

      {/* Non è un vero tablist (niente tabpanel né frecce): bottoni con
          aria-pressed, come già fa il resto dell'editor. */}
      <div className="avatar-tabs">
        {AVATAR_STYLES.map((s) => (
          <button
            type="button"
            key={s.key}
            aria-pressed={style === s.key}
            className={style === s.key ? 'avatar-tab sel' : 'avatar-tab'}
            onClick={() => setStyle(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="avatar-presets">
        {presetsOf(style).map((p) => {
          const candidate = avatarValue(style, p.key, seed)
          const selected = activePreset === p.key
          return (
            <button
              type="button"
              key={p.key}
              className={selected ? 'avatar-preset sel' : 'avatar-preset'}
              aria-pressed={selected}
              onClick={() => onChange(candidate)}
            >
              <span className="avatar-bubble">
                <Avatar preset={candidate} nickname={nickname} />
              </span>
              <span className="avatar-preset-label">{p.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Riassunto per la riga dell'elenco: «pianeti · caldo».
export function avatarSummary(value: string | null): string | null {
  const parsed = parseAvatar(value)
  if (!parsed) return null
  const style = AVATAR_STYLES.find((s) => s.key === parsed.style)?.label ?? parsed.style
  return `${style.toLowerCase()} · ${parsed.preset}`
}
