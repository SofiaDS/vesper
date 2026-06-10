// Modulo condiviso: chiamata a OpenAI Moderation API per il filtro AI (P38, soft mode).
// Richiede il secret OPENAI_API_KEY nelle Edge Function Secrets del progetto.
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

export async function checkOpenAiModeration(text: string): Promise<boolean> {
  if (!text.trim()) return false

  const res = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'omni-moderation-latest', input: text }),
  })

  if (!res.ok) {
    console.error('[moderate-message] OpenAI Moderation API error:', res.status, await res.text())
    return false
  }

  const data = await res.json()
  return Boolean(data.results?.[0]?.flagged)
}
