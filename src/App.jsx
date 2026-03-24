import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase.js'

/* ─────────────────── CONSTANTS ─────────────────── */
const LOCATIONS = [
  { id: 'football', label: 'Football Ground', emoji: '⚽' },
  { id: 'bakery',   label: 'Cristy Bakery',   emoji: '🥐' },
  { id: 'temple',   label: 'Temple Park',     emoji: '🌳' },
  { id: 'rooftop',  label: 'Roof Top',        emoji: '🏠' },
]
const TIMES = [
  { id: '5pm', label: '5 PM', emoji: '🌅', sub: 'Evening kickoff' },
  { id: '6pm', label: '6 PM', emoji: '🌆', sub: 'Golden hour'     },
  { id: '8pm', label: '8 PM', emoji: '🌙', sub: 'Night mode'      },
]
const GAMES = [
  { id: 'minecraft', label: 'Minecraft', emoji: '⛏️', color: '#16a34a' },
  { id: 'roblox',    label: 'Roblox',    emoji: '🎮', color: '#2563eb' },
  { id: 'football',  label: 'Football',  emoji: '⚽', color: '#dc2626' },
]
const SNACKS = [
  { id: 'golgappe',  label: 'Gol Gappe',  emoji: '🫧', color: '#d97706' },
  { id: 'icecream',  label: 'Ice Cream',  emoji: '🍦', color: '#db2777' },
  { id: 'colddrink', label: 'Cold Drink', emoji: '🥤', color: '#0891b2' },
]
const REACT_EMOJIS = ['👍', '😎', '🔥', '😂']
const NAV = [
  { id: 'dashboard',    label: 'Hub',      emoji: '🏠' },
  { id: 'availability', label: 'Avail',    emoji: '✅' },
  { id: 'location',     label: 'Location', emoji: '📍' },
  { id: 'time',         label: 'Time',     emoji: '⏰' },
  { id: 'game',         label: 'Game',     emoji: '🎮' },
  { id: 'snacks',       label: 'Snacks',   emoji: '🍕' },
  { id: 'summary',      label: 'Plan',     emoji: '🗒️' },
]
const TODAY = new Date().toISOString().split('T')[0]
const AVATAR_COLORS = ['#7c3aed','#0891b2','#d97706','#dc2626','#059669','#db2777','#2563eb']
const SESSION_KEY = 'nu_session'

/* ─────────────────── HELPERS ─────────────────── */
const getAvatarColor = (u) => AVATAR_COLORS[(u || '').charCodeAt(0) % AVATAR_COLORS.length]

// Transform flat DB rows → UI-friendly daily object
const rowsToDaily = (rows) => {
  const d = { available: [], locations: {}, times: {}, games: {}, snacks: {}, reactions: {} }
  rows.forEach(r => {
    if (r.available)  d.available.push(r.username)
    if (r.location)   d.locations[r.username]  = r.location
    if (r.time_slot)  d.times[r.username]      = r.time_slot
    if (r.game)       d.games[r.username]      = r.game
    if (r.snack)      d.snacks[r.username]     = r.snack
    d.reactions[r.username] = r.reactions || []
  })
  return d
}

const getMostVoted = (obj, options) => {
  if (!obj || !Object.keys(obj).length) return null
  const counts = {}
  Object.values(obj).forEach(v => { counts[v] = (counts[v] || 0) + 1 })
  let max = 0, winner = null
  Object.entries(counts).forEach(([k, v]) => { if (v > max) { max = v; winner = k } })
  return options.find(o => o.id === winner) || null
}

const getVoteCounts = (obj, options) => {
  const counts = {}
  options.forEach(o => { counts[o.id] = 0 })
  Object.values(obj || {}).forEach(v => { if (counts[v] !== undefined) counts[v]++ })
  return counts
}

