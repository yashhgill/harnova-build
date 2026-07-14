import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Sparkles, Code2, Rocket, ShieldCheck, RefreshCw, Globe, Check, Moon, Sun } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { NovaMark } from '../lib/core.jsx'

gsap.registerPlugin(ScrollTrigger)

const W = { maxWidth: 1180, margin: '0 auto', padding: '0 clamp(18px,4vw,40px)' }

const STEPS = [
  { icon: ShieldCheck, title: 'Sign in with Google', text: 'One tap. Your sites live under your own account, no forms to fill.' },
  { icon: Code2, title: 'Paste or generate code', text: 'Bring HTML from ChatGPT or v0 — or chat with our built-in AI Agent and it writes the whole site for you.' },
  { icon: Sparkles, title: 'Pay RM300 by QR', text: 'Scan our DuitNow QR with any Malaysian banking app. One payment, one site, 30 days live.' },
  { icon: Rocket, title: 'You’re live', text: 'yourname.harnova.my with SSL, served from Cloudflare’s edge, worldwide, instantly.' },
]

const MOCK_HTML = `<!doctype html><html><head><style>
  *{margin:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#0d1117}
  .nav{display:flex;justify-content:space-between;align-items:center;padding:18px 28px;color:#fff}
  .brand{font-weight:800;font-size:15px;letter-spacing:.02em}
  .hero{padding:60px 28px 70px;text-align:center;color:#fff;background:radial-gradient(circle at 50% 0%,#1f2b4d,#0d1117 60%)}
  h1{font-size:34px;font-weight:800;line-height:1.15;margin-bottom:12px}
  .accent{background:linear-gradient(100deg,#7c9cff,#8b5cf6);-webkit-background-clip:text;background-clip:text;color:transparent}
  p{color:#9aa4b8;font-size:14px;max-width:380px;margin:0 auto 22px}
  .btn{display:inline-block;padding:12px 26px;border-radius:99px;background:linear-gradient(100deg,#7c9cff,#8b5cf6);color:#fff;font-weight:700;font-size:13px;text-decoration:none}
</style></head><body>
  <div class="nav"><span class="brand">◆ NUSANTARA CAFÉ</span><span style="font-size:12px;color:#9aa4b8">Menu · Visit · Order</span></div>
  <div class="hero"><h1>Kopi that tells<br/><span class="accent">a story.</span></h1>
  <p>Small-batch beans, roasted weekly in Kuala Lumpur. Order ahead, skip the queue.</p>
  <a class="btn">Order on WhatsApp →</a></div>
</body></html>`

