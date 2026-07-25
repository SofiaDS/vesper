import { useState, type ComponentProps } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'

// Campo password con toggle "mostra/nascondi": senza, chi sbaglia a digitare
// non ha modo di accorgersene e riprova alla cieca.
//
// Va usato dentro un <label className="field"> al posto dell'<input>: il
// wrapper serve a posizionare il bottone dentro al bordo del campo. Accetta le
// stesse props di un <input> tranne `type`, che gestisce lui.
//
// `secretName` finisce nell'aria-label del toggle: serve ai campi PIN, dove
// "Mostra password" sarebbe la parola sbagliata.
export function PasswordInput({
  secretName = 'password',
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & { secretName?: string }) {
  const [shown, setShown] = useState(false)
  const action = `${shown ? 'Nascondi' : 'Mostra'} ${secretName}`
  return (
    <span className="pw-wrap">
      <input {...props} type={shown ? 'text' : 'password'} />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setShown((s) => !s)}
        aria-label={action}
        aria-pressed={shown}
        title={action}
      >
        {shown ? (
          <EyeSlash size={18} weight="duotone" aria-hidden="true" />
        ) : (
          <Eye size={18} weight="duotone" aria-hidden="true" />
        )}
      </button>
    </span>
  )
}
