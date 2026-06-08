import { AppHeader } from '../components/AppHeader'

export type LegalDoc = 'privacy' | 'terms'

export const LEGAL_DOC_LABELS: Record<LegalDoc, string> = {
  privacy: 'Privacy Policy',
  terms: 'Termini di servizio',
}

// Testo segnaposto: verrà sostituito col documento definitivo (redatto con
// supporto legale) prima del lancio pubblico — vedi gdpr_e_legale.md.
const LEGAL_DOC_PARAGRAPHS: Record<LegalDoc, string[]> = {
  privacy: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt, neque porro quisquam est qui dolorem ipsum quia dolor sit amet.',
  ],
  terms: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi.',
    'Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est.',
    'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.',
    'Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat, quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia.',
  ],
}

// Schermata unica parametrizzata sul documento (stesso pattern di AdminScreen
// con `tab`): evita di avere due file quasi identici per Privacy Policy e ToS.
export function LegalScreen({ doc, onBack }: { doc: LegalDoc; onBack: () => void }) {
  return (
    <main className="app profile">
      <AppHeader backLabel="‹ Stanze" onBack={onBack} title={LEGAL_DOC_LABELS[doc]} />

      <section className="card box-shadow">
        {LEGAL_DOC_PARAGRAPHS[doc].map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
        <p className="hint">
          Testo segnaposto — verrà sostituito con il documento definitivo prima del lancio pubblico.
        </p>
      </section>
    </main>
  )
}
