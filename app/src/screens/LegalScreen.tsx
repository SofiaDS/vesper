import { AppHeader } from '../components/AppHeader'

export type LegalDoc = 'privacy' | 'terms' | 'about'

export const LEGAL_DOC_LABELS: Record<LegalDoc, string> = {
  privacy: 'Privacy Policy',
  terms: 'Termini di servizio',
  about: 'Chi siamo',
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
        'Il titolare del trattamento dei dati personali raccolti tramite Vesper è [TITOLARE — DA COMPLETARE: nome o ragione sociale, indirizzo e, ove applicabile, P.IVA/C.F.].',
        'Per qualsiasi richiesta relativa ai tuoi dati personali puoi contattare il titolare all\'indirizzo privacy@vespercommunity.com.',
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
        'Contenuti generati dall\'utente: messaggi nelle chat di gruppo e nei messaggi privati, reazioni e segnalazioni inviate al team di moderazione.',
        'Dati tecnici: informazioni sul dispositivo necessarie per l\'invio delle notifiche push, log di accesso per finalità di sicurezza.',
        'Dati relativi all\'uso del servizio: stato di presenza online, conferme di lettura, relazione con la persona garante (vouch) e punteggio di reputazione, utilizzati per il funzionamento delle funzioni sociali dell\'app.',
      ],
    },
    {
      heading: 'Perché trattiamo i tuoi dati',
      paragraphs: [
        'Esecuzione del contratto: per creare e gestire il tuo account, mostrarti il tuo profilo e quello degli altri utenti, e permetterti di partecipare alle chat.',
        'Obbligo di legge: per verificare che tu abbia almeno 18 anni, in conformità con i requisiti normativi per i servizi digitali.',
        'Legittimo interesse: per la sicurezza della community (prevenire abusi, gestire segnalazioni e applicare le regole della community). I messaggi privati non vengono letti attivamente dal team di moderazione, se non a seguito di una segnalazione inviata da un utente.',
        'Consenso: per inviarti notifiche push relative all\'attività del tuo account (gestibile dalle impostazioni del dispositivo).',        
      ],
    },
    {
      heading: 'Cookie e tecnologie simili',
      paragraphs: [
        'Vesper utilizza esclusivamente cookie tecnici essenziali per il funzionamento dell\'app. Non utilizziamo cookie di profilazione o di terze parti per finalità pubblicitarie.'
      ]
    },
    {
      heading: 'Per quanto tempo conserviamo i dati',
      paragraphs: [
        'Video di verifica (liveness): cancellato automaticamente entro 30 giorni dal momento della verifica.',
        'Documento d\'identità: cancellato entro 24 ore dalla verifica dell\'età.',
        'Messaggi: vengono conservati per la durata di vita dell\'account; alla cancellazione dell\'account vengono cancellati o resi anonimi.',
        'Log di moderazione e le segnalazioni: conservati per il tempo necessario a gestire il caso ed eventuali appelli, e in seguito resi anonimi.',
      ],
    },
    {
      heading: 'Con chi condividiamo i dati',
      paragraphs: [
        'Database, autenticazione e archiviazione dei file sono forniti da Supabase, con dati ospitati su server nell\'Unione Europea (Francoforte, Germania).',
        'L\'hosting dell\'applicazione e la gestione del dominio sono forniti da Vercel (società con sede negli Stati Uniti). I trasferimenti verso gli Stati Uniti avvengono sulla base delle Clausole Contrattuali Standard previste dal GDPR.',
        'L\'invio delle email di servizio (es. conferma indirizzo, reimpostazione password) è gestito da Brevo, con server nell\'Unione Europea (Francia).',
        'Il testo dei messaggi viene analizzato da un servizio automatico di moderazione dei contenuti (OpenAI Moderation API) per individuare contenuti vietati. Questo comporta un trasferimento di dati verso gli Stati Uniti, effettuato sulla base delle Clausole Contrattuali Standard previste dal GDPR. Puoi consultare le clausole e le policy di protezione qui: https://openai.com/policies/privacy-policy.',
        'Le notifiche push vengono recapitate tramite i servizi di push dei browser e dei sistemi operativi (es. Google, Apple, Mozilla): a tali servizi viene trasmesso solo un identificativo tecnico necessario alla consegna, non il contenuto del tuo profilo.',
        'Le email che invii ai nostri indirizzi di contatto sono instradate tramite un servizio di inoltro email (ImprovMX, USA), sulla base delle Clausole Contrattuali Standard.',
        'Non vendiamo né condividiamo i tuoi dati con terzi per finalità pubblicitarie.',
      ],
    },
    {
      heading: 'I tuoi diritti',
      paragraphs: [
        'In qualsiasi momento puoi richiedere l\'accesso ai tuoi dati, la loro rettifica, la cancellazione, la limitazione del trattamento o la portabilità dei dati, e puoi opporti al trattamento.',
        'Puoi cancellare autonomamente il tuo account dalla sezione "Impostazioni" dell\'app: questa operazione avvia la cancellazione dei tuoi dati personali secondo i tempi descritti in questa informativa.',
        'Per qualsiasi richiesta relativa ai tuoi dati puoi scrivere a privacy@vespercommunity.com. Hai inoltre sempre il diritto di proporre reclamo al Garante per la protezione dei dati personali.',
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
      heading: 'Chi può iscriversi',
      paragraphs: [
        'Vesper è uno spazio dedicato alla community lesbica e queer, dove ogni orientamento è benvenuto, aperta a donne cis, persone trans e non binary. L\'iscrizione non è aperta a uomini cis, per preservare la natura di questo spazio.',
        'Al momento dell\'iscrizione l\'utente dichiara, sotto la propria responsabilità, di rientrare in una delle categorie ammesse. Una dichiarazione mendace costituisce violazione dei presenti Termini e comporta il ban immediato e definitivo dall\'app.',
      ],
    },
    {
      heading: 'Età minima',
      paragraphs: [
        'L\'iscrizione a Vesper è consentita esclusivamente a persone maggiorenni (18 anni compiuti). In fase di registrazione viene richiesta la data di nascita e una dichiarazione esplicita di maggiore età',
        'Dichiarare il falso sull\'età comporta il ban immediato e definitivo dall\'app e può comportare conseguenze legali. L\'utente solleva Vesper da ogni responsabilità derivante da dichiarazioni false rese al momento dell\'iscrizione.',
      ],
    },
    {
      heading: 'Regole della community',
      paragraphs: [
        'Sono vietati: molestie sessuali e contenuti non richiesti, hate speech (omofobia, transfobia, bifobia, razzismo, abilismo e simili), minacce, doxxing e condivisione di informazioni private altrui, spam commerciale o link sospetti, account falsi o automatizzati, e qualsiasi contenuto illegale.',
        'Linguaggio aggressivo o offensivo nelle discussioni e altre violazioni minori possono dare luogo ad avvisi o sospensioni temporanee (mute), in base alla gravità.',
        'Ogni utente può segnalare messaggi, profili o comportamenti scorretti tramite le funzioni di segnalazione presenti nell\'app. Le segnalazioni vengono esaminate dal team di moderazione, che può applicare avvisi, mute temporanei o ban in base alla gravità della violazione.',
        'In caso di ban, l\'utente ha diritto di presentare appello secondo le modalità indicate nell\'app al momento della sospensione.',
      ],
    },
    {
      heading: 'Proprietà dei contenuti e Limitazione di responsabilità',
      paragraphs: [
        'Licenza sui contenuti: L\'utente mantiene la piena proprietà dei contenuti che pubblica su Vesper. Tuttavia, nel momento in cui carichi foto, testi o messaggi, concedi a Vesper una licenza d’uso non esclusiva, gratuita, trasferibile e valida in tutto il mondo, necessaria per consentire all\'App di visualizzare, conservare e condividere tali contenuti con gli altri utenti secondo le funzionalità del servizio.',
        'Responsabilità dell\'utente: L\'utente è l\'unico ed esclusivo responsabile di qualsiasi contenuto pubblicato o trasmesso tramite l\'App. Garantisci di disporre di tutti i diritti necessari per la pubblicazione dei tuoi contenuti e di non violare diritti di terzi (inclusi diritti d\'autore, marchi o privacy).',
        'Esclusione di responsabilità: Vesper agisce come intermediario tecnico e non esercita un controllo preventivo su tutti i contenuti pubblicati dagli utenti. Pertanto, Vesper non si assume alcuna responsabilità per le opinioni, le dichiarazioni o i comportamenti di terzi all\'interno della community. L\'utente manleva Vesper da ogni pretesa, danno o richiesta di risarcimento derivante da contenuti o condotte di altri membri, fermo restando l\'impegno di Vesper a intervenire tempestivamente a seguito di segnalazioni documentate.',
      ]
    },
    {
      heading: 'Trattamento dei dati e tuoi diritti',
      paragraphs: [
        'Il trattamento dei tuoi dati personali è descritto nella Privacy Policy, disponibile in questa stessa sezione dell\'app. La Privacy Policy indica le finalità del trattamento, i tempi di conservazione e i diritti che puoi esercitare (accesso, rettifica, cancellazione, portabilità, opposizione).',
        'Per qualsiasi richiesta relativa ai tuoi dati personali puoi scrivere a privacy@vespercommunity.com.',
      ],
    },
    {
      heading: 'Modifiche ai Termini',
      paragraphs: [
        'Questi Termini di Servizio potranno essere aggiornati nel tempo, ad esempio in caso di nuove funzionalità o cambi normativi. In caso di modifiche sostanziali ti avviseremo tramite l\'app. Il rapporto è regolato dalla legge italiana. Per ogni controversia è competente il Foro di Lucca.',
      ],
    },
  ],
  about: [
    {
      heading: 'Chi siamo',
      paragraphs: [
        'Abbiamo creato Vesper perché crediamo che le connessioni più belle nascano quando ci si sente davvero liberi di essere se stessi. Sappiamo che certe conversazioni fluiscono con una naturalezza speciale quando si condivide un vissuto o una sensibilità comune.',
        'Per questo, Vesper è uno spazio pensato per donne, persone trans, non-binary e tutte le soggettività che non si identificano come uomini cisgender. Non è una chiusura verso l\'esterno — crediamo fermamente che il confronto con la diversità sia un arricchimento fondamentale — ma una scelta di design: vogliamo offrire un ambiente dove ogni incontro parta da una base di complicità immediata e serenità.',
        'Qui la gentilezza è il requisito fondamentale. La nostra moderazione è attiva per mantenere alta la qualità del clima e proteggere la tua tranquillità.',
        'Siamo qui per chi cerca legami basati sull\'ascolto e sull\'autenticità. Perché in un ambiente in cui ti senti a casa, le connessioni migliori accadono da sole.',
      ],
    },
  ],
}

// Schermata unica parametrizzata sul documento (stesso pattern di AdminScreen
// con `tab`): evita di avere due file quasi identici per Privacy Policy e ToS.
export function LegalScreen({ doc, onBack, backLabel = '‹ Stanze' }: { doc: LegalDoc; onBack: () => void; backLabel?: string }) {
  return (
    <main className="app profile">
      <AppHeader backLabel={backLabel} onBack={onBack} title={LEGAL_DOC_LABELS[doc]} />

      <section className="card box-shadow">
        {LEGAL_DOC_SECTIONS[doc].map((section, i) => (
          <div key={i}>
            {section.heading && <h2 className="pf-section-title">{section.heading}</h2>}
            {section.paragraphs.map((paragraph, j) => (
              <p key={j}>{paragraph}</p>
            ))}
          </div>
        ))}
      </section>
    </main>
  )
}
