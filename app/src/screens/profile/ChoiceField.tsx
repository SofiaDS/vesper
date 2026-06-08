import type { ReactNode } from 'react'

interface Option<T extends string> {
  value: T
  label: string
}

// Gruppo a scelta singola (radio): stesso markup "chip" già usato in tutto
// il form profilo, con "pulisci" opzionale per tornare a null. `children`
// ospita controlli accessori dello stesso campo (es. ShowInProfileToggle).
export function SingleChoiceField<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  clearable = true,
  children,
}: {
  legend: string
  name: string
  options: readonly Option<T>[]
  value: T | null
  onChange: (value: T | null) => void
  clearable?: boolean
  children?: ReactNode
}) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="options">
        {options.map((opt) => (
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
        {clearable && value && (
          <button type="button" className="link clear-sel" onClick={() => onChange(null)}>
            pulisci
          </button>
        )}
      </div>
      {children}
    </fieldset>
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
  children,
}: {
  legend: string
  options: readonly Option<T>[]
  selected: readonly T[]
  onToggle: (value: T) => void
  children?: ReactNode
}) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="options">
        {options.map((opt) => (
          <label key={opt.value} className="chip">
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => onToggle(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      {children}
    </fieldset>
  )
}

// Toggle "Mostra nel profilo": stessa label/input ripetuti identici per
// quasi ogni campo opzionale del form — estratto per non duplicarli N volte.
export function ShowInProfileToggle({
  checked,
  onChange,
  label = 'Mostra nel profilo',
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}) {
  return (
    <label className="declare mini">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}
