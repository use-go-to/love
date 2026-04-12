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

const EMOJIS = ['💫','🌸','✨','🌙','💕','🌹','⭐','🦋']

export default function App() {
  const [view, setView] = useState('chat')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sender, setSender] = useState(MY_NAME)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [floats, setFloats] = useState([])
  const [moments, setMoments] = useState([])
  const [momentInput, setMomentInput] = useState('')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installVisible, setInstallVisible] = useState(false)
  const messagesEndRef = useRef(null)
  const aiEndRef = useRef(null)

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setInstallVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallVisible(false)
  }

  // Realtime
  useEffect(() => {
    loadMessages()
    loadMoments()

    const ch1 = supabase.channel('msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, p => {
        setMessages(prev => [...prev, p.new])
      }).subscribe()

    const ch2 = supabase.channel('anims')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'animations' }, p => {
        addFloat(p.new.type)
      }).subscribe()

    const ch3 = supabase.channel('moms')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moments' }, p => {
        setMoments(prev => [p.new, ...prev])
      }).subscribe()

    return () => {
      supabase.removeChannel(ch1)
      supabase.removeChannel(ch2)
      supabase.removeChannel(ch3)
    }
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [aiMessages])

  async function loadMessages() {
    const { data } = await supabase.from('messages').select('*')
      .eq('channel', 'main').order('created_at', { ascending: true }).limit(100)
    if (data) setMessages(data)
  }

  async function loadMoments() {
    const { data } = await supabase.from('moments').select('*')
      .order('created_at', { ascending: false }).limit(50)
    if (data) setMoments(data)
  }

  function addFloat(emoji) {
    const id = Date.now() + Math.random()
    const x = 30 + Math.random() * 40
    setFloats(prev => [...prev, { id, char: emoji, x }])
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 2600)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim()) return
    const text = input.trim()
    setInput('')
    await supabase.from('messages').insert({ text, sender, channel: 'main' })
  }

  async function sendEmoji(emoji) {
    await supabase.from('animations').insert({ type: emoji, from_user: sender })
    addFloat(emoji)
  }

  async function sendAi(e) {
    e.preventDefault()
    if (!aiInput.trim() || aiLoading) return
    const text = aiInput.trim()
    setAiInput('')
    const next = [...aiMessages, { role: 'user', content: text }]
    setAiMessages(next)
    setAiLoading(true)
    try {
      const reply = await askGroq(GROQ_SYSTEM, text)
      setAiMessages([...next, { role: 'assistant', content: reply }])
    } catch {
      setAiMessages([...next, { role: 'assistant', content: 'Une erreur est survenue 🌙' }])
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

  const fmt = ts => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const fmtDate = ts => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="app">
      {/* Floating emojis */}
      {floats.map(f => (
        <div key={f.id} className="float" style={{ left: `${f.x}%` }}>{f.char}</div>
      ))}

      {/* PWA Install banner */}
      {installVisible && (
        <div className="install-banner">
          <span>📲 Installer l'app sur votre écran d'accueil</span>
          <div className="install-actions">
            <button className="install-btn" onClick={handleInstall}>Installer</button>
            <button className="install-dismiss" onClick={() => setInstallVisible(false)}>✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-top">
          <div className="header-title">
            <span className="ornament">✦</span>
            <h1>À Deux</h1>
            <span className="ornament">✦</span>
          </div>
        </div>
        <div className="sender-toggle">
          <button className={sender === MY_NAME ? 'active' : ''} onClick={() => setSender(MY_NAME)}>
            {MY_NAME}
          </button>
          <button className={sender === HER_NAME ? 'active' : ''} onClick={() => setSender(HER_NAME)}>
            {HER_NAME}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="main">

        {/* ── CHAT ── */}
        {view === 'chat' && (
          <div className="pane">
            <div className="messages">
              {messages.length === 0 && (
                <div className="empty">
                  <div className="empty-icon">💕</div>
                  <p>Votre espace privé commence ici</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`msg-wrap ${msg.sender === MY_NAME ? 'mine' : 'hers'}`}>
                  <div className="bubble">
                    <p>{msg.text}</p>
                  </div>
                  <span className="meta">{msg.sender} · {fmt(msg.created_at)}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="emoji-row">
              {EMOJIS.map(e => (
                <button key={e} className="emoji-btn" onClick={() => sendEmoji(e)}>{e}</button>
              ))}
            </div>

            <form className="input-row" onSubmit={sendMessage}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Écris quelque chose…"
                autoComplete="off"
              />
              <button type="submit" className="send-btn" disabled={!input.trim()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* ── IA ── */}
        {view === 'ai' && (
          <div className="pane">
            <div className="ai-intro">
              <div className="ai-glow">✨</div>
              <p>Un espace pour explorer, imaginer,<br/>trouver des idées ensemble.</p>
            </div>
            <div className="messages">
              {aiMessages.length === 0 && (
                <div className="empty">
                  <p className="ai-hint">Essayez : "Suggère-nous une idée de soirée"</p>
                </div>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} className={`msg-wrap ${m.role === 'user' ? 'mine' : 'hers ai-reply'}`}>
                  {m.role === 'assistant' && <span className="ai-badge">✦</span>}
                  <div className="bubble">
                    <p>{m.content}</p>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="msg-wrap hers ai-reply">
                  <span className="ai-badge">✦</span>
                  <div className="bubble"><p className="dots">···</p></div>
                </div>
              )}
              <div ref={aiEndRef} />
            </div>
            <form className="input-row" onSubmit={sendAi}>
              <input
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder="Posez une question…"
                autoComplete="off"
              />
              <button type="submit" className="send-btn" disabled={!aiInput.trim() || aiLoading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* ── MOMENTS ── */}
        {view === 'moments' && (
          <div className="pane">
            <div className="messages">
              {moments.length === 0 && (
                <div className="empty">
                  <div className="empty-icon">🌙</div>
                  <p>Notez vos moments précieux ici</p>
                </div>
              )}
              {moments.map(m => (
                <div key={m.id} className="moment-card">
                  <p>{m.text}</p>
                  <span className="meta">{m.author} · {fmtDate(m.created_at)}</span>
                </div>
              ))}
            </div>
            <form className="input-row" onSubmit={addMoment}>
              <input
                value={momentInput}
                onChange={e => setMomentInput(e.target.value)}
                placeholder="Un souvenir, une pensée…"
                autoComplete="off"
              />
              <button type="submit" className="send-btn" disabled={!momentInput.trim()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="nav">
        <button className={view === 'chat' ? 'active' : ''} onClick={() => setView('chat')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Chat</span>
        </button>
        <button className={view === 'ai' ? 'active' : ''} onClick={() => setView('ai')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>Idées</span>
        </button>
        <button className={view === 'moments' ? 'active' : ''} onClick={() => setView('moments')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>Moments</span>
        </button>
      </nav>
    </div>
  )
}
