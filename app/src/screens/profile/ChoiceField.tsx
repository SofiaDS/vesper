import { useId, type ReactNode } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'

interface Option<T extends string> {
  value: T
  label: string
}

// Quanti chip restano visibili prima del taglio (redesign 2E/2F). Sei bastano
// a far capire di che tipo di scelta si tratta senza costruire il muro di chip
// che rendeva l'editor illeggibile; il resto arriva con «+ altri N», quindi
// nessuna opzione viene tolta davvero.
export const CHIP_LIMIT = 6

// Le opzioni da disegnare: le prime CHIP_LIMIT più quelle già selezionate che
// cadrebbero oltre il taglio — una scelta fatta non deve mai sparire dietro
// un «+ altri N».
function visibleOptions<T extends string>(
  options: readonly Option<T>[],
  isSelected: (v: T) => boolean,
  expanded: boolean,
): readonly Option<T>[] {
  if (expanded || options.length <= CHIP_LIMIT) return options
  const head = options.slice(0, CHIP_LIMIT)
  const tail = options.slice(CHIP_LIMIT).filter((o) => isSelected(o.value))
  return [...head, ...tail]
}

function MoreChip({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button type="button" className="chip chip-more" onClick={onClick}>
      + altri {count}
    </button>
  )
}

// Intestazione del campo: titolo a sinistra, pillola occhio a destra.
// Estratta perché la ripetono sia i due ChoiceField sia i fogli di 2F.
//
// Il titolo NON è un <legend>: per essere la didascalia del gruppo un legend
// dev'essere il primo figlio del <fieldset>, mentre qui divide la riga con la
// pillola occhio. Usiamo quindi un contenitore `role="group"` +
// `aria-labelledby` (vedi ChoiceGroup), che dà lo stesso risultato agli screen
// reader senza fingere una struttura fieldset/legend rotta.
export function FieldHead({
  legend,
  titleId,
  count,
  visibility,
}: {
  legend: ReactNode
  titleId: string
  // Contatore di selezione accanto al titolo (solo scelta multipla).
  count?: number
  visibility?: ReactNode
}) {
  return (
    <div className="pf-field-head">
      <p className="pf-field-title" id={titleId}>
        {legend}
        {count != null && count > 0 && (
          <span className="pf-count">
            <span className="visually-hidden">selezionate: </span>
            {count}
          </span>
        )}
      </p>
      {visibility}
    </div>
  )
}

// Gruppo a scelta singola (radio): stesso markup "chip" già usato in tutto
// il form profilo, con "pulisci" opzionale per tornare a null. `visibility`
// è la pillola occhio nell'intestazione, `children` ospita controlli
// accessori dello stesso campo (es. il nome dell'istituto per la formazione).
export function SingleChoiceField<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  clearable = true,
  visibility,
  expanded = false,
  onExpand,
  children,
}: {
  legend: string
  name: string
  options: readonly Option<T>[]
  value: T | null
  onChange: (value: T | null) => void
  clearable?: boolean
  visibility?: ReactNode
  // Taglio a CHIP_LIMIT chip: attivo solo se chi ci usa sa come espanderlo
  // (lo stato vive in ProfileEditor, così sopravvive ai cambi di scheda).
  expanded?: boolean
  onExpand?: () => void
  children?: ReactNode
}) {
  const titleId = useId()
  const shown = onExpand ? visibleOptions(options, (v) => v === value, expanded) : options
  const hidden = options.length - shown.length

  return (
    <div className="field pf-field" role="group" aria-labelledby={titleId}>
      <FieldHead legend={legend} titleId={titleId} visibility={visibility} />
      <div className="options">
        {shown.map((opt) => (
          <label key={opt.value} className="chip">
            <input
              type="radio"
              name={name}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
        {hidden > 0 && onExpand && <MoreChip count={hidden} onClick={onExpand} />}
        {clearable && value && (
          <button type="button" className="link clear-sel" onClick={() => onChange(null)}>
            pulisci
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

// Gruppo a scelta multipla (checkbox): il toggle del singolo valore resta
// a carico di chi chiama, che riusa l'helper `toggle` già presente in
// ProfileEditor — qui ci occupiamo solo del markup ripetuto.
export function MultiChoiceField<T extends string>({
  legend,
  options,
  selected,
  onToggle,
  visibility,
  expanded = false,
  onExpand,
  children,
}: {
  legend: string
  options: readonly Option<T>[]
  selected: readonly T[]
  onToggle: (value: T) => void
  visibility?: ReactNode
  expanded?: boolean
  onExpand?: () => void
  children?: ReactNode
}) {
  const titleId = useId()
  const shown = onExpand
    ? visibleOptions(options, (v) => selected.includes(v), expanded)
    : options
  const hidden = options.length - shown.length

  return (
    <div className="field pf-field" role="group" aria-labelledby={titleId}>
      <FieldHead legend={legend} titleId={titleId} count={selected.length} visibility={visibility} />
      <div className="options">
        {shown.map((opt) => (
          <label key={opt.value} className="chip">
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => onToggle(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
        {hidden > 0 && onExpand && <MoreChip count={hidden} onClick={onExpand} />}
      </div>
      {children}
    </div>
  )
}

// Pillola "visibile / nascosto": sostituisce il vecchio ShowInProfileToggle
// (una checkbox «Mostra nel profilo» ripetuta quasi per ogni campo). Icona
// *e* testo, mai la sola icona: l'occhio da solo non dice se il campo è
// mostrato o nascosto a chi non conosce la convenzione.
export function VisibilityPill({
  checked,
  onChange,
  field,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  // Nome del campo, per un'etichetta accessibile che si capisca fuori contesto.
  field: string
}) {
  return (
    <button
      type="button"
      className="pf-eye"
      aria-pressed={checked}
      aria-label={`${field}: ${checked ? 'visibile nel profilo' : 'nascosta nel profilo'}`}
      onClick={() => onChange(!checked)}
    >
      {checked ? (
        <Eye size={15} aria-hidden="true" />
      ) : (
        <EyeSlash size={15} aria-hidden="true" />
      )}
      {checked ? 'visibile' : 'nascosto'}
    </button>
  )
}
