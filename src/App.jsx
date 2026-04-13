import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { askGroq } from './groq'
import './App.css'

const DAVID = 'David Lecointre'
const YAEL  = 'Yaël Lecointre'

const LOVE_EMOJIS = ['💕','🌹','✨','🦋','🌸','💫','🌙','⭐','🔥','💌','🫶','💞','🌺','🍓','🕊️','💎']

const CHANNEL_THEMES = [
  { icon: '🎬', label: 'Film & Série' },
  { icon: '🍽️', label: 'Cuisine' },
  { icon: '✈️', label: 'Voyage' },
  { icon: '🎵', label: 'Musique' },
  { icon: '📚', label: 'Lecture' },
  { icon: '💭', label: 'Philosophie' },
  { icon: '🌿', label: 'Nature' },
  { icon: '🎮', label: 'Jeux' },
  { icon: '💡', label: 'Projet' },
  { icon: '❓', label: 'Autre' },
]

const TABS = ['chat', 'channels', 'moments']

// ── Heart particles ──
function HeartParticle({ x, y, size, delay, color }) {
  return (
    <div className="heart-particle" style={{ left: x+'%', bottom: y+'px', width: size, height: size, animationDelay: delay+'s', color }}>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
      </svg>
    </div>
  )
}

// ── Login ──
function LoginScreen({ onSelect }) {
  const [hovered, setHovered] = useState(null)
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i, x: Math.random()*100, y: Math.random()*300,
      size: (Math.random()*14+7)+'px', delay: Math.random()*5,
      color: ['#c9a96e','#f4a0c0','#d4b8f0','#ff6b9d','#6eb5c9'][Math.floor(Math.random()*5)]
    }))
  )
  return (
    <div className="login-screen">
      {particles.map(p => <HeartParticle key={p.id} {...p} />)}
      <div className="login-content">
        <div className="login-ornament">✦ ✦ ✦</div>
        <h1 className="login-title">À Deux</h1>
        <p className="login-sub">Notre espace privé</p>
        <div className="login-divider"><span>❧</span></div>
        <p className="login-question">Qui êtes-vous ?</p>
        <div className="login-cards">
          <button className={`login-card ${hovered==='david'?'hovered':''}`}
            onMouseEnter={()=>setHovered('david')} onMouseLeave={()=>setHovered(null)}
            onClick={()=>onSelect(DAVID)}>
            <div className="card-inner">
              <div className="card-avatar david">D</div>
              <div className="card-name">David</div>
              <div className="card-surname">Lecointre</div>
              <div className="card-hearts">💙</div>
            </div>
          </button>
          <div className="login-or"><div className="or-line"/><span>ou</span><div className="or-line"/></div>
          <button className={`login-card ${hovered==='yael'?'hovered':''}`}
            onMouseEnter={()=>setHovered('yael')} onMouseLeave={()=>setHovered(null)}
            onClick={()=>onSelect(YAEL)}>
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

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <p>{message}</p>
        <div className="dialog-btns">
          <button className="dialog-cancel" onClick={onCancel}>Annuler</button>
          <button className="dialog-confirm" onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}

