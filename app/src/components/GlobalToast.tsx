import type { MessageNotification } from '../hooks/useMessageNotifications'

// Toast di notifica in-app (vedi mockup `.global-toast`): compare in basso
// quando arriva un messaggio/menzione in una conversazione che non stai
// guardando. È puramente di presentazione: cosa mostrare e cosa fare al click
// arrivano da Home tramite props.
export function GlobalToast({
  toast,
  onOpen,
  onDismiss,
}: {
  toast: MessageNotification | null
  onOpen: () => void
  onDismiss: () => void
}) {
  if (!toast) return null

  const icon = toast.kind === 'dm' ? '✉' : toast.isMention ? '@' : '#'
  const title = toast.isMention
    ? `@${toast.senderNickname} ti ha menzionata`
    : `Nuovo messaggio da @${toast.senderNickname}`
  const sub =
    toast.kind === 'dm'
      ? `In privato · ${toast.preview}`
      : `${toast.roomName} · ${toast.preview}`

  return (
    // role="status" + aria-live: lo screen reader annuncia il toast all'arrivo.
    // La key forza il rimontaggio (e quindi l'animazione + l'annuncio) a ogni
    // nuova notifica, anche se il toast precedente non era ancora sparito.
    <div className="global-toast" role="status" aria-live="polite" key={toast.key}>
      <button
        type="button"
        className="global-toast-main"
        onClick={onOpen}
        aria-label={`${title}. ${sub}. Apri.`}
      >
        <span className="global-toast-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="global-toast-text">
          <span className="global-toast-title">{title}</span>
          <span className="global-toast-sub">{sub}</span>
        </span>
      </button>
      <button
        type="button"
        className="global-toast-close"
        onClick={onDismiss}
        aria-label="Chiudi notifica"
      >
        ✕
      </button>
    </div>
  )
}
