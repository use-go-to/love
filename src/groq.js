const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export async function askGroq(systemPrompt, userMessage) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 300,
      temperature: 0.8
    })
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? '...'
}
