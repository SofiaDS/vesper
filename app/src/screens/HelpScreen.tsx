import { AppHeader } from '../components/AppHeader'
import { MAX_TEMATICHE } from '../constants/limits'

export type HelpDoc = 'faq' | 'safety'

export const HELP_DOC_LABELS: Record<HelpDoc, string> = {
  faq: 'Domande frequenti',
  safety: 'Consigli di sicurezza',
}

interface FaqItem {
  q: string
  a: string[]
}

interface FaqCategory {
  label: string
  items: FaqItem[]
}

// Le risposte descrivono SOLO quello che l'app fa davvero oggi: le soglie
// vengono da permessi_e_strati.md e dai controlli in codice (Strato 2 per i DM,
// Strato 3 per le garanzie, MAX_TEMATICHE per le stanze). Il filtro DM in
// ricezione è progettato ma non ancora attivo (checkDmFilter restituisce sempre
// true), quindi qui non compare: documentarlo prometterebbe una funzione che
// non c'è. Quando verrà attivato, va aggiunta una voce sotto "Messaggi privati".
const FAQ_CATEGORIES: FaqCategory[] = [
  {
    label: 'Iscrizione e verifica',
    items: [
      {
        q: 'Chi può iscriversi a Vesper?',
        a: [
          'Vesper è dedicata alla community lesbica e queer. Sono benvenute donne cis, persone trans, non binary e intersex.',
          'L\'iscrizione non è aperta a uomini cis. Dichiarare il falso su questo punto comporta il ban definitivo.',
        ],
      },
      {
        q: 'Devo avere 18 anni?',
        a: [
          'Sì, l\'età minima è 18 anni compiuti, senza eccezioni. La data di nascita che inserisci in fase di iscrizione non permette tecnicamente di indicare un\'età inferiore.',
        ],
      },
      {
        q: 'Perché devo registrare un video di verifica?',
        a: [
          'È un breve video silenzioso di pochi secondi che serve a una cosa sola: accertare che dietro all\'account ci sia una persona reale, e non un profilo automatico.',
          'Non viene giudicato il tuo aspetto e non c\'è nessun riconoscimento facciale automatico. Chi modera controlla solo che sia una persona vera.',
        ],
      },
      {
        q: 'Cosa succede al mio video dopo la verifica?',
        a: [
          'Viene cancellato automaticamente entro 30 giorni dal momento della verifica. Se entri con una garanzia, il video non ti viene mai chiesto e quindi non ne viene conservato nessuno.',
        ],
      },
      {
        q: 'La mia verifica è stata rifiutata: posso riprovare?',
        a: [
          'Sì. Puoi registrare un nuovo video e ripresentarlo. Se pensi che il rifiuto sia stato un errore, scrivi al supporto dalla sezione Altro.',
        ],
      },
    ],
  },
  {
    label: 'Garanti',
    items: [
      {
        q: 'Cos\'è una garante?',
        a: [
          'È una persona già dentro Vesper che conferma di conoscerti e che sei reale. Con due garanzie salti sia il video di verifica sia i primi 7 giorni di attesa, ed entri direttamente con i permessi da utente attiva.',
        ],
      },
      {
        q: 'Come funziona la garanzia?',
        a: [
          'Durante l\'iscrizione indichi i nickname di due persone già iscritte. Ricevono una notifica e hanno 48 ore per confermare.',
          'Se confermano entrambe, entri subito. Se una non risponde o scadono le 48 ore, entri normalmente e ti verifichi col video: non perdi nulla.',
        ],
      },
      {
        q: 'Chi può fare da garante?',
        a: [
          'Solo chi ha raggiunto il livello di utente fidata: almeno 30 giorni dalla verifica e circa 100 messaggi scritti nelle stanze.',
        ],
      },
      {
        q: 'Cosa rischio se garantisco per qualcuna?',
        a: [
          'Garantire è una piccola responsabilità: se la persona che hai garantito viene poi bannata per un comportamento grave, la garanzia risulta fallita e la possibilità di garantire ti viene sospesa per un periodo.',
          'Rifiutare una richiesta di garanzia, invece, non ha nessuna conseguenza per te. Se non conosci davvero quella persona, rifiuta senza pensarci.',
        ],
      },
    ],
  },
  {
    label: 'Messaggi privati e permessi',
    items: [
      {
        q: 'Perché non posso inviare messaggi privati?',
        a: [
          'I messaggi privati non sono attivi da subito. Servono almeno 7 giorni dalla verifica e 20 messaggi scritti nelle stanze.',
          'Non è una punizione: è quello che rende difficile la vita a chi si iscrive solo per infastidire e sparire.',
        ],
      },
      {
        q: 'Ho scritto a qualcuna ma non risponde: è arrivato il messaggio?',
        a: [
          'Il primo messaggio a una persona è una richiesta, che lei può accettare o rifiutare. Finché non la accetta, la conversazione non si apre.',
        ],
      },
      {
        q: 'Come faccio a salire di livello?',
        a: [
          'Solo col tempo e partecipando: 7 giorni e 20 messaggi per i messaggi privati, 30 giorni e circa 100 messaggi per diventare garante. Non c\'è modo di accelerare e non si può pagare per farlo.',
        ],
      },
    ],
  },
  {
    label: 'Stanze e chat',
    items: [
      {
        q: 'Cos\'è la Foyer?',
        a: [
          'È la stanza comune in cui entrano tutte: la trovi già aperta appena finita l\'iscrizione. Non si può abbandonare, perché è lo spazio condiviso della community.',
        ],
      },
      {
        q: 'A quante stanze tematiche posso partecipare?',
        a: [
          `Puoi seguirne fino a ${MAX_TEMATICHE} alla volta. Se vuoi entrarne in una nuova quando hai raggiunto il limite, esci prima da una di quelle che segui.`,
        ],
      },
      {
        q: 'Come esco da una stanza?',
        a: [
          'Dall\'elenco delle stanze, oppure dal menu ⋮ in alto a destra mentre sei dentro la stanza. Puoi rientrare quando vuoi.',
        ],
      },
    ],
  },
  {
    label: 'Profilo e foto',
    items: [
      {
        q: 'Chi vede le informazioni del mio profilo?',
        a: [
          'Decidi tu campo per campo. Nell\'editor del profilo ogni informazione ha un interruttore "visibile" che ne controlla la comparsa sul profilo pubblico: quello che tieni nascosto non viene mostrato a nessun\'altra utente.',
        ],
      },
      {
        q: 'Le foto vengono controllate?',
        a: [
          'Sì. Ogni foto che carichi passa dalla moderazione prima di comparire sul profilo pubblico. Finché è in attesa la vedi solo tu.',
        ],
      },
      {
        q: 'Posso scegliere quale foto viene mostrata per prima?',
        a: [
          'Sì: nella scheda Foto dell\'editor puoi indicare la foto principale. È quella che compare nei risultati di ricerca e all\'inizio della tua galleria.',
        ],
      },
    ],
  },
  {
    label: 'Sicurezza e segnalazioni',
    items: [
      {
        q: 'Come blocco una persona?',
        a: [
          'Dal suo profilo, oppure dal menu ⋮ in alto a destra dentro la conversazione privata. Non serve dare spiegazioni e non c\'è nessun limite a quante persone puoi bloccare.',
        ],
      },
      {
        q: 'La persona che ho bloccato lo scopre?',
        a: [
          'No. Non riceve nessuna notifica e non le viene detto in nessun modo. Semplicemente non riesce più a vedere il tuo profilo né a scriverti.',
        ],
      },
      {
        q: 'Cosa succede quando segnalo qualcuna?',
        a: [
          'La segnalazione arriva al team di moderazione, che la valuta e decide. Chi hai segnalato non sa che sei stata tu.',
          'Segnalare e bloccare sono due cose diverse e puoi fare entrambe: il blocco protegge te subito, la segnalazione protegge anche le altre.',
        ],
      },
      {
        q: 'Ho ricevuto un messaggio che mi ha spaventata. Cosa faccio?',
        a: [
          'Blocca e segnala. Se la situazione è grave o continua, scrivi al supporto dalla sezione Altro: le segnalazioni gravi vengono guardate per prime.',
        ],
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        q: 'Come cambio email o password?',
        a: [
          'Da Altro › Cambia email e Altro › Cambia password. In entrambi i casi ti viene chiesta la password attuale, così nessun altro può modificarle se lascia il telefono incustodito.',
        ],
      },
      {
        q: 'Ho dimenticato la password.',
        a: [
          'Nella schermata di accesso tocca "Password dimenticata?": ti mandiamo un link via email per reimpostarla.',
        ],
      },
      {
        q: 'Non ricevo le notifiche.',
        a: [
          'Controlla di aver dato il permesso alle notifiche in Altro › Impostazioni, e che non siano disattivate per Vesper dalle impostazioni del telefono.',
        ],
      },
      {
        q: 'Come cancello il mio account?',
        a: [
          'Dall\'editor del profilo, scheda Privacy, in fondo. La cancellazione è definitiva e immediata: messaggi, foto e dati vengono rimossi in modo permanente e non è possibile recuperarli.',
        ],
      },
    ],
  },
]

