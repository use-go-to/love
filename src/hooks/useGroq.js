// src/hooks/useGroq.js
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

async function ask(system, user, maxTokens = 300) {
  const key = import.meta.env.VITE_GROQ_API_KEY
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
    })
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

const SYSTEM = 'Tu es une présence bienveillante dans un espace intime pour un couple amoureux. Tu réponds toujours en français, avec poésie et profondeur. Sois court et intense.'

export async function getDailyQuestion() {
  return ask(SYSTEM, 'Génère UNE question philosophique profonde et belle pour un couple amoureux qui veut réfléchir ensemble ce soir. Maximum 2 phrases, très poétique.')
}

export async function getActivitySuggestion(mood) {
  return ask(SYSTEM, `Mood : "${mood}". Suggère 3 activités originales pour un couple à distance ce soir. Format : une emoji + courte description par ligne.`)
}

export async function getDailyChannels() {
  const raw = await ask(
    'Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.',
    `Génère 4 canaux thématiques pour un couple ce soir. JSON uniquement :
[
  {"id":"philo","icon":"🔮","name":"Philosophie","question":"..."},
  {"id":"music","icon":"🎵","name":"Musique","question":"..."},
  {"id":"dream","icon":"🌙","name":"Rêves","question":"..."},
  {"id":"moment","icon":"✨","name":"Présent","question":"..."}
]
Questions belles et profondes en français.`, 400)
  try { return JSON.parse(raw) } catch {
    return [
      { id: 'philo', icon: '🔮', name: 'Philosophie', question: 'La distance peut-elle renforcer un lien ?' },
      { id: 'music', icon: '🎵', name: 'Musique', question: 'Quelle chanson décrit notre histoire ?' },
      { id: 'dream', icon: '🌙', name: 'Rêves', question: 'Dans quel rêve veux-tu me retrouver ce soir ?' },
      { id: 'moment', icon: '✨', name: 'Présent', question: 'Décris ce que tu vois depuis là où tu es.' }
    ]
  }
}

export async function getReflection(message, theme) {
  return ask(SYSTEM, `Canal "${theme}". Message reçu : "${message}". Apporte une courte réflexion qui approfondit ou invite l'autre à répondre. Maximum 2 phrases.`)
}

export async function getStarter(theme) {
  return ask(SYSTEM, `Génère une phrase d'amorce de conversation sur "${theme}". Belle, poétique, 1 phrase.`)
}
