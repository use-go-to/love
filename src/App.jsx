import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { askGroq } from './groq'
import './App.css'

const DAVID = 'David Lecointre'
const YAEL  = 'Yaël Lecointre'

const GROQ_SYSTEM = `Tu es un assistant bienveillant et poétique pour un couple amoureux, David et Yaël Lecointre.
Tu réponds en français, avec douceur et créativité.
Tu peux suggérer des idées de dates, des mots tendres, des questions pour mieux se connaître.
Sois chaleureux, jamais intrusif. Réponds en 2-3 phrases maximum.`

const LOVE_EMOJIS = ['💕','🌹','✨','🦋','🌸','💫','🌙','⭐','🔥','💌','🫶','💞','🌺','🍓','🕊️','💎']

// ── Particules coeur SVG ──
function HeartParticle({ x, y, size, delay, color }) {
  return (
    <div className="heart-particle" style={{
      left: x + '%', bottom: y + 'px',
      width: size, height: size,
      animationDelay: delay + 's',
      color
    }}>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
      </svg>
    </div>
  )
}

// ── Écran de sélection ──
function LoginScreen({ onSelect }) {
  const [hovered, setHovered] = useState(null)
  const [particles] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 200,
      size: (Math.random() * 16 + 8) + 'px',
      delay: Math.random() * 4,
      color: ['#c9a96e','#f4a0c0','#d4b8f0','#ff6b9d'][Math.floor(Math.random() * 4)]
    }))
  )

  return (
    <div className="login-screen">
      {particles.map(p => <HeartParticle key={p.id} {...p} />)}

      <div className="login-content">
        <div className="login-ornament">✦ ✦ ✦</div>
        <h1 className="login-title">À Deux</h1>
        <p className="login-sub">Notre espace privé</p>
        <div className="login-divider">
          <span>❧</span>
        </div>
        <p className="login-question">Qui êtes-vous ?</p>

        <div className="login-cards">
          <button
            className={`login-card ${hovered === 'david' ? 'hovered' : ''}`}
            onMouseEnter={() => setHovered('david')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(DAVID)}
          >
            <div className="card-inner">
              <div className="card-avatar david">D</div>
              <div className="card-name">David</div>
              <div className="card-surname">Lecointre</div>
              <div className="card-hearts">💙</div>
            </div>
          </button>

          <div className="login-or">
            <div className="or-line" />
            <span>ou</span>
            <div className="or-line" />
          </div>

          <button
            className={`login-card ${hovered === 'yael' ? 'hovered' : ''}`}
            onMouseEnter={() => setHovered('yael')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(YAEL)}
          >
            <div className="card-inner">
              <div className="card-avatar yael">Y</div>
              <div className="card-name">Yaël</div>
              <div className="card-surname">Lecointre</div>
              <div className="card-hearts">🌸</div>
            </div>
          </button>
        </div>

        <p className="login-footer">Votre choix sera mémorisé 🔒</p>
      </div>
    </div>
  )
}

