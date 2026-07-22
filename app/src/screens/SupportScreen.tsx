import { Heart, CreditCard, Wallet, Coffee, ArrowUpRight } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { AppHeader } from '../components/AppHeader'

// Una piattaforma su cui si può sostenere il progetto. Per aggiungerne una in
// futuro basta una riga in SUPPORT_LINKS: label + url + icona (+ eventuale nota).
// Nessun'altra modifica necessaria.
export interface SupportLink {
  label: string
  url: string
  icon: Icon
  note?: string
}

export const SUPPORT_LINKS: SupportLink[] = [
  {
    label: 'PayPal',
    url: 'https://www.paypal.me/vespercommunity',
    icon: CreditCard,
    note: 'Carta o saldo PayPal',
  },
  {
    label: 'Revolut',
    url: 'https://revolut.me/poppi48/pocket/2zQmDFqmbj',
    icon: Wallet,
    note: 'Invia un contributo con Revolut',
  },
  {
    label: 'Ko-fi',
    url: 'https://ko-fi.com/vespercommunity',
    icon: Coffee,
    note: 'Offrici un caffè, una tantum o ogni mese',
  },
]

// Schermata secondaria (impilata, non una tab): raggiunta dalla voce "Sostieni
// Vesper" in Altro. Hero + elenco piattaforme di donazione; ogni voce apre il
// link del provider in una nuova scheda. Stile "Inchiostro & oro" via variabili
// di tema, quindi si adatta da sola a tema scuro e chiaro.
export function SupportScreen({ onBack, backLabel = '‹ Altro' }: { onBack: () => void; backLabel?: string }) {
  return (
    <main className="app profile">
      <AppHeader backLabel={backLabel} onBack={onBack} title="Sostieni Vesper" />

      <section className="card box-shadow support-hero">
        <span className="support-hero-ico" aria-hidden="true">
          <Heart size={26} weight="duotone" />
        </span>
        <h2>Vesper esiste grazie a te</h2>
        <p>
          Vesper nasce dal lavoro di due founder ed è un progetto indipendente: niente
          pubblicità, niente vendita di dati, moderazione attenta e attenzione reale alla
          privacy. 
          Un ambiente dove ogni incontro parte da una base di complicità e serenità.
          Mandarlo avanti ha un costo reale — server, moderazione, sviluppo. Se ti va di
          sostenerci, ogni contributo, anche piccolo, fa una differenza concreta.
        </p>
      </section>

      <section className="card box-shadow">
        <h3 className="pf-section-title">Scegli come sostenerci</h3>
        {SUPPORT_LINKS.map((link) => {
          const Ico = link.icon
          return (
            <a
              key={link.label}
              className="nav-row"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label}, si apre in una nuova scheda`}
            >
              <span className="nav-row-ico" aria-hidden="true">
                <Ico size={20} weight="duotone" />
              </span>
              <span className="nav-row-label">
                <span className="nav-row-title">{link.label}</span>
                {link.note && <span className="nav-row-note">{link.note}</span>}
              </span>
              <ArrowUpRight className="nav-row-chev" size={16} weight="bold" aria-hidden="true" />
            </a>
          )
        })}
      </section>

      <p className="support-note">
        I contributi coprono i costi di server e lo sviluppo di Vesper. Grazie per rendere
        possibile questo spazio.
      </p>
    </main>
  )
}
