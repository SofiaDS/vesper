// Wordmark "Vesper" al posto del titolo testuale, condiviso da tutte le
// schermate pre-login (auth, onboarding, verifica, PIN, stati di caricamento).
// L'<img> resta dentro l'<h1> così l'heading di livello 1 sopravvive per gli
// screen reader, con alt="Vesper" a fare da testo. width/height nativi evitano
// il layout shift durante il caricamento; lo stile vive in .brand-logo
// (index.css), il PNG trasparente in public/wordmark.png.
export function BrandMark() {
  return (
    <h1>
      <img className="brand-logo" src="/wordmark.png" alt="Vesper" width={344} height={105} />
    </h1>
  )
}