function CreateChannelModal({ onClose, onCreate, generating }) {
  const [name, setName] = useState('')
  const [theme, setTheme] = useState(CHANNEL_THEMES[0])
  const [showThemes, setShowThemes] = useState(false)
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <h2 className="modal-title">Nouveau canal</h2>
        <label className="modal-label">Nom du canal</label>
        <input className="modal-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Nos prochaines vacances…" autoFocus />
        <label className="modal-label">Thème</label>
        <div className="theme-selector">
          <button className="theme-current" onClick={()=>setShowThemes(v=>!v)}>
            <span>{theme.icon}</span><span>{theme.label}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,marginLeft:'auto'}}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {showThemes && (
            <div className="theme-list">
              {CHANNEL_THEMES.map(t => (
                <button key={t.label} className={`theme-option ${theme.label===t.label?'active':''}`}
                  onClick={()=>{setTheme(t);setShowThemes(false)}}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="modal-hint">✨ Une problématique IA sera générée automatiquement</p>
        <div className="modal-actions">
          <button className="dialog-cancel" onClick={onClose}>Annuler</button>
          <button className="dialog-confirm" disabled={!name.trim() || generating} onClick={()=>onCreate(name.trim(), theme)}>
            {generating ? '✨ Génération…' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FloatLayer({ floats }) {
  return <>{floats.map(f=>(<div key={f.id} className="float-emoji" style={{left:f.x+'%'}}>{f.char}</div>))}</>
}

// ── Avatar ──
function Avatar({ name, size=28 }) {
  const isDavid = name === DAVID
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background: isDavid?'linear-gradient(135deg,#1a3a5c,#0d2238)':'linear-gradient(135deg,#3a1a2e,#220d1e)',
      color: isDavid?'#6eb5c9':'#f4a0c0',
      border: isDavid?'1px solid rgba(110,181,201,0.35)':'1px solid rgba(244,160,192,0.35)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size*0.42+'px',
      fontFamily:"'Cormorant Garamond', serif",
      marginTop:2
    }}>
      {isDavid?'D':'Y'}
    </div>
  )
}

// ── Day separator ──
function DaySep({ date }) {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  let label = diff===0 ? "Aujourd'hui" : diff===1 ? 'Hier' : d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})
  return <div className="day-sep"><span>{label}</span></div>
}

// ── Rich message list ──
function MessageList({ messages, user, endRef }) {
  const isMe = s => s === user
  const fmt = ts => new Date(ts).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})

  const grouped = []
  let lastDay = null
  messages.forEach((msg,i) => {
    const day = new Date(msg.created_at).toDateString()
    if(day !== lastDay) { grouped.push({type:'day', date:msg.created_at, id:'day-'+i}); lastDay=day }
    const prev = messages[i-1]
    const next = messages[i+1]
    const CLUSTER = 90000
    const samePrev = prev && prev.sender===msg.sender && new Date(msg.created_at)-new Date(prev.created_at)<CLUSTER
    const sameNext = next && next.sender===msg.sender && new Date(next.created_at)-new Date(msg.created_at)<CLUSTER
    grouped.push({type:'msg', msg, first:!samePrev, last:!sameNext})
  })

  return (
    <div className="messages">
      {messages.length===0 && (
        <div className="empty"><div className="empty-icon">💕</div><p>Votre espace privé commence ici</p></div>
      )}
      {grouped.map((item,idx) => {
        if(item.type==='day') return <DaySep key={item.id} date={item.date}/>
        const {msg, first, last} = item
        const mine = isMe(msg.sender)
        return (
          <div key={msg.id} className={`msg-row ${mine?'mine':'hers'} ${first?'first':''} ${last?'last':''}`}>
            {!mine && (
              <div className="avatar-slot">
                {last ? <Avatar name={msg.sender} size={28}/> : <div style={{width:28}}/>}
              </div>
            )}
            <div className="msg-col">
              <div className={`bubble ${mine?'bubble-mine':'bubble-hers'} ${first?'bubble-first':''} ${last?'bubble-last':''}`}>
                <p>{msg.text}</p>
              </div>
              {last && <span className={`meta ${mine?'meta-mine':'meta-hers'}`}>{fmt(msg.created_at)}</span>}
            </div>
          </div>
        )
      })}
      <div ref={endRef}/>
    </div>
  )
}

