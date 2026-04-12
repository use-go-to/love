// src/lib/supabase.js
// Supabase = base de données temps réel, gratuit, ultra simple
// Setup : supabase.com → New project → Settings → API → copie URL + anon key

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Envoyer un message ──
export async function sendMessage(text, sender, channel = 'main') {
  const { error } = await supabase
    .from('messages')
    .insert({ text, sender, channel })
  if (error) console.error('sendMessage:', error)
}

// ── Écouter les messages en temps réel ──
export function listenMessages(channel = 'main', callback) {
  // Charge les 50 derniers messages d'abord
  supabase
    .from('messages')
    .select('*')
    .eq('channel', channel)
    .order('created_at', { ascending: true })
    .limit(50)
    .then(({ data }) => { if (data) callback(data) })

  // Puis écoute les nouveaux en temps réel
  const sub = supabase
    .channel(`messages:${channel}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `channel=eq.${channel}`
    }, payload => {
      callback(prev => [...(Array.isArray(prev) ? prev : []), payload.new])
    })
    .subscribe()

  return () => supabase.removeChannel(sub)
}

// ── Envoyer une animation ──
export async function sendAnimation(type, from) {
  await supabase.from('animations').insert({ type, from })
}

// ── Écouter les animations reçues ──
export function listenAnimations(myName, callback) {
  const sub = supabase
    .channel('animations')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'animations'
    }, payload => {
      if (payload.new.from !== myName) callback(payload.new)
    })
    .subscribe()
  return () => supabase.removeChannel(sub)
}
