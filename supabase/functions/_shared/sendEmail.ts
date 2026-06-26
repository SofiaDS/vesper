// Modulo condiviso: invio email transazionali tramite Brevo (https://api.brevo.com).
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export interface SendEmailParams {
  to: { email: string; name?: string }[]
  subject: string
  htmlContent: string
  textContent?: string
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = Deno.env.get('BREVO_API_KEY')!
  const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL')!
  const senderName = Deno.env.get('BREVO_SENDER_NAME') ?? 'Vesper'
  // Le email partono da no-reply@ ma le risposte vanno a una casella presidiata.
  const replyToEmail = Deno.env.get('BREVO_REPLY_TO') ?? 'support@vespercommunity.com'

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      replyTo: { email: replyToEmail },
      to: params.to,
      subject: params.subject,
      htmlContent: params.htmlContent,
      ...(params.textContent ? { textContent: params.textContent } : {}),
    }),
  })

  if (!res.ok) {
    throw new Error(`Brevo sendEmail failed: ${res.status} ${await res.text()}`)
  }
}
