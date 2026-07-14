import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase, signInWithGoogle, GLOBAL_CSS, NovaMark } from './lib/core.jsx'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Terms from './pages/Terms'
import Demo from './pages/Demo'
import Contact from './pages/Contact'

function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => { sub.subscription.unsubscribe(); window.removeEventListener('popstate', onPop) }
  }, [])

  const nav = to => { window.history.pushState({}, '', to); setPath(to) }

  let page
  if (path.startsWith('/terms')) page = <Terms nav={nav} />
  else if (path.startsWith('/demo')) page = <Demo nav={nav} />
  else if (path.startsWith('/contact')) page = <Contact nav={nav} />
  else if (path.startsWith('/app')) {
    if (session === undefined) page = <Loading />
    else if (!session) page = <SignIn />
    else page = <Dashboard session={session} nav={nav} />
  } else page = <Landing session={session} nav={nav} />

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {page}
    </>
  )
}

function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ animation: 'hnPulse 1.6s ease-in-out infinite' }}><NovaMark size={38} /></div>
    </div>
  )
}

function SignIn() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card rise" style={{ padding: 'clamp(30px,5vw,48px)', maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <NovaMark size={40} />
        <h1 className="display" style={{ fontSize: '1.5rem', fontWeight: 700, margin: '20px 0 10px' }}>Sign in to HarNova Build</h1>
        <p style={{ color: '#8A8AA0', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 28 }}>
          One tap with Google — then paste your code and go live.
        </p>
        <button onClick={signInWithGoogle} className="glass-btn" style={{ width: '100%', padding: '14px 20px', borderRadius: 12, fontWeight: 600, fontSize: '0.98rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C41.4 35.3 44 30.1 44 24c0-1.3-.1-2.6-.4-3.9z"/>
          </svg>
          Continue with Google
        </button>
        <a href="/" style={{ display: 'inline-block', marginTop: 22, fontSize: '0.85rem', color: '#6E6E85' }}>← Back to home</a>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>,
)