interface SafetySection {
  heading: string
  paragraphs: string[]
}

// Consigli di sicurezza, adattati a chi usa Vesper: oltre alle truffe classiche
// (soldi, profili falsi, spostamento su altre app) trattano il rischio di
// outing, che per questa community è il danno più concreto e non compare nei
// vademecum generici delle app di incontri.
const SAFETY_SECTIONS: SafetySection[] = [
  {
    heading: 'Non mandare mai soldi',
    paragraphs: [
      'Nessuna persona che hai conosciuto qui dovrebbe chiederti denaro, ricariche, carte regalo o codici: è la truffa più diffusa su qualsiasi app di incontri, e arriva quasi sempre dopo settimane di conversazione affettuosa.',
      'Diffida in particolare delle emergenze improvvise: un ricovero, un blocco in dogana, un problema con la banca. Se ti succede, non mandare nulla e segnala il profilo.',
    ],
  },
  {
    heading: 'Vai piano con i dati personali',
    paragraphs: [
      'Cognome, indirizzo, posto di lavoro, scuola, targa, numero di telefono e profili social dicono molto più di quanto sembri, e insieme bastano a trovarti nel mondo reale.',
      'Non c\'è fretta di condividerli. Una persona in buona fede capisce che tu voglia prendere tempo; chi insiste per averli subito ti sta dicendo qualcosa su di sé.',
    ],
  },
  {
    heading: 'Attenzione a chi vuole spostarsi subito altrove',
    paragraphs: [
      'Chi propone dopo pochi messaggi di continuare su un\'altra app di messaggistica o via email spesso lo fa per uscire da uno spazio moderato, dove può essere segnalato e bloccato.',
      'Finché non ti fidi davvero, resta qui: dentro Vesper hai il blocco, la segnalazione e un team che legge le segnalazioni.',
    ],
  },
  {
    heading: 'Riconoscere un profilo falso',
    paragraphs: [
      'Segnali tipici: foto troppo perfette o da servizio fotografico, una storia che si sposta continuamente all\'estero o "in missione", risposte generiche che non tengono conto di quello che hai scritto, rifiuto sistematico di fare una videochiamata.',
      'Un modo semplice per farsi un\'idea è cercare le sue foto con la ricerca immagini di un motore di ricerca: se compaiono su altri profili con nomi diversi, hai la risposta.',
    ],
  },
  {
    heading: 'Il primo incontro di persona',
    paragraphs: [
      'Scegli un luogo pubblico e frequentato, e restaci: niente casa sua, casa tua o posti isolati al primo appuntamento.',
      'Dì a un\'amica dove vai, con chi e a che ora pensi di tornare. Condividi la posizione dal telefono se puoi.',
      'Vai e torna con i tuoi mezzi, così puoi andartene quando vuoi senza dipendere da nessuno. Parti col telefono carico.',
      'Tieni d\'occhio il tuo bicchiere e non lasciarlo incustodito.',
      'Se qualcosa non ti torna, puoi andartene in qualsiasi momento e senza spiegazioni. Non devi essere gentile a costo della tua sicurezza.',
    ],
  },
  {
    heading: 'Proteggi la tua privacy — e chi non è fuori',
    paragraphs: [
      'Non tutte sono libere di essere visibili, e per qualcuna essere riconosciuta qui può significare problemi in famiglia, al lavoro o peggio.',
      'Prima di caricare una foto guarda cosa c\'è intorno: un cartello, una vetrina, una divisa o la vista dalla finestra bastano a dire dove vivi o lavori. Nell\'editor del profilo puoi tenere nascosto ogni campo che non vuoi mostrare, città compresa.',
      'Se condividi il telefono con qualcuno, attiva il blocco con PIN in Altro › Impostazioni: chiede un codice all\'apertura dell\'app.',
      'Vale anche al contrario: non dare per scontato che l\'altra persona sia fuori. Non parlare di lei con altre e non nominarla fuori dall\'app senza il suo consenso.',
    ],
  },
  {
    heading: 'Screenshot e foto intime',
    paragraphs: [
      'Qualsiasi cosa mandi può essere salvata da chi la riceve. Non esiste una funzione, in nessuna app, che possa impedirlo davvero.',
      'Se decidi di mandare foto intime, valuta di escludere il viso e ogni dettaglio riconoscibile — tatuaggi, ambiente, specchi.',
      'Diffondere immagini intime altrui senza consenso è un reato. Se succede a te, conserva le prove, segnala il profilo e rivolgiti alle autorità: non è colpa tua.',
    ],
  },
  {
    heading: 'La sicurezza del tuo account',
    paragraphs: [
      'Usa per Vesper una password lunga e diversa da quelle che usi altrove: se un altro sito viene violato, la tua email e la tua password finiscono in liste che qualcuno proverà anche qui.',
      'Non condividere la password con nessuno, per nessun motivo. Il team di Vesper non te la chiederà mai, né via email né in chat.',
    ],
  },
  {
    heading: 'Fidati del tuo istinto',
    paragraphs: [
      'Se una conversazione ti mette a disagio, non devi trovare una giustificazione razionale per interromperla. Quel disagio è già una ragione sufficiente.',
      'Non sei obbligata a rispondere, a spiegarti o a dare una seconda possibilità. Puoi bloccare e basta.',
    ],
  },
  {
    heading: 'Blocca e segnala',
    paragraphs: [
      'Blocca dal profilo della persona o dal menu ⋮ dentro la conversazione. Il blocco è totale e silenzioso: non riceve nessuna notifica, e smette di vederti e di poterti scrivere.',
      'Segnala se il comportamento riguarda anche le altre: minacce, molestie, richieste di denaro, profili falsi, sospetti su chi non dovrebbe essere qui. Chi segnali non sa chi l\'ha fatto.',
      'Per le situazioni gravi o che continuano, scrivi al supporto da Altro. E se sei in pericolo immediato, chiama il 112.',
    ],
  },
]