export default function App() {
  const [user, setUser]                       = useState(()=>localStorage.getItem('adeux_user')||null)
  const [view, setView]                       = useState('chat')
  const [messages, setMessages]               = useState([])
  const [input, setInput]                     = useState('')
  const [floats, setFloats]                   = useState([])
  const [moments, setMoments]                 = useState([])
  const [momentInput, setMomentInput]         = useState('')
  const [channels, setChannels]               = useState([])
  const [activeChannel, setActiveChannel]     = useState(null)
  const [channelMessages, setChannelMessages] = useState([])
  const [channelInput, setChannelInput]       = useState('')
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [generatingChannel, setGeneratingChannel] = useState(false)
  const [installPrompt, setInstallPrompt]     = useState(null)
  const [showInstall, setShowInstall]         = useState(false)
  const [emojiPicker, setEmojiPicker]         = useState(false)
  const [confirmClear, setConfirmClear]       = useState(null)
  const [confirmDeleteChannel, setConfirmDeleteChannel] = useState(null)

  // ── iOS keyboard layout — ref DOM directe (pas de state = pas de re-render = instantané) ──
  const appRef = useRef(null)

  const messagesEndRef = useRef(null)
  const chMsgEndRef    = useRef(null)
  const touchStartX    = useRef(null)
  const touchStartY    = useRef(null)
  const inputRef       = useRef(null)
  const chInputRef     = useRef(null)
  const momentInputRef = useRef(null)

  const tabIndex = TABS.indexOf(view)

  // ── Fix iOS keyboard: manipulation DOM directe = 0 frame de retard ──
  // On n'utilise PAS setState : React re-render est trop lent (1 frame de glitch).
  // On écrit directement sur appRef.current.style, synchrone avec le paint.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const applyLayout = () => {
      const el = appRef.current
      if (!el) return
      el.style.top    = vv.offsetTop + 'px'
      el.style.height = vv.height + 'px'
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
      chMsgEndRef.current?.scrollIntoView({ behavior: 'instant' })
    }

    // focusin : déclenché AVANT que Safari scroll → on corrige immédiatement
    const onFocusIn = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        requestAnimationFrame(applyLayout)
      }
    }
    const onFocusOut = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        requestAnimationFrame(applyLayout)
      }
    }

    vv.addEventListener('resize', applyLayout)
    vv.addEventListener('scroll', applyLayout)
    document.addEventListener('focusin',  onFocusIn)
    document.addEventListener('focusout', onFocusOut)

    applyLayout()

    return () => {
      vv.removeEventListener('resize', applyLayout)
      vv.removeEventListener('scroll', applyLayout)
      document.removeEventListener('focusin',  onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  // ── PWA ──
  useEffect(()=>{
    const h=(e)=>{e.preventDefault();setInstallPrompt(e);setShowInstall(true)}
    window.addEventListener('beforeinstallprompt',h)
    return ()=>window.removeEventListener('beforeinstallprompt',h)
  },[])

  async function handleInstall() {
    if(!installPrompt) return
    installPrompt.prompt()
    const {outcome}=await installPrompt.userChoice
    if(outcome==='accepted') setShowInstall(false)
  }

  // ── Realtime ──
  useEffect(()=>{
    if(!user) return
    loadMessages(); loadMoments(); loadChannels()
    const ch1=supabase.channel('msgs')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'channel=eq.main'},p=>setMessages(prev=>[...prev,p.new]))
      .subscribe()
    const ch2=supabase.channel('anims')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'animations'},p=>addFloat(p.new.type))
      .subscribe()
    const ch3=supabase.channel('moms')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'moments'},p=>setMoments(prev=>[p.new,...prev]))
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'moments'},p=>setMoments(prev=>prev.filter(m=>m.id!==p.old.id)))
      .subscribe()
    const ch4=supabase.channel('channels_rt')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'channels'},p=>setChannels(prev=>[p.new,...prev]))
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'channels'},p=>{
        setChannels(prev=>prev.filter(c=>c.id!==p.old.id))
        setActiveChannel(ac=>ac?.id===p.old.id?null:ac)
      }).subscribe()
    return ()=>{supabase.removeChannel(ch1);supabase.removeChannel(ch2);supabase.removeChannel(ch3);supabase.removeChannel(ch4)}
  },[user])

  useEffect(()=>{
    if(!activeChannel) return
    loadChannelMessages(activeChannel.id)
    const sub=supabase.channel('ch_msgs_'+activeChannel.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`channel=eq.${activeChannel.id}`},p=>setChannelMessages(prev=>[...prev,p.new]))
      .subscribe()
    return ()=>supabase.removeChannel(sub)
  },[activeChannel])

  useEffect(()=>{messagesEndRef.current?.scrollIntoView({behavior:'smooth'})},[messages])
  useEffect(()=>{chMsgEndRef.current?.scrollIntoView({behavior:'smooth'})},[channelMessages])

  async function loadMessages() {
    const {data}=await supabase.from('messages').select('*').eq('channel','main').order('created_at',{ascending:true}).limit(100)
    if(data) setMessages(data)
  }
  async function loadMoments() {
    const {data}=await supabase.from('moments').select('*').order('created_at',{ascending:false}).limit(50)
    if(data) setMoments(data)
  }
  async function loadChannels() {
    const {data}=await supabase.from('channels').select('*').order('created_at',{ascending:false})
    if(data) setChannels(data)
  }
  async function loadChannelMessages(channelId) {
    const {data}=await supabase.from('messages').select('*').eq('channel',channelId).order('created_at',{ascending:true}).limit(100)
    if(data) setChannelMessages(data)
  }

  function addFloat(emoji) {
    const id=Date.now()+Math.random(); const x=15+Math.random()*70
    setFloats(prev=>[...prev,{id,char:emoji,x}])
    setTimeout(()=>setFloats(prev=>prev.filter(f=>f.id!==id)),3000)
  }

  function handleSelect(name) { localStorage.setItem('adeux_user',name); setUser(name) }
  function handleLogout() { localStorage.removeItem('adeux_user'); setUser(null); setMessages([]); setMoments([]); setChannels([]); setActiveChannel(null) }

  async function sendMessage(e) {
    e.preventDefault(); if(!input.trim()) return
    const text=input.trim(); setInput('')
    inputRef.current?.focus()
    await supabase.from('messages').insert({text,sender:user,channel:'main'})
  }
  async function sendChannelMessage(e) {
    e.preventDefault(); if(!channelInput.trim()||!activeChannel) return
    const text=channelInput.trim(); setChannelInput('')
    chInputRef.current?.focus()
    await supabase.from('messages').insert({text,sender:user,channel:activeChannel.id})
  }
  async function sendEmoji(emoji) {
    setEmojiPicker(false)
    for(let i=0;i<3;i++) setTimeout(()=>addFloat(emoji),i*180)
    await supabase.from('animations').insert({type:emoji,from_user:user})
  }
  async function createChannel(name, theme) {
    setGeneratingChannel(true)
    const prompt=`Tu es un assistant créatif pour un couple amoureux. Génère UNE SEULE problématique courte et engageante (1 phrase, max 120 caractères) pour un canal de discussion thématique intitulé "${name}" avec le thème "${theme.label}". Réponds UNIQUEMENT avec la problématique, sans guillemets ni ponctuation finale.`
    let problematique=''
    try{problematique=await askGroq(prompt,name)}catch{problematique=`Explorons ensemble le thème : ${name}`}
    await supabase.from('channels').insert({name,theme_icon:theme.icon,theme_label:theme.label,problematique:problematique.trim(),created_by:user})
    setGeneratingChannel(false); setShowCreateChannel(false)
  }
  async function deleteChannel(id) {
    await supabase.from('messages').delete().eq('channel',id)
    await supabase.from('channels').delete().eq('id',id)
    setChannels(prev=>prev.filter(c=>c.id!==id))
    if(activeChannel?.id===id) setActiveChannel(null)
    setConfirmDeleteChannel(null)
  }
  async function clearMessages(channelId) {
    await supabase.from('messages').delete().eq('channel',channelId)
    if(channelId==='main') setMessages([])
    else setChannelMessages([])
    setConfirmClear(null)
  }
  async function addMoment(e) {
    e.preventDefault(); if(!momentInput.trim()) return
    const text=momentInput.trim(); setMomentInput('')
    momentInputRef.current?.focus()
    await supabase.from('moments').insert({text,author:user})
  }
  async function deleteMoment(id) {
    await supabase.from('moments').delete().eq('id',id)
    setMoments(prev=>prev.filter(m=>m.id!==id))
  }

  const fmtDate=ts=>new Date(ts).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})
  const shortName=s=>s===DAVID?'David':'Yaël'

  if(!user) return <LoginScreen onSelect={handleSelect}/>

  return (
    <div
      ref={appRef}
      className={`app tab-${view}`}
      style={{
        // top et height sont écrits directement par applyLayout() via appRef
        // 0 re-render React = 0 glitch
        position: 'fixed',
        top: '0px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '520px',
        height: '100dvh',
      }}
      onClick={()=>emojiPicker&&setEmojiPicker(false)}
    >
      <FloatLayer floats={floats}/>

      {confirmClear && <ConfirmDialog message="Effacer tous les messages ?" onConfirm={()=>clearMessages(confirmClear)} onCancel={()=>setConfirmClear(null)}/>}
      {confirmDeleteChannel && <ConfirmDialog message="Supprimer ce canal et tous ses messages ?" onConfirm={()=>deleteChannel(confirmDeleteChannel)} onCancel={()=>setConfirmDeleteChannel(null)}/>}
      {showCreateChannel && <CreateChannelModal onClose={()=>setShowCreateChannel(false)} onCreate={createChannel} generating={generatingChannel}/>}

      {showInstall && (
        <div className="install-banner">
          <span>📲 Installer sur l'écran d'accueil</span>
          <div className="install-actions">
            <button className="install-btn" onClick={handleInstall}>Installer</button>
            <button className="install-dismiss" onClick={()=>setShowInstall(false)}>✕</button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="header">
        <div className="header-row">
          <div className="header-left">
            {activeChannel && (
              <button className="back-btn" onClick={()=>setActiveChannel(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
            )}
            <div className="header-title">
              {activeChannel ? (
                <span className="header-channel-name">{activeChannel.theme_icon} {activeChannel.name}</span>
              ) : view==='chat' ? (
                <><span className="ornament">✦</span><h1>À Deux</h1><span className="ornament">✦</span></>
              ) : view==='channels' ? (
                <><span className="ornament ornament-blue">◈</span><h1>Canaux</h1><span className="ornament ornament-blue">◈</span></>
              ) : (
                <><span className="ornament ornament-lav">✦</span><h1>Moments</h1><span className="ornament ornament-lav">✦</span></>
              )}
            </div>
          </div>
          <div className="header-right">
            {(view==='chat'&&!activeChannel) && (
              <button className="icon-btn" title="Effacer le chat" onClick={()=>setConfirmClear('main')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
              </button>
            )}
            {activeChannel && (<>
              <button className="icon-btn" title="Effacer les messages" onClick={()=>setConfirmClear(activeChannel.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
              </button>
              <button className="icon-btn danger" title="Supprimer le canal" onClick={()=>setConfirmDeleteChannel(activeChannel.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </button>
            </>)}
            <button className="logout-btn" onClick={handleLogout} title="Changer d'utilisateur">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
        {!activeChannel && (
          <div className="user-pill">
            <span className="user-dot" style={{background:user===DAVID?'#6eb5c9':'#f4a0c0'}}/>
            <span>{shortName(user)}</span>
          </div>
        )}
        {activeChannel && <p className="channel-problematique">💭 {activeChannel.problematique}</p>}
      </header>

      {/* ── Main swipe area ── */}
      <main className="main"
        onTouchStart={e=>{ touchStartX.current=e.touches[0].clientX; touchStartY.current=e.touches[0].clientY }}
        onTouchEnd={e=>{
          if(activeChannel||touchStartX.current===null) return
          const dx=e.changedTouches[0].clientX-touchStartX.current
          const dy=e.changedTouches[0].clientY-touchStartY.current
          if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>44) {
            const idx=TABS.indexOf(view)
            if(dx<0&&idx<TABS.length-1) setView(TABS[idx+1])
            if(dx>0&&idx>0) setView(TABS[idx-1])
          }
          touchStartX.current=null
        }}
      >
        <div className="swipe-container" style={{transform:`translateX(${-tabIndex*(100/3)}%)`}}>

          {/* CHAT */}
          <div className="swipe-pane pane-chat">
            <div className="pane">
              <MessageList messages={messages} user={user} endRef={messagesEndRef}/>
              <div className="emoji-zone" onClick={e=>e.stopPropagation()}>
                <button className="emoji-toggle" onClick={()=>setEmojiPicker(v=>!v)}>{emojiPicker?'✕':'💝'}</button>
                {emojiPicker && (
                  <div className="emoji-picker">
                    <div className="emoji-grid">
                      {LOVE_EMOJIS.map(e=>(<button key={e} className="emoji-btn" onClick={()=>sendEmoji(e)}>{e}</button>))}
                    </div>
                  </div>
                )}
              </div>
              <form className="input-row" onSubmit={sendMessage}>
                <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                  placeholder="Écris quelque chose…" autoComplete="off" enterKeyHint="send"/>
                <button type="submit" className="send-btn" disabled={!input.trim()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* CANAUX */}
          <div className="swipe-pane pane-channels">
            {!activeChannel ? (
              <div className="pane">
                <div className="messages">
                  {channels.length===0 && <div className="empty"><div className="empty-icon">🗂️</div><p>Créez votre premier canal thématique</p></div>}
                  {channels.map(ch=>(
                    <button key={ch.id} className="channel-card" onClick={()=>{setActiveChannel(ch);setChannelMessages([])}}>
                      <div className="channel-icon">{ch.theme_icon}</div>
                      <div className="channel-info">
                        <div className="channel-name">{ch.name}</div>
                        <div className="channel-theme">{ch.theme_label}</div>
                        <div className="channel-prob">💭 {ch.problematique}</div>
                      </div>
                      <svg className="channel-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  ))}
                </div>
                <div className="create-channel-bar">
                  <button className="create-channel-btn" onClick={()=>setShowCreateChannel(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Nouveau canal
                  </button>
                </div>
              </div>
            ) : (
              <div className="pane">
                <MessageList messages={channelMessages} user={user} endRef={chMsgEndRef}/>
                <form className="input-row" onSubmit={sendChannelMessage}>
                  <input ref={chInputRef} value={channelInput} onChange={e=>setChannelInput(e.target.value)}
                    placeholder="Répondre…" autoComplete="off" enterKeyHint="send"/>
                  <button type="submit" className="send-btn" disabled={!channelInput.trim()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* MOMENTS */}
          <div className="swipe-pane pane-moments">
            <div className="pane">
              <div className="messages">
                {moments.length===0 && <div className="empty"><div className="empty-icon">🌙</div><p>Notez vos moments précieux ici</p></div>}
                {moments.map(m=>(
                  <div key={m.id} className="moment-card">
                    <button className="moment-delete" onClick={()=>deleteMoment(m.id)} title="Supprimer">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                      </svg>
                    </button>
                    <p>{m.text}</p>
                    <span className="meta">{shortName(m.author)} · {fmtDate(m.created_at)}</span>
                  </div>
                ))}
              </div>
              <form className="input-row" onSubmit={addMoment}>
                <input ref={momentInputRef} value={momentInput} onChange={e=>setMomentInput(e.target.value)}
                  placeholder="Un souvenir, une pensée…" autoComplete="off" enterKeyHint="done"/>
                <button type="submit" className="send-btn" disabled={!momentInput.trim()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* ── Nav ── */}
      <nav className="nav">
        <button className={`tab-chat ${view==='chat'?'active':''}`} onClick={()=>{setView('chat');setActiveChannel(null)}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Chat</span>
        </button>
        <button className={`tab-channels ${view==='channels'?'active':''}`} onClick={()=>setView('channels')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>
          </svg>
          <span>Canaux</span>
        </button>
        <button className={`tab-moments ${view==='moments'?'active':''}`} onClick={()=>setView('moments')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>Moments</span>
        </button>
      </nav>
    </div>
  )
}
