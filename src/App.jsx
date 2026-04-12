import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { askGroq } from './groq'
import './App.css'

// ✏️ PERSONNALISE ICI
const MY_NAME  = 'Moi'
const HER_NAME = 'Lila'

const GROQ_SYSTEM = `Tu es un assistant bienveillant et poétique pour un couple amoureux.
Tu réponds en français, avec douceur et créativité.
Tu peux suggérer des idées de dates, des mots tendres, des questions pour mieux se connaître.
Sois chaleureux, jamais intrusif. Réponds en 2-3 phrases maximum.`

const ANIMATIONS = ['💫', '🌸', '✨', '🌙', '💕', '🌹', '⭐', '🦋']

export default function App() {
  const [view, setView] = useState('chat') // 'chat' | 'ai' | 'moments'
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sender, setSender] = useState(MY_NAME)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [floatingEmoji, setFloatingEmoji] = useState(null)
  const [moments, setMoments] = useState([])
  const [momentInput, setMomentInput] = useState('')
  const messagesEndRef = useRef(null)
  const aiEndRef = useRef(null)

  // Load messages & subscribe realtime
  useEffect(() => {
    loadMessages()
    loadMoments()

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    const animCh = supabase
      .channel('animations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'animations' }, payload => {
        triggerFloat(payload.new.type)
      })
      .subscribe()

    const momentCh = supabase
      .channel('moments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moments' }, payload => {
        setMoments(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(animCh)
      supabase.removeChannel(momentCh)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('channel', 'main')
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data)
  }

  async function loadMoments() {
    const { data } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setMoments(data)
  }

  function triggerFloat(emoji) {
    setFloatingEmoji({ id: Date.now(), char: emoji })
    setTimeout(() => setFloatingEmoji(null), 2500)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim()) return
    const text = input.trim()
    setInput('')
    await supabase.from('messages').insert({ text, sender, channel: 'main' })
  }

  async function sendAnimation(emoji) {
    await supabase.from('animations').insert({ type: emoji, from_user: sender })
    triggerFloat(emoji)
  }

  async function sendAiMessage(e) {
    e.preventDefault()
    if (!aiInput.trim() || aiLoading) return
    const text = aiInput.trim()
    setAiInput('')
    const newMsgs = [...aiMessages, { role: 'user', content: text }]
    setAiMessages(newMsgs)
    setAiLoading(true)
    try {
      const reply = await askGroq(GROQ_SYSTEM, text)
      setAiMessages([...newMsgs, { role: 'assistant', content: reply }])
    } catch {
      setAiMessages([...newMsgs, { role: 'assistant', content: 'Une erreur est survenue 🌙' }])
    }
    setAiLoading(false)
  }

  async function addMoment(e) {
    e.preventDefault()
    if (!momentInput.trim()) return
    const text = momentInput.trim()
    setMomentInput('')
    await supabase.from('moments').insert({ text, author: sender })
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="app">
      {/* Floating emoji */}
      {floatingEmoji && (
        <div key={floatingEmoji.id} className="float-emoji">{floatingEmoji.char}</div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-title">
          <span className="header-ornament">✦</span>
          <h1>À Deux</h1>
          <span className="header-ornament">✦</span>
        </div>
        <div className="sender-toggle">
          <button
            className={sender === MY_NAME ? 'active' : ''}
            onClick={() => setSender(MY_NAME)}
          >{MY_NAME}</button>
          <button
            className={sender === HER_NAME ? 'active' : ''}
            onClick={() => setSender(HER_NAME)}
          >{HER_NAME}</button>
        </div>
      </header>

      {/* Main content */}
      <main className="main">
        {/* CHAT VIEW */}
        {view === 'chat' && (
          <div className="chat-view">
            <div className="messages">
              {messages.length === 0 && (
                <div className="empty-state">
                  <span>💕</span>
                  <p>Votre espace privé commence ici</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.sender === MY_NAME ? 'mine' : 'hers'}`}>
                  <div className="bubble">
                    <p>{msg.text}</p>
                  </div>
                  <span className="msg-meta">{msg.sender} · {formatTime(msg.created_at)}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji bar */}
            <div className="emoji-bar">
              {ANIMATIONS.map(e => (
                <button key={e} onClick={() => sendAnimation(e)} className="emoji-btn">{e}</button>
              ))}
            </div>

            {/* Input */}
            <form className="input-bar" onSubmit={sendMessage}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Écris quelque chose…"
                autoComplete="off"
              />
              <button type="submit" disabled={!input.trim()}>↑</button>
            </form>
          </div>
        )}

        {/* AI VIEW */}
        {view === 'ai' && (
          <div className="ai-view">
            <div className="ai-intro">
              <div className="ai-icon">✨</div>
              <p>Un espace pour explorer, imaginer, trouver des idées ensemble.</p>
            </div>
            <div className="ai-messages">
              {aiMessages.map((m, i) => (
                <div key={i} className={`ai-msg ${m.role}`}>
                  {m.role === 'assistant' && <span className="ai-badge">✦</span>}
                  <p>{m.content}</p>
                </div>
              ))}
              {aiLoading && (
                <div className="ai-msg assistant">
                  <span className="ai-badge">✦</span>
                  <p className="typing">···</p>
                </div>
              )}
              <div ref={aiEndRef} />
            </div>
            <form className="input-bar" onSubmit={sendAiMessage}>
              <input
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder="Posez une question…"
                autoComplete="off"
              />
              <button type="submit" disabled={!aiInput.trim() || aiLoading}>↑</button>
            </form>
          </div>
        )}

        {/* MOMENTS VIEW */}
        {view === 'moments' && (
          <div className="moments-view">
            <div className="moments-list">
              {moments.length === 0 && (
                <div className="empty-state">
                  <span>🌙</span>
                  <p>Notez vos moments précieux ici</p>
                </div>
              )}
              {moments.map(m => (
                <div key={m.id} className="moment-card">
                  <p>{m.text}</p>
                  <span className="moment-meta">{m.author} · {formatDate(m.created_at)}</span>
                </div>
              ))}
            </div>
            <form className="input-bar" onSubmit={addMoment}>
              <input
                value={momentInput}
                onChange={e => setMomentInput(e.target.value)}
                placeholder="Un souvenir, une pensée…"
                autoComplete="off"
              />
              <button type="submit" disabled={!momentInput.trim()}>↑</button>
            </form>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        <button className={view === 'chat' ? 'active' : ''} onClick={() => setView('chat')}>
          <span>💬</span>
          <label>Chat</label>
        </button>
        <button className={view === 'ai' ? 'active' : ''} onClick={() => setView('ai')}>
          <span>✨</span>
          <label>Idées</label>
        </button>
        <button className={view === 'moments' ? 'active' : ''} onClick={() => setView('moments')}>
          <span>🌙</span>
          <label>Moments</label>
        </button>
      </nav>
    </div>
  )
}