/* ─────────────────── GLOBAL STYLES ─────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Righteous&family=Nunito:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#07070f;--bg2:#0f0f1f;--bg3:#13132a;
      --card:rgba(255,255,255,0.05);--card2:rgba(255,255,255,0.09);
      --border:rgba(255,255,255,0.08);--border2:rgba(255,255,255,0.15);
      --p1:#7c3aed;--p2:#06b6d4;--p3:#f97316;
      --pink:#ec4899;--green:#10b981;
      --text:#f1f5f9;--muted:#64748b;--sub:#94a3b8;
      --r:16px;--r2:24px;--r3:12px;
      --glass:blur(16px) saturate(180%);
    }
    body{background:var(--bg);color:var(--text);font-family:'Nunito',sans-serif;min-height:100vh;overflow-x:hidden}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:var(--p1);border-radius:4px}
    .app{display:flex;min-height:100vh;position:relative}
    .orb{position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0;animation:drift 12s infinite alternate ease-in-out}
    .orb1{width:400px;height:400px;background:rgba(124,58,237,0.15);top:-100px;left:-100px}
    .orb2{width:350px;height:350px;background:rgba(6,182,212,0.10);bottom:-80px;right:-80px;animation-delay:-6s}
    .orb3{width:250px;height:250px;background:rgba(249,115,22,0.08);top:50%;left:50%;animation-delay:-3s}
    @keyframes drift{from{transform:translate(0,0) scale(1)}to{transform:translate(30px,20px) scale(1.1)}}
    /* Sidebar */
    .sidebar{position:fixed;left:0;top:0;bottom:0;width:88px;display:flex;flex-direction:column;align-items:center;padding:20px 0;gap:6px;background:rgba(13,13,30,0.8);backdrop-filter:var(--glass);border-right:1px solid var(--border);z-index:100}
    .logo{font-family:'Righteous',cursive;font-size:13px;background:linear-gradient(135deg,var(--p1),var(--p2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px;letter-spacing:1px;text-align:center;line-height:1.2;padding:0 6px}
    .nav-btn{width:64px;height:56px;border-radius:var(--r3);border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:all 0.2s;background:transparent;color:var(--muted);font-family:'Nunito',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.3px}
    .nav-btn:hover{background:var(--card2);color:var(--text);transform:scale(1.05)}
    .nav-btn.active{background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.2));color:var(--text);border:1px solid rgba(124,58,237,0.4)}
    .nav-emoji{font-size:22px;line-height:1}
    .nav-spacer{flex:1}
    /* Main */
    .main{margin-left:88px;flex:1;padding:28px 32px;min-height:100vh;position:relative;z-index:1;max-width:900px}
    /* Cards */
    .card{background:var(--card);backdrop-filter:var(--glass);border:1px solid var(--border);border-radius:var(--r2);padding:24px;transition:all 0.25s}
    .card-hover:hover{background:var(--card2);border-color:var(--border2);transform:translateY(-2px);box-shadow:0 20px 60px rgba(0,0,0,0.4)}
    /* Choice button */
    .choice{display:flex;align-items:center;gap:14px;padding:16px 20px;background:var(--card);border:2px solid var(--border);border-radius:var(--r);cursor:pointer;transition:all 0.2s;width:100%;font-family:'Nunito',sans-serif;text-align:left}
    .choice:hover{border-color:var(--p1);background:rgba(124,58,237,0.1);transform:translateX(4px)}
    .choice.selected{border-color:var(--p2);background:rgba(6,182,212,0.12);box-shadow:0 0 20px rgba(6,182,212,0.15)}
    .choice-emoji{font-size:32px;width:44px;text-align:center;flex-shrink:0}
    .choice-label{font-size:16px;font-weight:700;color:var(--text)}
    .choice-sub{font-size:12px;color:var(--sub)}
    .check-ring{width:24px;height:24px;border-radius:50%;border:2px solid var(--border);margin-left:auto;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0}
    .choice.selected .check-ring{background:var(--p2);border-color:var(--p2);color:#fff;font-size:14px}
    /* Vote bar */
    .vote-bar-wrap{height:6px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden;margin-top:8px}
    .vote-bar{height:100%;border-radius:99px;transition:width 0.5s ease;background:linear-gradient(90deg,var(--p1),var(--p2))}
    /* Avatar */
    .avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;flex-shrink:0;color:#fff}
    .avatar-lg{width:52px;height:52px;font-size:22px}
    /* Auth */
    .auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;z-index:1}
    .auth-card{background:rgba(13,13,30,0.9);backdrop-filter:var(--glass);border:1px solid var(--border);border-radius:28px;padding:44px 40px;width:100%;max-width:420px}
    .input{width:100%;padding:14px 18px;background:rgba(255,255,255,0.06);border:1.5px solid var(--border);border-radius:var(--r3);color:var(--text);font-family:'Nunito',sans-serif;font-size:15px;font-weight:600;outline:none;transition:all 0.2s}
    .input:focus{border-color:var(--p1);background:rgba(124,58,237,0.08);box-shadow:0 0 0 4px rgba(124,58,237,0.1)}
    .input::placeholder{color:var(--muted)}
    .btn-primary{width:100%;padding:15px;border:none;border-radius:var(--r3);font-family:'Righteous',cursive;font-size:17px;cursor:pointer;background:linear-gradient(135deg,var(--p1),var(--p2));color:#fff;letter-spacing:1px;transition:all 0.2s;position:relative;overflow:hidden}
    .btn-primary:hover{transform:translateY(-1px);box-shadow:0 12px 40px rgba(124,58,237,0.4)}
    .btn-primary:active{transform:translateY(0)}
    .btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none}
    /* Avail button */
    .avail-btn{width:100%;padding:20px;border-radius:20px;border:none;cursor:pointer;font-family:'Righteous',cursive;font-size:22px;letter-spacing:1px;transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:12px}
    .avail-on{background:linear-gradient(135deg,#059669,#10b981);color:#fff;box-shadow:0 0 40px rgba(16,185,129,0.3)}
    .avail-off{background:rgba(255,255,255,0.06);border:2px solid var(--border);color:var(--sub)}
    .avail-on:hover{box-shadow:0 0 60px rgba(16,185,129,0.5);transform:scale(1.02)}
    .avail-off:hover{border-color:var(--green);color:var(--text)}
    /* User chip */
    .user-chip{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--card);border:1px solid var(--border);border-radius:99px;animation:popIn 0.3s ease}
    @keyframes popIn{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}
    /* Reaction */
    .react-btn{font-size:26px;padding:10px 14px;border-radius:var(--r3);border:2px solid var(--border);background:transparent;cursor:pointer;transition:all 0.2s}
    .react-btn:hover{transform:scale(1.2);border-color:var(--p1)}
    .react-btn.reacted{background:rgba(124,58,237,0.2);border-color:var(--p1);transform:scale(1.15)}
    /* Summary */
    .sum-row{display:flex;align-items:center;gap:16px;padding:18px 20px;background:var(--card);border:1px solid var(--border);border-radius:var(--r);margin-bottom:10px}
    .sum-emoji{font-size:30px;width:44px;text-align:center}
    .sum-label{font-size:12px;color:var(--sub);font-weight:600;text-transform:uppercase;letter-spacing:1px}
    .sum-value{font-size:18px;font-weight:800;color:var(--text)}
    /* Grid */
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    /* Toast */
    .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:rgba(20,20,40,0.95);backdrop-filter:blur(20px);border:1px solid var(--border2);padding:14px 28px;border-radius:99px;font-weight:700;font-size:15px;z-index:999;animation:toastIn 0.3s ease;white-space:nowrap}
    @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
    /* Stat card */
    .stat-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r2);padding:20px;display:flex;flex-direction:column;gap:6px;transition:all 0.2s}
    .stat-card:hover{background:var(--card2);border-color:var(--border2)}
    .stat-num{font-family:'Righteous',cursive;font-size:36px;background:linear-gradient(135deg,var(--p1),var(--p2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .stat-label{color:var(--sub);font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
    /* Page title */
    .page-title{font-family:'Righteous',cursive;font-size:30px;background:linear-gradient(135deg,var(--p1),var(--p2),var(--p3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
    .page-sub{color:var(--sub);font-size:14px;margin-bottom:28px}
    .who-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
    .react-count{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
    .react-pill{display:flex;align-items:center;gap:5px;padding:6px 14px;border-radius:99px;background:var(--card);border:1px solid var(--border);font-size:14px;font-weight:700;transition:all 0.2s}
    /* Error banner */
    .err-banner{background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);color:#f87171;padding:12px 18px;border-radius:12px;font-size:13px;font-weight:700;text-align:center}
    /* Loading spinner */
    .spinner{width:40px;height:40px;border:3px solid rgba(124,58,237,0.2);border-top-color:var(--p1);border-radius:50%;animation:spin 0.7s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:600px){
      .main{margin-left:0;padding:80px 16px 16px}
      .sidebar{flex-direction:row;width:100%;height:60px;bottom:0;top:auto;padding:0;border-right:none;border-top:1px solid var(--border)}
      .nav-btn{height:60px;width:50px;font-size:9px}.nav-emoji{font-size:20px}
      .logo{display:none}.nav-spacer{display:none}
      .grid2{grid-template-columns:1fr}
      .auth-card{padding:32px 24px}
    }
  `}</style>
)

/* ─────────────────── SMALL COMPONENTS ─────────────────── */
const Orbs = () => (
  <>
    <div className="orb orb1" />
    <div className="orb orb2" />
    <div className="orb orb3" />
  </>
)

const Avatar = ({ username, name, size }) => (
  <div className={`avatar${size === 'lg' ? ' avatar-lg' : ''}`}
    style={{ background: getAvatarColor(username) }}>
    {(name || username || '?')[0].toUpperCase()}
  </div>
)

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
    <div className="spinner" />
  </div>
)

/* ─────────────────── AUTH SCREEN ─────────────────── */
const AuthScreen = ({ onAuth }) => {
  const [mode, setMode]   = useState('login')
  const [form, setForm]   = useState({ username: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [busy, setBusy]   = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setError(''); setBusy(true)
    try { await onAuth(mode, form, setError) }
    finally { setBusy(false) }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎮</div>
          <div style={{ fontFamily: "'Righteous',cursive", fontSize: 28, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>
            NOOBS UNITED
          </div>
          <div style={{ color: 'var(--sub)', fontSize: 13, marginTop: 8 }}>
            Plan your day with the crew 🤝
          </div>
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: "'Righteous',cursive", fontSize: 13, letterSpacing: 1, transition: 'all 0.2s',
                background: mode === m ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--muted)' }}>
              {m === 'login' ? '🔑 LOGIN' : '✨ SIGN UP'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input className="input" placeholder="Your Name (e.g. Aman)" value={form.name}
              onChange={e => set('name', e.target.value)} />
          )}
          <input className="input" placeholder="Username (e.g. noob_aman)" value={form.username}
            onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g, '_'))}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          <input className="input" type="password" placeholder="Password" value={form.password}
            onChange={e => set('password', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          {error && <div className="err-banner">⚠️ {error}</div>}
          <button className="btn-primary" onClick={submit} disabled={busy} style={{ marginTop: 8 }}>
            {busy ? '...' : mode === 'login' ? "LET'S GO →" : 'JOIN THE SQUAD →'}
          </button>
        </div>

        <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
          Share this URL with your friends to join! 🔗
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── SIDEBAR ─────────────────── */
const Sidebar = ({ screen, setScreen, currentUser, userName, onLogout }) => (
  <nav className="sidebar">
    <div className="logo">NOOBS<br />UNITED</div>
    {NAV.map(n => (
      <button key={n.id} className={`nav-btn${screen === n.id ? ' active' : ''}`}
        onClick={() => setScreen(n.id)} title={n.label}>
        <span className="nav-emoji">{n.emoji}</span>
        {n.label}
      </button>
    ))}
    <div className="nav-spacer" />
    <div style={{ textAlign: 'center', padding: '0 8px', marginBottom: 8 }}>
      <div className="avatar" style={{ background: getAvatarColor(currentUser), margin: '0 auto 4px' }}>
        {(userName || currentUser || '?')[0].toUpperCase()}
      </div>
      <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 72, whiteSpace: 'nowrap' }}>
        {userName}
      </div>
    </div>
    <button className="nav-btn" onClick={onLogout} title="Logout">
      <span className="nav-emoji">🚪</span>Out
    </button>
  </nav>
)

/* ─────────────────── DASHBOARD ─────────────────── */
const Dashboard = ({ currentUser, allUsers, daily, setScreen }) => {
  const totalUsers  = Object.keys(allUsers).length
  const availCount  = daily.available?.length || 0
  const locWinner   = getMostVoted(daily.locations, LOCATIONS)
  const timeWinner  = getMostVoted(daily.times, TIMES)
  const gameWinner  = getMostVoted(daily.games, GAMES)
  const snackWinner = getMostVoted(daily.snacks, SNACKS)
  const name        = allUsers[currentUser]?.name || currentUser

  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  const steps = [
    { id: 'availability', label: 'Mark Availability', done: daily.available?.includes(currentUser), emoji: '✅' },
    { id: 'location',     label: 'Pick Location',     done: !!daily.locations?.[currentUser],       emoji: '📍' },
    { id: 'time',         label: 'Choose Time',        done: !!daily.times?.[currentUser],           emoji: '⏰' },
    { id: 'game',         label: 'Vote for Game',      done: !!daily.games?.[currentUser],           emoji: '🎮' },
    { id: 'snacks',       label: 'Pick Snacks',        done: !!daily.snacks?.[currentUser],          emoji: '🍕' },
  ]
  const done = steps.filter(s => s.done).length
  const pct  = Math.round((done / steps.length) * 100)

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'Righteous',cursive", fontSize: 26, marginBottom: 4 }}>
          {greet}, <span style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{name}</span> 👋
        </div>
        <div style={{ color: 'var(--sub)', fontSize: 13 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Your Progress</div>
          <div style={{ fontFamily: "'Righteous',cursive", fontSize: 22, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{pct}%</div>
        </div>
        <div className="vote-bar-wrap" style={{ height: 8 }}>
          <div className="vote-bar" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {steps.map(s => (
            <button key={s.id} onClick={() => setScreen(s.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99,
                border: `1.5px solid ${s.done ? 'var(--green)' : 'var(--border)'}`,
                background: s.done ? 'rgba(16,185,129,0.1)' : 'transparent',
                cursor: 'pointer', fontSize: 12, fontWeight: 700,
                color: s.done ? 'var(--green)' : 'var(--sub)',
                fontFamily: "'Nunito',sans-serif", transition: 'all 0.2s' }}>
              {s.emoji} {s.label} {s.done ? '✓' : '→'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid2" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-num">{availCount}</div>
          <div className="stat-label">🟢 Available Today</div>
          <div style={{ fontSize: 12, color: 'var(--sub)' }}>out of {totalUsers} members</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setScreen('summary')}>
          <div className="stat-num" style={{ fontSize: 28 }}>
            {[locWinner, timeWinner, gameWinner, snackWinner].filter(Boolean).length}/4
          </div>
          <div className="stat-label">📊 Plan Ready</div>
          <div style={{ fontSize: 12, color: 'var(--sub)' }}>tap to see summary →</div>
        </div>
      </div>

      {/* Snapshot */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>⚡ Today's Snapshot</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Location', val: locWinner  },
            { label: 'Time',     val: timeWinner  },
            { label: 'Game',     val: gameWinner  },
            { label: 'Snacks',   val: snackWinner },
          ].map(({ label, val }) => (
            <div key={label} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
              {val
                ? <div style={{ fontSize: 20 }}>{val.emoji} <span style={{ fontSize: 14, fontWeight: 700 }}>{val.label}</span></div>
                : <div style={{ color: 'var(--muted)', fontSize: 12 }}>Voting…</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Squad online */}
      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🟢 Squad Online</div>
        {daily.available?.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {daily.available.map(u => (
              <div key={u} className="user-chip">
                <Avatar username={u} name={allUsers[u]?.name} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{allUsers[u]?.name || u}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>No one yet — be the first! 👆</div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────── AVAILABILITY ─────────────────── */
const Availability = ({ currentUser, allUsers, daily, onToggle, onReact }) => {
  const isAvail    = daily.available?.includes(currentUser)
  const myReactions = daily.reactions?.[currentUser] || []

  const reactionCounts = {}
  REACT_EMOJIS.forEach(e => { reactionCounts[e] = 0 })
  Object.values(daily.reactions || {}).forEach(arr => {
    ;(arr || []).forEach(e => { if (reactionCounts[e] !== undefined) reactionCounts[e]++ })
  })

  return (
    <div>
      <div className="page-title">Availability</div>
      <div className="page-sub">Tell your squad if you're down for today 🤙</div>

      <button className={`avail-btn ${isAvail ? 'avail-on' : 'avail-off'}`} onClick={onToggle} style={{ marginBottom: 28 }}>
        {isAvail
          ? <><span>✅ I'm Available!</span><span style={{ fontSize: 28 }}>🎉</span></>
          : <>👆 Mark Me Available</>}
      </button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🎭 Vibe Check</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {REACT_EMOJIS.map(e => (
            <button key={e} className={`react-btn${myReactions.includes(e) ? ' reacted' : ''}`} onClick={() => onReact(e)}>
              {e}
            </button>
          ))}
        </div>
        <div className="react-count">
          {REACT_EMOJIS.map(e => (
            <div key={e} className="react-pill"
              style={reactionCounts[e] > 0 ? { borderColor: 'var(--p1)', background: 'rgba(124,58,237,0.1)' } : {}}>
              {e} <span style={{ color: 'var(--sub)' }}>{reactionCounts[e]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>
          Squad Status{' '}
          <span style={{ color: 'var(--green)', fontFamily: "'Righteous',cursive" }}>
            {daily.available?.length || 0}
          </span>/{Object.keys(allUsers).length}
        </div>
        {Object.entries(allUsers).map(([uname, udata]) => {
          const avail = daily.available?.includes(uname)
          return (
            <div key={uname} className="who-row">
              <Avatar username={uname} name={udata.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{udata.name}</div>
                <div style={{ fontSize: 12, color: 'var(--sub)' }}>@{uname}</div>
              </div>
              <div style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                background: avail ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                color: avail ? 'var(--green)' : 'var(--muted)',
                border: `1px solid ${avail ? 'rgba(16,185,129,0.3)' : 'var(--border)'}` }}>
                {avail ? '🟢 In' : '⭕ TBD'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────── GENERIC VOTE SCREEN ─────────────────── */
const VoteScreen = ({ title, sub, options, votes, currentUser, allUsers, onSelect, myVote, accent = '#7c3aed' }) => {
  const total    = Object.keys(votes || {}).length
  const counts   = getVoteCounts(votes, options)
  const maxVotes = Math.max(...Object.values(counts), 1)

  return (
    <div>
      <div className="page-title">{title}</div>
      <div className="page-sub">{sub}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {options.map(opt => {
          const cnt   = counts[opt.id] || 0
          const isWin = cnt === maxVotes && cnt > 0
          const isMine = myVote === opt.id
          return (
            <button key={opt.id} className={`choice${isMine ? ' selected' : ''}`}
              onClick={() => onSelect(opt.id)}
              style={isWin ? { borderColor: accent, boxShadow: `0 0 20px ${accent}33` } : {}}>
              <span className="choice-emoji">{opt.emoji}</span>
              <div style={{ flex: 1 }}>
                <div className="choice-label">
                  {opt.label}
                  {isWin && cnt > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 99,
                      background: `${accent}33`, color: accent, fontFamily: "'Righteous',cursive" }}>
                      WINNING
                    </span>
                  )}
                </div>
                {opt.sub && <div className="choice-sub">{opt.sub}</div>}
                <div className="vote-bar-wrap">
                  <div className="vote-bar" style={{
                    width: `${maxVotes > 0 ? (cnt / maxVotes) * 100 : 0}%`,
                    background: isWin ? `linear-gradient(90deg,${accent},${accent}88)` : undefined,
                  }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: "'Righteous',cursive", fontSize: 20, color: isWin ? accent : 'var(--sub)' }}>{cnt}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>votes</div>
              </div>
              <div className="check-ring">{isMine && '✓'}</div>
            </button>
          )
        })}
      </div>

      {total > 0 && (
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>👁 Who Picked What</div>
          {options.map(opt => {
            const voters = Object.entries(votes || {}).filter(([, v]) => v === opt.id)
            if (!voters.length) return null
            return (
              <div key={opt.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sub)', marginBottom: 6 }}>
                  {opt.emoji} {opt.label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {voters.map(([uname]) => (
                    <div key={uname} className="user-chip" style={{ padding: '4px 10px', gap: 6 }}>
                      <Avatar username={uname} name={allUsers[uname]?.name} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{allUsers[uname]?.name || uname}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─────────────────── SUMMARY ─────────────────── */
const Summary = ({ daily, allUsers }) => {
  const locWinner   = getMostVoted(daily.locations, LOCATIONS)
  const timeWinner  = getMostVoted(daily.times,     TIMES)
  const gameWinner  = getMostVoted(daily.games,     GAMES)
  const snackWinner = getMostVoted(daily.snacks,    SNACKS)
  const isReady     = locWinner && timeWinner && gameWinner && snackWinner

  const reactionCounts = {}
  REACT_EMOJIS.forEach(e => { reactionCounts[e] = 0 })
  Object.values(daily.reactions || {}).forEach(arr => {
    ;(arr || []).forEach(e => { if (reactionCounts[e] !== undefined) reactionCounts[e]++ })
  })

  return (
    <div>
      <div className="page-title">Final Plan 🗒️</div>
      <div className="page-sub">Here's what the squad decided for today!</div>

      {isReady ? (
        <div className="card" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.08))', border: '1px solid rgba(124,58,237,0.3)', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Righteous',cursive", fontSize: 20, marginBottom: 20, textAlign: 'center', background: 'linear-gradient(135deg,#7c3aed,#06b6d4,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            TODAY'S SQUAD PLAN ✨
          </div>
          {[
            { emoji: '📍', label: 'Location', val: locWinner   },
            { emoji: '⏰', label: 'Time',     val: timeWinner  },
            { emoji: '🎮', label: 'Game',     val: gameWinner  },
            { emoji: '🍕', label: 'Snacks',   val: snackWinner },
          ].map(({ emoji, label, val }) => (
            <div key={label} className="sum-row">
              <div className="sum-emoji">{val?.emoji || emoji}</div>
              <div>
                <div className="sum-label">{label}</div>
                <div className="sum-value">{val?.label || 'TBD'}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 14, lineHeight: 1.9 }}>
            📍 <strong>Location:</strong> {locWinner?.label}<br />
            ⏰ <strong>Time:</strong> {timeWinner?.label}<br />
            🎮 <strong>Game:</strong> {gameWinner?.label}<br />
            🍕 <strong>Snacks:</strong> {snackWinner?.label}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 40, marginBottom: 20 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>⏳</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Votes Still Coming In</div>
          <div style={{ color: 'var(--sub)', fontSize: 14 }}>Get the squad to vote so the plan can be finalised!</div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>👥 Who's Coming</div>
        {(daily.available || []).length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {daily.available.map(u => (
              <div key={u} className="user-chip">
                <Avatar username={u} name={allUsers[u]?.name} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{allUsers[u]?.name || u}</span>
              </div>
            ))}
          </div>
        ) : <div style={{ color: 'var(--muted)', fontSize: 14 }}>No one yet!</div>}
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🎭 Squad Vibes</div>
        <div className="react-count">
          {REACT_EMOJIS.map(e => (
            <div key={e} className="react-pill"
              style={reactionCounts[e] > 0 ? { borderColor: 'var(--p1)', background: 'rgba(124,58,237,0.1)' } : {}}>
              {e} <span style={{ color: reactionCounts[e] > 0 ? 'var(--text)' : 'var(--sub)', fontFamily: "'Righteous',cursive" }}>{reactionCounts[e]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── MAIN APP ─────────────────── */
export default function App() {
  const [screen,      setScreen]      = useState('loading')
  const [currentUser, setCurrentUser] = useState(null)
  const [allUsers,    setAllUsers]    = useState({})
  const [daily,       setDaily]       = useState({ available: [], locations: {}, times: {}, games: {}, snacks: {}, reactions: {} })
  const [toast,       setToast]       = useState('')
  const [dbError,     setDbError]     = useState('')
  const toastTimer = useRef(null)
  const realtimeSub = useRef(null)

  /* ── init ── */
  useEffect(() => { init() }, [])

  const init = async () => {
    try {
      // Load all users
      const { data: users, error } = await supabase.from('users').select('username, name')
      if (error) throw error
      const usersMap = {}
      users.forEach(u => { usersMap[u.username] = { name: u.name } })
      setAllUsers(usersMap)

      // Restore session
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
      if (session && usersMap[session.username]) {
        setCurrentUser(session.username)
        await loadDailyVotes()
        subscribeToRealtime(session.username, usersMap)
        setScreen('dashboard')
      } else {
        setScreen('auth')
      }
    } catch (e) {
      setDbError('Cannot connect to database. Check your Supabase env vars.')
      setScreen('error')
    }
  }

  /* ── load today's votes ── */
  const loadDailyVotes = async () => {
    const { data, error } = await supabase
      .from('daily_votes')
      .select('*')
      .eq('date', TODAY)
    if (!error && data) setDaily(rowsToDaily(data))
  }

  /* ── realtime subscription ── */
  const subscribeToRealtime = (username, usersMap) => {
    if (realtimeSub.current) supabase.removeChannel(realtimeSub.current)
    realtimeSub.current = supabase
      .channel('noobs_daily')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_votes', filter: `date=eq.${TODAY}` },
        () => loadDailyVotes())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' },
        payload => {
          setAllUsers(prev => ({ ...prev, [payload.new.username]: { name: payload.new.name } }))
        })
      .subscribe()
  }

  /* ── toast ── */
  const showToast = (msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2800)
  }

  /* ── auth ── */
  const handleAuth = async (mode, form, setError) => {
    const { username, password, name } = form
    if (!username.trim() || !password.trim()) { setError('Fill all fields!'); return }

    if (mode === 'signup') {
      if (!name.trim()) { setError('Enter your name!'); return }
      // Check duplicate
      const { data: existing } = await supabase.from('users').select('username').eq('username', username).single()
      if (existing) { setError('Username already taken!'); return }
      const { error } = await supabase.from('users').insert({ username, password, name: name.trim() })
      if (error) { setError('Signup failed: ' + error.message); return }
      setAllUsers(prev => ({ ...prev, [username]: { name: name.trim() } }))
      showToast(`Welcome to the squad, ${name}! 🎉`)
    } else {
      const { data: user, error } = await supabase.from('users').select('*').eq('username', username).eq('password', password).single()
      if (error || !user) { setError('Wrong username or password!'); return }
      showToast(`Back in the game, ${user.name}! 👊`)
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ username }))
    setCurrentUser(username)
    await loadDailyVotes()
    subscribeToRealtime(username, allUsers)
    setScreen('dashboard')
  }

  /* ── logout ── */
  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY)
    if (realtimeSub.current) supabase.removeChannel(realtimeSub.current)
    setCurrentUser(null)
    setScreen('auth')
  }

  /* ── upsert helper ── */
  const upsertVote = async (fields) => {
    const { error } = await supabase
      .from('daily_votes')
      .upsert({ date: TODAY, username: currentUser, updated_at: new Date().toISOString(), ...fields },
               { onConflict: 'date,username' })
    if (error) console.error('Upsert error:', error)
  }

  /* ── toggle availability ── */
  const toggleAvailable = async () => {
    const isNowAvail = !daily.available?.includes(currentUser)
    await upsertVote({ available: isNowAvail })
    showToast(isNowAvail ? "You're in! ✅" : 'Marked as unavailable')
  }

  /* ── react ── */
  const handleReact = async (emoji) => {
    const mine = daily.reactions?.[currentUser] || []
    const next = mine.includes(emoji) ? mine.filter(e => e !== emoji) : [...mine, emoji]
    await upsertVote({ reactions: next })
  }

  /* ── vote ── */
  const handleVote = async (field, val) => {
    const dbField = { locations: 'location', times: 'time_slot', games: 'game', snacks: 'snack' }[field]
    await upsertVote({ [dbField]: val })
    const labels = { locations: 'Location locked! 📍', times: 'Time set! ⏰', games: 'Game voted! 🎮', snacks: 'Snacks sorted! 🍕' }
    showToast(labels[field])
  }

  /* ── render ── */
  const userName = allUsers[currentUser]?.name || currentUser

  if (screen === 'loading') return (
    <>
      <GlobalStyles /><Orbs />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: "'Righteous',cursive", fontSize: 36, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          NOOBS UNITED
        </div>
        <div className="spinner" />
        <div style={{ color: 'var(--sub)', fontSize: 13 }}>Loading your crew… 🚀</div>
      </div>
    </>
  )

  if (screen === 'error') return (
    <>
      <GlobalStyles /><Orbs />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontFamily: "'Righteous',cursive", fontSize: 22, marginBottom: 12 }}>Connection Error</div>
          <div className="err-banner">{dbError}</div>
          <div style={{ marginTop: 16, color: 'var(--sub)', fontSize: 13 }}>
            Add <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>VITE_SUPABASE_URL</code> and <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>VITE_SUPABASE_ANON_KEY</code> to your environment.
          </div>
        </div>
      </div>
    </>
  )

  if (screen === 'auth') return (
    <>
      <GlobalStyles /><Orbs />
      <AuthScreen onAuth={handleAuth} />
      {toast && <div className="toast">{toast}</div>}
    </>
  )

  return (
    <>
      <GlobalStyles /><Orbs />
      <div className="app">
        <Sidebar screen={screen} setScreen={setScreen} currentUser={currentUser} userName={userName} onLogout={handleLogout} />
        <main className="main">
          {screen === 'dashboard'    && <Dashboard    currentUser={currentUser} allUsers={allUsers} daily={daily} setScreen={setScreen} />}
          {screen === 'availability' && <Availability currentUser={currentUser} allUsers={allUsers} daily={daily} onToggle={toggleAvailable} onReact={handleReact} />}
          {screen === 'location'     && <VoteScreen title="📍 Location"     sub="Where are we meeting today?"  options={LOCATIONS} votes={daily.locations || {}} currentUser={currentUser} allUsers={allUsers} onSelect={v => handleVote('locations', v)} myVote={daily.locations?.[currentUser]} accent="#7c3aed" />}
          {screen === 'time'         && <VoteScreen title="⏰ Meeting Time"  sub="When should we all show up?"  options={TIMES}     votes={daily.times     || {}} currentUser={currentUser} allUsers={allUsers} onSelect={v => handleVote('times',     v)} myVote={daily.times?.[currentUser]}     accent="#06b6d4" />}
          {screen === 'game'         && <VoteScreen title="🎮 Game Vote"     sub="What are we playing today?"   options={GAMES}     votes={daily.games     || {}} currentUser={currentUser} allUsers={allUsers} onSelect={v => handleVote('games',     v)} myVote={daily.games?.[currentUser]}     accent="#f97316" />}
          {screen === 'snacks'       && <VoteScreen title="🍕 Snacks"        sub="What are we munching on?"     options={SNACKS}    votes={daily.snacks    || {}} currentUser={currentUser} allUsers={allUsers} onSelect={v => handleVote('snacks',    v)} myVote={daily.snacks?.[currentUser]}    accent="#ec4899" />}
          {screen === 'summary'      && <Summary daily={daily} allUsers={allUsers} />}
        </main>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
