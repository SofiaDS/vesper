import { AppHeader } from '../components/AppHeader'

export type LegalDoc = 'privacy' | 'terms'

export const LEGAL_DOC_LABELS: Record<LegalDoc, string> = {
  privacy: 'Privacy Policy',
  terms: 'Termini di servizio',
}

interface LegalSection {
  heading?: string
  paragraphs: string[]
}

// Bozza redatta sulla base di gdpr_e_legale.md: va validata con un consulente
// legale prima del lancio pubblico (formulazioni esatte, registro dei
// trattamenti, DPA con i fornitori). Vedi anche utenti_e_identita.md e
// minori_e_eta.md per le clausole su appartenenza ed età.
const LEGAL_DOC_SECTIONS: Record<LegalDoc, LegalSection[]> = {
  privacy: [
    {
      heading: 'Titolare del trattamento',
      paragraphs: [
        'Il titolare del trattamento dei dati personali raccolti tramite Vesper è il gestore dell\'app, contattabile all\'indirizzo privacy@vesperapp.it per qualsiasi richiesta relativa ai tuoi dati personali.',
      ],
    },
    {
      heading: 'Quali dati raccogliamo',
      paragraphs: [
        'Dati di account: indirizzo email e password (conservata in forma cifrata).',
        'Dati di profilo: nickname, età, città, bio, interessi e foto che scegli di caricare.',
        'Dati di categoria particolare (art. 9 GDPR): identità di genere e orientamento sessuale dichiarati in fase di iscrizione, necessari per garantire che la community sia composta dalle persone a cui Vesper è dedicata.',
        'Dato biometrico: un breve video di verifica ("liveness check") raccolto al momento dell\'iscrizione, usato esclusivamente per accertare che l\'account sia gestito da una persona reale e corrispondente al profilo dichiarato. Non viene effettuato alcun riconoscimento facciale automatizzato.',
        'Documento d\'identità: richiesto solo in casi eccezionali, ad esempio in presenza di una segnalazione per sospetta età falsa, ed esclusivamente per verificare la maggiore età.',
        'Contenuti generati dall\'utente: messaggi nelle chat di gruppo e nei messaggi privati, segnalazioni inviate al team di moderazione.',
        'Dati tecnici: informazioni sul dispositivo necessarie per l\'invio delle notifiche push, log di accesso per finalità di sicurezza.',
      ],
    },
    {
      heading: 'Perché trattiamo i tuoi dati',
      paragraphs: [
        'Per fornire il servizio: creare e gestire il tuo account, mostrarti il tuo profilo e quello degli altri utenti, farti partecipare alle chat (esecuzione del contratto con te).',
        'Per verificare che tu rientri nella platea di persone a cui Vesper è destinato e che tu abbia almeno 18 anni, sulla base del consenso esplicito che fornisci in fase di iscrizione.',
        'Per la sicurezza della community: prevenire abusi, gestire segnalazioni e applicare le regole della community (legittimo interesse a mantenere l\'app sicura per le persone che la usano).',
        'Per inviarti notifiche push relative all\'attività del tuo account, sulla base del consenso che presti dalle impostazioni del dispositivo.',
      ],
    },
    {
      heading: 'Per quanto tempo conserviamo i dati',
      paragraphs: [
        'Il video di verifica liveness viene cancellato automaticamente entro 30 giorni dal momento della verifica.',
        'Un eventuale documento d\'identità caricato per la verifica dell\'età viene cancellato entro 24 ore dalla verifica e non viene conservato per altri scopi.',
        'I messaggi nelle chat e nei DM vengono conservati per la durata di vita dell\'account; alla cancellazione dell\'account vengono cancellati o resi anonimi.',
        'I log di moderazione e le segnalazioni vengono conservati per il tempo necessario a gestire il caso ed eventuali appelli, e in seguito resi anonimi.',
      ],
    },
    {
      heading: 'Con chi condividiamo i dati',
      paragraphs: [
        'I tuoi dati sono ospitati su server con sede nell\'Unione Europea, forniti dal nostro fornitore di infrastruttura (Supabase).',
        'Il testo dei messaggi viene analizzato da un servizio automatico di moderazione dei contenuti (OpenAI Moderation API) per individuare contenuti vietati. Questo comporta un trasferimento di dati verso gli Stati Uniti, effettuato sulla base delle clausole contrattuali standard previste dal GDPR.',
        'Per l\'invio delle notifiche push utilizziamo un fornitore terzo (OneSignal), con server distribuiti a livello internazionale.',
        'Non vendiamo né condividiamo i tuoi dati con terzi per finalità pubblicitarie.',
      ],
    },
    {
      heading: 'I tuoi diritti',
      paragraphs: [
        'In qualsiasi momento puoi richiedere l\'accesso ai tuoi dati, la loro rettifica, la cancellazione, la limitazione del trattamento o la portabilità dei dati, e puoi opporti al trattamento.',
        'Puoi cancellare autonomamente il tuo account dalla sezione "Impostazioni" dell\'app: questa operazione avvia la cancellazione dei tuoi dati personali secondo i tempi descritti in questa informativa.',
        'Per qualsiasi richiesta relativa ai tuoi dati puoi scrivere a privacy@vesperapp.it. Hai inoltre sempre il diritto di proporre reclamo al Garante per la protezione dei dati personali.',
      ],
    },
    {
      heading: 'Sicurezza dei dati',
      paragraphs: [
        'Adottiamo misure tecniche e organizzative per proteggere i tuoi dati da accessi non autorizzati, perdita o divulgazione, tra cui la cifratura delle comunicazioni e l\'accesso ai dati limitato al personale e ai volontari di moderazione autorizzati.',
      ],
    },
    {
      heading: 'Modifiche a questa informativa',
      paragraphs: [
        'Questa informativa potrà essere aggiornata nel tempo, ad esempio in caso di nuove funzionalità o cambi di fornitori. In caso di modifiche sostanziali ti avviseremo tramite l\'app.',
      ],
    },
  ],
  terms: [
    {
      paragraphs: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi.',
        'Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est.',
        'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.',
        'Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat, quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia.',
      ],
    },
  ],
}

// Schermata unica parametrizzata sul documento (stesso pattern di AdminScreen
// con `tab`): evita di avere due file quasi identici per Privacy Policy e ToS.
export function LegalScreen({ doc, onBack }: { doc: LegalDoc; onBack: () => void }) {
  return (
    <main className="app profile">
      <AppHeader backLabel="‹ Stanze" onBack={onBack} title={LEGAL_DOC_LABELS[doc]} />

      <section className="card box-shadow">
        {LEGAL_DOC_SECTIONS[doc].map((section, i) => (
          <div key={i}>
            {section.heading && <h2 className="pf-section-title">{section.heading}</h2>}
            {section.paragraphs.map((paragraph, j) => (
              <p key={j}>{paragraph}</p>
            ))}
          </div>
        ))}
        <p className="hint">
          Bozza informativa — verrà validata con un consulente legale prima del lancio pubblico.
        </p>
      </section>
    </main>
  )
}