export default function Landing({ session, nav, theme, toggleTheme }) {
  const [showcase, setShowcase] = useState([])
  const [root, setRoot] = useState('harnova.my')
  const scopeRef = useRef(null)

  useEffect(() => {
    fetch('/api/showcase').then(r => r.json())
      .then(d => { setShowcase(d.sites || []); if (d.root) setRoot(d.root) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('.hero-anim', { opacity: 0, y: 24 })
      gsap.to('.hero-anim', { opacity: 1, y: 0, duration: 0.85, stagger: 0.1, ease: 'power3.out', delay: 0.1 })

      gsap.set('.hero-mock', { opacity: 0, y: 40, rotateY: -8, scale: 0.96 })
      gsap.to('.hero-mock', { opacity: 1, y: 0, rotateY: 0, scale: 1, duration: 1.1, ease: 'power3.out', delay: 0.35 })

      gsap.set('.float-orb', { opacity: 0, scale: 0.8 })
      gsap.to('.float-orb', { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out', delay: 0.2 })

      gsap.utils.toArray('.reveal-up').forEach(el => {
        gsap.fromTo(el, { opacity: 0, y: 34 }, {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      })

      gsap.utils.toArray('.reveal-stagger').forEach(group => {
        const items = group.querySelectorAll('.reveal-item')
        gsap.fromTo(items, { opacity: 0, y: 30 }, {
          opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: group, start: 'top 85%' },
        })
      })

      // steps: connecting line draws in as you scroll past
      gsap.utils.toArray('.step-line').forEach(line => {
        gsap.fromTo(line, { scaleY: 0 }, {
          scaleY: 1, duration: 1, ease: 'none', transformOrigin: 'top',
          scrollTrigger: { trigger: line, start: 'top 75%', end: 'bottom 40%', scrub: 0.6 },
        })
      })
    }, scopeRef)
    return () => ctx.revert()
  }, [showcase])

  const cta = () => nav('/app')

  return (
    <div ref={scopeRef}>
      <nav className="nav-blur" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '15px 0', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" className="display" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '0.95rem' }}>
            <NovaMark size={22} /> HARNOVA <span className="nova-text">BUILD</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <a href="#showcase" className="hide-mobile ink-soft" style={{ fontSize: '0.9rem' }}>Showcase</a>
            <a href="/demo" onClick={e => { e.preventDefault(); nav('/demo') }} className="hide-mobile ink-soft" style={{ fontSize: '0.9rem' }}>Try the AI</a>
            <a href="/contact" onClick={e => { e.preventDefault(); nav('/contact') }} className="hide-mobile ink-soft" style={{ fontSize: '0.9rem' }}>Contact</a>
            <button onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="glass-btn" style={{ width: 36, height: 36, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={cta} className="nova-btn" style={{ padding: '9px 20px', borderRadius: 99, fontWeight: 600, fontSize: '0.88rem' }}>
              {session ? 'My sites' : 'Get started'}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO: asymmetric two-column, copy left / live mockup right ── */}
      <header className="mesh-bg" style={{ paddingTop: 148, paddingBottom: 90, position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" className="float-orb float" style={{ position: 'absolute', top: '-30%', right: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,90,254,0.13), rgba(155,107,255,0.05) 40%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ ...W, position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,0.95fr)', gap: 'clamp(24px,5vw,60px)', alignItems: 'center' }} className="grid-2">
          <div>
            <div className="hero-anim mono" style={{ fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--indigo)', marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(109,90,254,0.08)', border: '1px solid rgba(109,90,254,0.18)', borderRadius: 99, padding: '7px 16px' }}>
              <Sparkles size={13} /> AI-BUILT WEBSITES, LIVE IN MINUTES
            </div>
            <h1 className="hero-anim display" style={{ fontSize: 'clamp(2.5rem,5.2vw,3.75rem)', fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.02em' }}>
              Your AI wrote<br />the site.<br /><span className="nova-text">We put it online.</span>
            </h1>
            <p className="hero-anim ink-soft" style={{ marginTop: 24, fontSize: 'clamp(1.02rem,1.6vw,1.2rem)', maxWidth: 460, lineHeight: 1.6, fontWeight: 400 }}>
              Paste HTML from ChatGPT, or describe your business and let our AI Agent build it — hosted, secured, and live on your own harnova.my address.
            </p>
            <div className="hero-anim" style={{ marginTop: 34, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button onClick={cta} className="nova-btn" style={{ padding: '16px 32px', borderRadius: 99, fontWeight: 600, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Launch your site <ArrowUpRight size={17} />
              </button>
              <a href="#showcase" className="glass-btn" style={{ padding: '16px 32px', borderRadius: 99, fontWeight: 600, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                See live sites
              </a>
            </div>
            <div className="hero-anim ink-faint" style={{ marginTop: 30, display: 'flex', gap: 22, flexWrap: 'wrap', fontSize: '0.82rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={13} color="var(--success)" /> No credit card to start</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={13} color="var(--success)" /> Live in under a minute</span>
            </div>
          </div>

          {/* Browser-frame mockup of an AI-generated site, tilted for depth */}
          <div className="hero-mock" style={{ perspective: 1200 }}>
            <div style={{
              borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)', transform: 'rotate(1.5deg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 14px', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
                <span className="mono ink-faint" style={{ marginLeft: 10, fontSize: '0.68rem' }}>nusantaracafe.harnova.my</span>
              </div>
              <iframe title="Example AI-generated site" tabIndex={-1} aria-hidden="true" scrolling="no" srcDoc={MOCK_HTML}
                style={{ width: '100%', height: 340, border: 'none', display: 'block' }} />
            </div>
            <div style={{
              position: 'absolute', bottom: -18, left: -18, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '10px 16px', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 8,
            }} className="hide-mobile">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Live · generated in 12s</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── STEPS: vertical numbered timeline instead of 4 identical boxes ── */}
      <section style={{ padding: '90px 0 80px', borderTop: '1px solid var(--border)' }}>
        <div style={{ ...W }}>
          <div className="reveal-up" style={{ maxWidth: 600, marginBottom: 60 }}>
            <div className="mono" style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 14 }}>✦ HOW IT WORKS</div>
            <h2 className="display" style={{ fontSize: 'clamp(1.7rem,3.4vw,2.4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              From idea to live site,<br />in four steps.
            </h2>
          </div>
          <div style={{ position: 'relative', maxWidth: 720 }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const last = i === STEPS.length - 1
              return (
                <div key={s.title} className="reveal-up" style={{ display: 'flex', gap: 24, position: 'relative', paddingBottom: last ? 0 : 44 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16, background: 'var(--surface)', border: '1.5px solid var(--border-strong)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', position: 'relative', zIndex: 2,
                    }}>
                      <Icon size={20} color="var(--indigo)" />
                    </div>
                    {!last && (
                      <div className="step-line" style={{ width: 2, flex: 1, marginTop: 4, background: 'linear-gradient(var(--border-strong), var(--border-strong))', transformOrigin: 'top' }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 8 }}>
                    <span className="mono ink-faint" style={{ fontSize: '0.7rem' }}>STEP {i + 1}</span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '5px 0 8px' }}>{s.title}</h3>
                    <p className="ink-soft" style={{ fontSize: '0.94rem', lineHeight: 1.6, fontWeight: 400, maxWidth: 460 }}>{s.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SHOWCASE ── */}
      <section id="showcase" style={{ padding: '80px 0 90px', borderTop: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
        <div style={{ ...W }}>
          <div className="reveal-up mono" style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 14 }}>✦ LIVE ON HARNOVA</div>
          <h2 className="reveal-up display" style={{ fontSize: 'clamp(1.6rem,3.4vw,2.3rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            Sites people launched here.
          </h2>
          <p className="reveal-up ink-soft" style={{ marginTop: 14, fontSize: '1rem', maxWidth: 540, fontWeight: 400 }}>
            Every one of these was pasted in and live within a minute. Yours could be next.
          </p>
          {showcase.length === 0 ? (
            <div className="card reveal-up" style={{ marginTop: 40, padding: 44, textAlign: 'center' }}>
              <Globe size={26} className="ink-faint" />
              <p className="ink-faint" style={{ marginTop: 14, fontSize: '0.95rem' }}>The gallery is warming up — launch a site and toggle "Show in showcase" to be featured first.</p>
            </div>
          ) : (
            <div className="grid-3 reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22, marginTop: 40 }}>
              {showcase.map(s => {
                const url = `https://${s.subdomain}.${root}`
                return (
                  <a key={s.subdomain} href={url} target="_blank" rel="noreferrer" className="card card-hover reveal-item" style={{ overflow: 'hidden', display: 'block' }}>
                    <div style={{ position: 'relative', height: 180, overflow: 'hidden', borderBottom: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
                      <iframe src={url} title={s.name} loading="lazy" tabIndex={-1} aria-hidden="true" scrolling="no"
                        style={{ width: '333%', height: '333%', transform: 'scale(0.3)', transformOrigin: 'top left', border: 'none', pointerEvents: 'none' }} />
                    </div>
                    <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                        <div className="mono ink-faint" style={{ fontSize: '0.72rem', marginTop: 3 }}>{s.subdomain}.{root}</div>
                      </div>
                      <ArrowUpRight size={16} className="ink-soft" style={{ flexShrink: 0 }} />
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: '90px 0 100px' }}>
        <div style={{ ...W, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'clamp(20px,4vw,40px)', alignItems: 'center' }} className="grid-2">
          <div className="reveal-up">
            <div className="mono" style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 14 }}>✦ SIMPLE PRICING</div>
            <h2 className="display" style={{ fontSize: 'clamp(1.7rem,3.4vw,2.4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              One price. No surprise fees.
            </h2>
            <p className="ink-soft" style={{ marginTop: 16, fontSize: '1rem', lineHeight: 1.6, maxWidth: 420, fontWeight: 400 }}>
              Want a fully custom website and your own <span className="mono">.com</span> instead of a harnova.my link?{' '}
              <a href="/contact" onClick={e => { e.preventDefault(); nav('/contact') }} style={{ color: 'var(--cyan)', fontWeight: 600 }}>Hit us up</a> — we'll build and wire it up for you.
            </p>
            <div style={{ marginTop: 28, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button onClick={cta} className="nova-btn" style={{ padding: '14px 30px', borderRadius: 99, fontWeight: 600, fontSize: '0.98rem' }}>
                Get started — it's one paste away
              </button>
              <button onClick={() => nav('/demo')} className="glass-btn" style={{ padding: '14px 30px', borderRadius: 99, fontWeight: 600, fontSize: '0.98rem' }}>
                Try the AI first, free
              </button>
            </div>
          </div>
          <div className="card reveal-up" style={{ padding: 'clamp(30px,4vw,48px)', background: 'linear-gradient(160deg, rgba(109,90,254,0.07), rgba(155,107,255,0.04) 55%, rgba(23,182,196,0.04))', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div aria-hidden="true" style={{ position: 'absolute', top: -70, right: -70, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,145,42,0.12), transparent 70%)' }} />
            <div className="mono ink-soft" style={{ fontSize: '0.72rem', letterSpacing: '0.18em' }}>PER SITE · PER MONTH</div>
            <div className="display" style={{ fontSize: 'clamp(3rem,6vw,4.2rem)', fontWeight: 800, margin: '14px 0 6px', letterSpacing: '-0.02em' }}>RM300</div>
            <p className="ink-soft" style={{ fontSize: '0.95rem', fontWeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              30 days of hosting · renew to keep it live <RefreshCw size={12} />
            </p>
            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>
              {['SSL + Cloudflare edge hosting', 'AI Agent chat builder included', 'Your own harnova.my subdomain', 'No lock-in — cancel anytime'].map(f => (
                <span key={f} className="ink-soft" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem' }}>
                  <Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '30px 0' }}>
        <div style={{ ...W, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', fontSize: '0.8rem' }} className="ink-faint">
          <span>© {new Date().getFullYear()} HarNova Technology</span>
          <span style={{ display: 'inline-flex', gap: 18, alignItems: 'center' }}>
            <a href="/demo" onClick={e => { e.preventDefault(); nav('/demo') }} className="ink-soft">Demo</a>
            <a href="/contact" onClick={e => { e.preventDefault(); nav('/contact') }} className="ink-soft">Contact</a>
            <a href="/terms" className="ink-soft">Terms</a>
            <span className="mono">Built under one star <span className="gold-text">✦</span></span>
          </span>
        </div>
      </footer>
    </div>
  )
}
