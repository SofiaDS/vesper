// Apertura del client email predefinito per segnalazioni di bug e suggerimenti:
// niente form custom né backend — solo un mailto: con oggetto pre-compilato per
// il triage (tag tipo/piattaforma/identificatori) e un corpo con un suggerimento
// su cosa scrivere. Decisione di prodotto: stack_tecnico.md §9 "Segnala un
// problema — mailto pre-compilato".
export type SupportRequestType = 'bug' | 'feedback'

// Placeholder: andranno sostituiti con le mailbox dedicate quando il dominio
// sarà attivo (separate da supporto generale, appelli e legale/GDPR).
const SUPPORT_RECIPIENTS: Record<SupportRequestType, string> = {
  bug: 'support@vespercommunity.com',
  feedback: 'support@vespercommunity.com',
}

const SUPPORT_SUBJECT_TAG: Record<SupportRequestType, string> = {
  bug: '#bug',
  feedback: '#feedback',
}

const SUPPORT_BODY_HINT: Record<SupportRequestType, string> = {
  bug: 'Descrivi cosa stavi facendo quando è successo, cosa ti aspettavi e cosa è successo invece…',
  feedback: 'Raccontaci la tua idea: a cosa servirebbe e in che situazione la useresti…',
}

function platformTag(): string {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return '#android'
  if (/iphone|ipad|ipod/i.test(ua)) return '#ios'
  return '#web'
}

// Riferimento breve e non riconducibile alla persona (NON l'id reale, NON il
// nickname/email/città): basta a chi gestisce la mailbox per correlare con i
// log lato server senza esporre dati personali in caso di forward.
function shortRef(value: string): string {
  return value.replace(/-/g, '').slice(0, 8).toUpperCase()
}

export interface SupportEmailContext {
  type: SupportRequestType
  screen: string
  userId?: string
}

export function openSupportEmail({ type, screen, userId }: SupportEmailContext) {
  const reportRef = shortRef(crypto.randomUUID())
  const userRef = userId ? shortRef(userId) : '—'

  const subject = [
    SUPPORT_SUBJECT_TAG[type],
    platformTag(),
    `#u-${userRef}`,
    `#s-${reportRef}`,
  ].join(' ')

  const body = [
    SUPPORT_BODY_HINT[type],
    '',
    '— non cancellare le righe seguenti, aiutano a ritrovare la segnalazione —',
    `Schermata: ${screen}`,
    `Riferimento: ${reportRef}`,
  ].join('\n')

  const url = `mailto:${SUPPORT_RECIPIENTS[type]}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