// ── Float emoji ──
function FloatLayer({ floats }) {
  return (
    <>
      {floats.map(f => (
        <div key={f.id} className="float-emoji" style={{ left: f.x + '%' }}>
          {f.char}
        </div>
      ))}
    </>
  )
}

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem('adeux_user') || null)
  const [view, setView] = useState('chat')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [floats, setFloats] = useState([])
  const [moments, setMoments] = useState([])
  const [momentInput, setMomentInput] = useState('')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [emojiPicker, setEmojiPicker] = useState(false)
  const messagesEndRef = useRef(null)
  const aiEndRef = useRef(null)

  // PWA
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setShowInstall(false)
  }

  // Realtime
  useEffect(() => {
    if (!user) return
    loadMessages(); loadMoments()

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
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'moments' }, p => {
        setMoments(prev => prev.filter(m => m.id !== p.old.id))
      }).subscribe()

    return () => {
      supabase.removeChannel(ch1)
      supabase.removeChannel(ch2)
      supabase.removeChannel(ch3)
    }
  }, [user])

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
    const x = 15 + Math.random() * 70
    setFloats(prev => [...prev, { id, char: emoji, x }])
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 3000)
  }

  function handleSelect(name) {
    localStorage.setItem('adeux_user', name)
    setUser(name)
  }

  function handleLogout() {
    localStorage.removeItem('adeux_user')
    setUser(null)
    setMessages([]); setMoments([]); setAiMessages([])
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim()) return
    const text = input.trim(); setInput('')
    await supabase.from('messages').insert({ text, sender: user, channel: 'main' })
  }

  async function sendEmoji(emoji) {
    setEmojiPicker(false)
    // Burst local + remote
    for (let i = 0; i < 3; i++) {
      setTimeout(() => addFloat(emoji), i * 180)
    }
    await supabase.from('animations').insert({ type: emoji, from_user: user })
  }

  async function sendAi(e) {
    e.preventDefault()
    if (!aiInput.trim() || aiLoading) return
    const text = aiInput.trim(); setAiInput('')
    const next = [...aiMessages, { role: 'user', content: text }]
    setAiMessages(next); setAiLoading(true)
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
    const text = momentInput.trim(); setMomentInput('')
    await supabase.from('moments').insert({ text, author: user })
  }

  async function deleteMoment(id) {
    await supabase.from('moments').delete().eq('id', id)
    setMoments(prev => prev.filter(m => m.id !== id))
  }

  const fmt = ts => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const fmtDate = ts => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const isMe = sender => sender === user

  if (!user) return <LoginScreen onSelect={handleSelect} />

  return (
    <div className="app" onClick={() => emojiPicker && setEmojiPicker(false)}>
      <FloatLayer floats={floats} />

      {/* Install banner */}
      {showInstall && (
        <div className="install-banner">
          <span>📲 Installer sur l'écran d'accueil</span>
          <div className="install-actions">
            <button className="install-btn" onClick={handleInstall}>Installer</button>
            <button className="install-dismiss" onClick={() => setShowInstall(false)}>✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-row">
          <div className="header-title">
            <span className="ornament">✦</span>
            <h1>À Deux</h1>
            <span className="ornament">✦</span>
          </div>
          <div className="header-right">
            {showInstall === false && !installPrompt && (
              <button className="pwa-btn" title="Installer l'app" onClick={handleInstall}>📲</button>
            )}
            <button className="logout-btn" onClick={handleLogout} title="Changer d'utilisateur">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="user-pill">
          <span className="user-dot" style={{ background: user === DAVID ? '#6eb5c9' : '#f4a0c0' }} />
          <span>{user === DAVID ? 'David' : 'Yaël'}</span>
        </div>
      </header>

      {/* Main */}
      <main className="main">

        {/* CHAT */}
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
                <div key={msg.id} className={`msg-wrap ${isMe(msg.sender) ? 'mine' : 'hers'}`}>
                  <div className="bubble"><p>{msg.text}</p></div>
                  <span className="meta">{msg.sender === DAVID ? 'David' : 'Yaël'} · {fmt(msg.created_at)}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji picker */}
            <div className="emoji-zone" onClick={e => e.stopPropagation()}>
              <button className="emoji-toggle" onClick={() => setEmojiPicker(v => !v)}>
                {emojiPicker ? '✕' : '💝'}
              </button>
              {emojiPicker && (
                <div className="emoji-picker">
                  <div className="emoji-grid">
                    {LOVE_EMOJIS.map(e => (
                      <button key={e} className="emoji-btn" onClick={() => sendEmoji(e)}>{e}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form className="input-row" onSubmit={sendMessage}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Écris quelque chose…" autoComplete="off" />
              <button type="submit" className="send-btn" disabled={!input.trim()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* IA */}
        {view === 'ai' && (
          <div className="pane">
            <div className="ai-intro">
              <div className="ai-glow">✨</div>
              <p>Un espace pour explorer, imaginer,<br/>trouver des idées ensemble.</p>
            </div>
            <div className="messages">
              {aiMessages.length === 0 && (
                <div className="empty">
                  <p className="ai-hint">"Suggère-nous une idée de soirée romantique"</p>
                </div>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} className={`msg-wrap ${m.role === 'user' ? 'mine' : 'hers'}`}>
                  {m.role === 'assistant' && <span className="ai-badge">✦</span>}
                  <div className="bubble"><p>{m.content}</p></div>
                </div>
              ))}
              {aiLoading && (
                <div className="msg-wrap hers">
                  <span className="ai-badge">✦</span>
                  <div className="bubble"><p className="dots">···</p></div>
                </div>
              )}
              <div ref={aiEndRef} />
            </div>
            <form className="input-row" onSubmit={sendAi}>
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Posez une question…" autoComplete="off" />
              <button type="submit" className="send-btn" disabled={!aiInput.trim() || aiLoading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* MOMENTS */}
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
                  <button className="moment-delete" onClick={() => deleteMoment(m.id)} title="Supprimer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                  <p>{m.text}</p>
                  <span className="meta">{m.author === DAVID ? 'David' : 'Yaël'} · {fmtDate(m.created_at)}</span>
                </div>
              ))}
            </div>
            <form className="input-row" onSubmit={addMoment}>
              <input value={momentInput} onChange={e => setMomentInput(e.target.value)} placeholder="Un souvenir, une pensée…" autoComplete="off" />
              <button type="submit" className="send-btn" disabled={!momentInput.trim()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Nav */}
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
