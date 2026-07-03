import { useEffect, useState } from 'react'
import { ArrowUpRight, Sparkles, Code2, Rocket, ShieldCheck, RefreshCw, Globe } from 'lucide-react'
import { NovaMark } from '../lib/core.jsx'

const W = { maxWidth: 1100, margin: '0 auto', padding: '0 clamp(18px,4vw,40px)' }

const STEPS = [
  { icon: ShieldCheck, title: 'Sign in with Google', text: 'One tap. Your sites live under your account.' },
  { icon: Code2, title: 'Paste your AI code', text: 'The HTML that ChatGPT, Claude or v0 wrote for you — paste it as-is.' },
  { icon: Sparkles, title: 'Pay RM10', text: 'FPX or card via Billplz. One payment, one site, 30 days.' },
  { icon: Rocket, title: 'You\u2019re live', text: 'yourname.harnova.my with SSL, on Cloudflare\u2019s edge, worldwide.' },
]

export default function Landing({ session, nav }) {
  const [showcase, setShowcase] = useState([])
  const [root, setRoot] = useState('harnova.my')

  useEffect(() => {
    fetch('/api/showcase').then(r => r.json())
      .then(d => { setShowcase(d.sites || []); if (d.root) setRoot(d.root) })
      .catch(() => {})
  }, [])

  const cta = () => nav('/app')

  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '15px 0', background: 'rgba(4,4,10,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" className="display" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '0.95rem' }}>
            <NovaMark size={22} /> HARNOVA <span className="nova-text">BUILD</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <a href="#showcase" className="hide-mobile" style={{ fontSize: '0.9rem', color: '#B9B9CC' }}>Showcase</a>
            <a href="https://harnova.my" className="hide-mobile" style={{ fontSize: '0.9rem', color: '#B9B9CC' }}>Studio</a>
            <button onClick={cta} className="nova-btn" style={{ padding: '9px 20px', borderRadius: 99, fontWeight: 600, fontSize: '0.88rem' }}>
              {session ? 'My sites' : 'Get started'}
            </button>
          </div>
        </div>
      </nav>

      <header style={{ paddingTop: 150, paddingBottom: 70, position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), rgba(168,85,247,0.07) 40%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ ...W, position: 'relative', textAlign: 'center' }}>
          <div className="rise mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 15px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.14)', fontSize: '0.72rem', letterSpacing: '0.14em', color: '#B9B9CC', marginBottom: 26 }}>
            ✦ HOSTING FOR VIBE-CODED WEBSITES
          </div>
          <h1 className="display rise" style={{ fontSize: 'clamp(2rem,6vw,3.9rem)', fontWeight: 700, lineHeight: 1.1, animationDelay: '.1s' }}>
            Your AI wrote the site.<br /><span className="nova-text">We put it online.</span>
          </h1>
          <p className="rise" style={{ margin: '24px auto 0', fontSize: 'clamp(1rem,1.5vw,1.15rem)', lineHeight: 1.7, color: '#B9B9CC', maxWidth: 560, fontWeight: 300, animationDelay: '.2s' }}>
            Paste the code, pay <strong style={{ color: '#F4F4FA' }}>RM10</strong>, and it's live on your own <span className="mono" style={{ fontSize: '0.95em' }}>.{root}</span> link with SSL — in seconds. No terminal. No GitHub. No DevOps.
          </p>
          <div className="rise" style={{ marginTop: 38, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '.3s' }}>
            <button onClick={cta} className="nova-btn" style={{ padding: '15px 32px', borderRadius: 99, fontWeight: 600, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Launch your site <ArrowUpRight size={17} />
            </button>
            <a href="#showcase" className="glass-btn" style={{ padding: '15px 32px', borderRadius: 99, fontWeight: 600, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              See live sites
            </a>
          </div>
        </div>
      </header>

      <section style={{ padding: '40px 0 70px' }}>
        <div style={{ ...W }}>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.title} className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color="#818CF8" />
                    </div>
                    <span className="mono" style={{ fontSize: '0.7rem', color: '#6E6E85' }}>STEP {i + 1}</span>
                  </div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 600, marginBottom: 7 }}>{s.title}</h3>
                  <p style={{ fontSize: '0.86rem', lineHeight: 1.6, color: '#8A8AA0', fontWeight: 300 }}>{s.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="showcase" style={{ padding: '50px 0 80px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ ...W }}>
          <div className="mono" style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: '#F5C542', marginBottom: 14 }}>✦ LIVE ON HARNOVA</div>
          <h2 className="display" style={{ fontSize: 'clamp(1.5rem,3.5vw,2.3rem)', fontWeight: 700, lineHeight: 1.15 }}>
            Sites people launched here.
          </h2>
          <p style={{ marginTop: 14, color: '#8A8AA0', fontSize: '0.98rem', maxWidth: 540, fontWeight: 300 }}>
            Every one of these was pasted in and live within a minute. Yours could be next.
          </p>
          {showcase.length === 0 ? (
            <div className="card" style={{ marginTop: 36, padding: 44, textAlign: 'center', color: '#6E6E85' }}>
              <Globe size={26} style={{ opacity: 0.5 }} />
              <p style={{ marginTop: 14, fontSize: '0.95rem' }}>The gallery is warming up — launch a site and toggle "Show in showcase" to be featured first.</p>
            </div>
          ) : (
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginTop: 36 }}>
              {showcase.map(s => {
                const url = `https://${s.subdomain}.${root}`
                return (
                  <a key={s.subdomain} href={url} target="_blank" rel="noreferrer" className="card" style={{ overflow: 'hidden', display: 'block' }}>
                    <div style={{ position: 'relative', height: 180, overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#08080F' }}>
                      <iframe src={url} title={s.name} loading="lazy" tabIndex={-1} aria-hidden="true" scrolling="no"
                        style={{ width: '333%', height: '333%', transform: 'scale(0.3)', transformOrigin: 'top left', border: 'none', pointerEvents: 'none' }} />
                    </div>
                    <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                        <div className="mono" style={{ fontSize: '0.72rem', color: '#6E6E85', marginTop: 3 }}>{s.subdomain}.{root}</div>
                      </div>
                      <ArrowUpRight size={16} color="#8A8AA0" style={{ flexShrink: 0 }} />
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: '30px 0 100px' }}>
        <div style={{ ...W }}>
          <div className="card" style={{ padding: 'clamp(28px,4vw,50px)', background: 'linear-gradient(160deg, rgba(99,102,241,0.13), rgba(168,85,247,0.06) 55%, rgba(34,211,238,0.05))', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden="true" style={{ position: 'absolute', top: -70, right: -70, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,197,66,0.14), transparent 70%)' }} />
            <div className="mono" style={{ fontSize: '0.72rem', letterSpacing: '0.18em', color: '#B9B9CC' }}>PER SITE · PER MONTH</div>
            <div className="display" style={{ fontSize: 'clamp(2.6rem,5vw,3.6rem)', fontWeight: 700, margin: '12px 0 4px' }}>RM10</div>
            <p style={{ color: '#8A8AA0', fontSize: '0.95rem', fontWeight: 300 }}>30 days of hosting · renew to keep it live · <RefreshCw size={12} style={{ verticalAlign: '-1px' }} /> no lock-in</p>
            <p style={{ color: '#B9B9CC', fontSize: '0.9rem', marginTop: 12, fontWeight: 300 }}>Want your own <span className="mono">.com</span>? Connect a custom domain — we'll wire it up for you.</p>
            <button onClick={cta} className="nova-btn" style={{ marginTop: 26, padding: '14px 34px', borderRadius: 99, fontWeight: 600, fontSize: '1rem' }}>
              Get started — it's one paste away
            </button>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '30px 0' }}>
        <div style={{ ...W, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', fontSize: '0.8rem', color: '#6E6E85' }}>
          <span>© {new Date().getFullYear()} HarNova Technology</span>
          <span className="mono">Built under one star <span className="gold-text">✦</span></span>
        </div>
      </footer>
    </>
  )
}
