import { CaretDown, CaretRight, Eye, EyeSlash, type Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

// Elenco di righe riassuntive dell'editor: icona, titolo, valore corrente e
// una freccia che apre il foglio del campo. Nato per la scheda «Vita», è ora
// il modo in cui si presentano anche «Identità» e «Privacy»: una schermata
// che si legge tutta in un colpo d'occhio invece di un form da scorrere.
export interface SummaryRow {
  key: string
  label: string
  icon: Icon
  /** Riga sotto il titolo: il valore scelto o, dove non c'è, cosa fa il campo. */
  value: string | null
  /** Testo di stato allineato a destra (interruttori: «attivo» / «nascosto»). */
  state?: { text: string; on: boolean }
  /** Flag show_* del campo. `undefined` = il campo non ne ha uno. */
  visible?: boolean
  /** Azione distruttiva (cancellazione account): riga in rosso. */
  danger?: boolean
  /** Testo al posto del valore quando il campo è vuoto. */
  emptyText?: string
  /** Contenuto del foglio che si apre toccando la riga. */
  body: ReactNode
}

export function SummaryRows({
  rows,
  openKey,
  onOpen,
}: {
  rows: SummaryRow[]
  openKey: string | null
  onOpen: (key: string) => void
}) {
  return (
    <div className="pf-lrows">
      {rows.map((r) => {
        const RowIcon = r.icon
        const empty = r.emptyText ?? 'da compilare'
        const open = openKey === r.key
        return (
          <button
            key={r.key}
            type="button"
            className={
              [
                'pf-lrow',
                r.value ? '' : 'pf-lrow-empty',
                open ? 'pf-lrow-open' : '',
                r.danger ? 'pf-lrow-danger' : '',
              ].filter(Boolean).join(' ')
            }
            onClick={() => onOpen(r.key)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={
              [
                r.label,
                r.value ?? empty,
                r.state?.text,
                // L'occhio è decorativo: quello che dice va detto anche qui.
                r.visible == null ? null : r.visible ? 'visibile nel profilo' : 'nascosto nel profilo',
              ].filter(Boolean).join(', ')
            }
          >
            <RowIcon size={20} className="pf-lrow-ico" aria-hidden="true" />
            <span className="pf-lrow-txt">
              {r.label}
              <span className="pf-lrow-val">{r.value ?? empty}</span>
            </span>
            {r.state && (
              <span className={r.state.on ? 'pf-lrow-state on' : 'pf-lrow-state'}>
                {r.state.text}
              </span>
            )}
            {/* L'occhio riassume il flag show_* del campo. Su un campo vuoto
                non compare: non c'è ancora niente da mostrare o nascondere. */}
            {r.visible != null && r.value &&
              (r.visible ? (
                <Eye size={17} className="pf-lrow-eye" aria-hidden="true" />
              ) : (
                <EyeSlash size={17} className="pf-lrow-eye" aria-hidden="true" />
              ))}
            {open ? (
              <CaretDown size={14} weight="bold" className="pf-lrow-caret" aria-hidden="true" />
            ) : (
              <CaretRight size={14} weight="bold" className="pf-lrow-caret" aria-hidden="true" />
            )}
          </button>
        )
      })}
    </div>
  )
}

// Riassunto di una lista per la riga: i primi `max` elementi e «+N» per il
// resto, così la riga non va a capo qualunque cosa l'utente abbia scelto.
export function summarize(items: readonly string[], max = 3): string | null {
  if (items.length === 0) return null
  const head = items.slice(0, max).join(', ')
  return items.length > max ? `${head} +${items.length - max}` : head
}