// Schermata unica parametrizzata sul documento, stesso pattern di LegalScreen.
// Le FAQ usano <details> nativi: l'apri/chiudi, la semantica e la navigazione da
// tastiera arrivano dal browser, senza stato né ARIA da mantenere a mano.
export function HelpScreen({
  doc,
  onBack,
  backLabel = '‹ Altro',
}: {
  doc: HelpDoc
  onBack: () => void
  backLabel?: string
}) {
  return (
    <main className="app profile">
      <AppHeader backLabel={backLabel} onBack={onBack} title={HELP_DOC_LABELS[doc]} />

      {doc === 'faq' ? (
        <>
          <p className="hint help-intro">
            Non trovi quello che cerchi? Scrivici da Altro › Segnala un bug o
            Dacci un suggerimento.
          </p>
          {FAQ_CATEGORIES.map((cat) => (
            <section key={cat.label} className="card box-shadow help-card">
              <h2 className="pf-section-title">{cat.label}</h2>
              {cat.items.map((item) => (
                <details key={item.q} className="faq-item">
                  <summary className="faq-q">{item.q}</summary>
                  {item.a.map((p, i) => (
                    <p key={i} className="faq-a">{p}</p>
                  ))}
                </details>
              ))}
            </section>
          ))}
        </>
      ) : (
        <>
          <p className="hint help-intro">
            Vesper è uno spazio protetto, ma nessuna app può sostituire la tua
            prudenza. Ecco cosa ti consigliamo.
          </p>
          {SAFETY_SECTIONS.map((section) => (
            <section key={section.heading} className="card box-shadow help-card">
              <h2 className="pf-section-title">{section.heading}</h2>
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
        </>
      )}
    </main>
  )
}
