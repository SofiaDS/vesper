// TODO: sostituire con il link PayPal reale prima del lancio
const PAYPAL_URL = 'https://paypal.me/vesperapp'

export function SupporterButton() {
  return (
    <section className="card" style={{ marginTop: '1rem' }}>
      <h2 className="pf-section-title">Sostieni Vesper</h2>
      <p className="hint">
        Vesper è un progetto indipendente, senza pubblicità e senza investitori.
        Se vuoi contribuire a tenerlo in vita, puoi farlo con una donazione libera.
      </p>
      <a
        href={PAYPAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-ghost"
        style={{ display: 'inline-block', marginTop: '0.5rem' }}
      >
        Sostieni con PayPal ↗
      </a>
    </section>
  )
}
