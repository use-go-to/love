// src/App.jsx
import { useState, useEffect, useRef } from 'react'
import HeartCanvas from './components/HeartCanvas'
import { sendMessage, listenMessages, sendAnimation, listenAnimations } from './lib/supabase'
import { getDailyQuestion, getActivitySuggestion, getDailyChannels, getReflection, getStarter } from './hooks/useGroq'

// ── PERSONNALISE ICI ──────────────────────────
const MY_NAME  = 'Moi'   // ← ton prénom
const HER_NAME = 'Lila'  // ← son prénom
// ─────────────────────────────────────────────

const MOODS = ['🌙 Contemplatif', '💫 Amoureux', '🔥 Passionné', '🌊 Paisible']
const ANIMS = [
  { id: 'orbit',   emoji: '💫', label: 'Cœur orbital' },
  { id: 'stars',   emoji: '🌠', label: 'Étoiles filantes' },
  { id: 'aurora',  emoji: '🌌', label: 'Aurore boréale' },
  { id: 'galaxy',  emoji: '✨', label: "Galaxie d'amour" },
  { id: 'rose',    emoji: '🌹', label: 'Rose éternelle' },
  { id: 'moon',    emoji: '🌙', label: 'Même lune' },
]

export default function App() {
  const [screen, setScreen]               = useState('home')
  const [mood, setMood]                   = useState('💫 Amoureux')
  const [toast, setToast]                 = useState(null)
  const [messages, setMessages]           = useState([])
  const [chatInput, setChatInput]         = useState('')
  const [channels, setChannels]           = useState([])
  const [activeChannel, setActiveChannel] = useState('philo')
  const [chanMsgs, setChanMsgs]           = useState({})
  const [chanInput, setChanInput]         = useState('')
  const [dailyQ, setDailyQ]               = useState('...')
  const [activities, setActivities]       = useState('...')
  const [aiTyping, setAiTyping]           = useState(false)
  const [inAnim, setInAnim]               = useState(null)
  const chatEnd = useRef(null)
  const chanEnd = useRef(null)

  // ── Init IA ──
  useEffect(() => {
    getDailyQuestion().then(setDailyQ)
    getDailyChannels().then(ch => { setChannels(ch); setActiveChannel(ch[0]?.id || 'philo') })
    getActivitySuggestion(mood).then(setActivities)
  }, [])

  // ── Chat principal temps réel ──
  useEffect(() => {
    const unsub = listenMessages('main', data => {
      setMessages(typeof data === 'function' ? data : data)
    })
    return unsub
  }, [])

  // ── Canal actif temps réel ──
  useEffect(() => {
    const unsub = listenMessages(activeChannel, data => {
      setChanMsgs(prev => ({ ...prev, [activeChannel]: typeof data === 'function' ? data(prev[activeChannel] || []) : data }))
    })
    return unsub
  }, [activeChannel])

  // ── Animations reçues ──
  useEffect(() => {
    const unsub = listenAnimations(MY_NAME, anim => {
      setInAnim(anim)
      setTimeout(() => setInAnim(null), 4000)
    })
    return unsub
  }, [])

  // ── Auto-scroll ──
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { chanEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chanMsgs])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800) }

  async function handleSendChat() {
    if (!chatInput.trim()) return
    await sendMessage(chatInput.trim(), MY_NAME, 'main')
    setChatInput('')
  }

  async function handleSendChannel() {
    if (!chanInput.trim()) return
    const ch = channels.find(c => c.id === activeChannel)
    await sendMessage(chanInput.trim(), MY_NAME, activeChannel)
    setChanInput('')
    setAiTyping(true)
    try {
      const reply = await getReflection(chanInput.trim(), ch?.name || activeChannel)
      await sendMessage(reply, '✦ IA', activeChannel)
    } finally { setAiTyping(false) }
  }

  async function handleMood(m) {
    setMood(m); setActivities('...')
    const r = await getActivitySuggestion(m)
    setActivities(r)
  }

  async function handleStarter() {
    const ch = channels.find(c => c.id === activeChannel)
    const s = await getStarter(ch?.name || 'amour')
    showToast(s)
  }

  const currentChanMsgs = chanMsgs[activeChannel] || []

  return (
    <div className="app">
      <Stars />

      {/* Animation reçue */}
      {inAnim && (
        <div className="anim-incoming">
          <div style={{fontSize:48}}>💌</div>
          <div>{HER_NAME} t'a envoyé<br/>"{inAnim.type}"</div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast show"><span style={{color:'var(--rose)'}}>♥</span> {toast}</div>}

      {/* Header */}
      <header className="header">
        <div>
          <div className="header-title"><span>à</span> deux</div>
          <div className="header-sub">{HER_NAME} est en ligne ✦</div>
        </div>
        <div className="avatar-pair">
          <div className="avatar me">🌿<div className="online-dot"/></div>
          <div className="avatar her">🌸</div>
        </div>
      </header>

      {/* ════ HOME ════ */}
      {screen === 'home' && (
        <div className="screen">
          <HeartCanvas />

          <div className="philo-card">
            <div className="card-label">✦ réflexion du jour · IA</div>
            <p className="philo-text">"{dailyQ}"</p>
            <button className="btn-ghost" onClick={() => setScreen('channels')}>Réfléchir ensemble →</button>
          </div>

          <div className="mood-card">
            <div className="card-label">Comment tu te sens là ?</div>
            <div className="chip-row">
              {MOODS.map(m => (
                <button key={m} className={`chip ${mood===m?'selected':''}`} onClick={() => handleMood(m)}>{m}</button>
              ))}
            </div>
          </div>

          <div className="section-label">Idées du moment · IA ✦</div>
          <div className="activity-card">
            <div className="activity-text">{activities}</div>
          </div>

          <div className="section-label">Envoie un élan d'amour</div>
          <div className="anim-grid">
            {ANIMS.map(a => (
              <button key={a.id} className="anim-card" onClick={async () => {
                await sendAnimation(a.label, MY_NAME)
                showToast(`${a.label} envoyé à ${HER_NAME} ♥`)
              }}>
                <div className="anim-icon">{a.emoji}</div>
                <div className="anim-label">{a.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════ CHAT ════ */}
      {screen === 'chat' && (
        <div className="screen chat-screen">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="empty-state">Commencez à vous écrire ✦</div>
            )}
            {messages.map((msg, i) => (
              <div key={msg.id || i} className={`msg ${msg.sender === MY_NAME ? 'me' : 'her'}`}>
                <div className="bubble">{msg.text}</div>
                <div className="msg-time">{formatTime(msg.created_at)}</div>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>
          <div className="chat-input-wrap">
            <textarea
              className="chat-input"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder={`Écris à ${HER_NAME}...`}
              onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSendChat()} }}
              rows={1}
            />
            <button className="send-btn" onClick={handleSendChat}><SendIcon /></button>
          </div>
        </div>
      )}

      {/* ════ CANAUX ════ */}
      {screen === 'channels' && (
        <div className="screen chan-screen">
          <div className="channels-header">
            <p className="channels-intro">Réflexions à deux</p>
            <button className="btn-ghost small" onClick={handleStarter}>✦ Starter IA</button>
          </div>

          <div className="channel-tabs">
            {channels.map(ch => (
              <button
                key={ch.id}
                className={`ch-tab ${activeChannel===ch.id?'active':''}`}
                onClick={() => setActiveChannel(ch.id)}
              >{ch.icon} {ch.name}</button>
            ))}
          </div>

          {channels.find(c=>c.id===activeChannel) && (
            <div className="channel-question">
              "{channels.find(c=>c.id===activeChannel).question}"
            </div>
          )}

          <div className="channel-messages">
            {currentChanMsgs.length === 0 && (
              <div className="empty-state">Commence la réflexion ✦</div>
            )}
            {currentChanMsgs.map((msg, i) => (
              <div key={msg.id || i} className={`msg ${msg.sender===MY_NAME?'me':msg.sender==='✦ IA'?'ai':'her'}`}>
                {msg.sender === '✦ IA' && <div className="ai-label">✦ réflexion IA</div>}
                <div className="bubble">{msg.text}</div>
                <div className="msg-time">{msg.sender} · {formatTime(msg.created_at)}</div>
              </div>
            ))}
            {aiTyping && (
              <div className="msg ai">
                <div className="ai-label">✦ l'IA réfléchit</div>
                <div className="bubble thinking">···</div>
              </div>
            )}
            <div ref={chanEnd} />
          </div>

          <div className="chat-input-wrap">
            <textarea
              className="chat-input"
              value={chanInput}
              onChange={e => setChanInput(e.target.value)}
              placeholder="Ta réflexion..."
              onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSendChannel()} }}
              rows={1}
            />
            <button className="send-btn" onClick={handleSendChannel}><SendIcon /></button>
          </div>
        </div>
      )}

      {/* ════ NAV ════ */}
      <nav className="nav">
        {[
          { id:'home',     icon:'🏠', label:'Accueil' },
          { id:'chat',     icon:'💬', label:'Chat' },
          { id:'channels', icon:'🔮', label:'Réflexion' },
        ].map(item => (
          <button key={item.id} className={`nav-btn ${screen===item.id?'active':''}`} onClick={() => setScreen(item.id)}>
            <span style={{fontSize:20}}>{item.icon}</span>
            <span>{item.label}</span>
            {screen===item.id && <div className="nav-dot"/>}
          </button>
        ))}
      </nav>
    </div>
  )
}

function Stars() {
  const stars = useRef(Array.from({length:50}, () => ({
    w: Math.random()*2+0.5, top: Math.random()*100, left: Math.random()*100,
    dur: 2+Math.random()*4, delay: Math.random()*5
  }))).current
  return (
    <div className="stars" aria-hidden="true">
      {stars.map((s,i) => (
        <div key={i} className="star" style={{
          width:`${s.w}px`, height:`${s.w}px`,
          top:`${s.top}%`, left:`${s.left}%`,
          animationDuration:`${s.dur}s`, animationDelay:`${s.delay}s`
        }}/>
      ))}
    </div>
  )
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  )
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
}
