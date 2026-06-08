// Anteprima di un messaggio citato: autore + estratto del testo (troncato via
// CSS). Usata sia nella barra "rispondi a" sopra il composer sia incorporata
// nella bolla del messaggio che cita.
export function QuotePreview({ nickname, body }: { nickname: string; body: string }) {
  return (
    <span className="msg-quote">
      <span className="msg-quote-author">@{nickname}</span>
      <span className="msg-quote-body">{body}</span>
    </span>
  )
}
