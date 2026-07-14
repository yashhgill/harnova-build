import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Sparkles, Code2, Rocket, ShieldCheck, RefreshCw, Globe } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { NovaMark } from '../lib/core.jsx'

gsap.registerPlugin(ScrollTrigger)

const W = { maxWidth: 1120, margin: '0 auto', padding: '0 clamp(18px,4vw,40px)' }

const STEPS = [
  { icon: ShieldCheck, title: 'Sign in with Google', text: 'One tap. Your sites live under your account.' },
  { icon: Code2, title: 'Paste or generate code', text: 'Bring HTML from ChatGPT or v0 — or describe your site and our built-in AI writes it for you.' },
  { icon: Sparkles, title: 'Pay RM300 by QR', text: 'Scan our DuitNow QR with any Malaysian banking app. One payment, one site, 30 days.' },
  { icon: Rocket, title: 'You’re live', text: 'yourname.harnova.my with SSL, on Cloudflare’s edge, worldwide.' },
]

export default function Landing({ session, nav }) {
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
      gsap.set('.hero-anim', { opacity: 0, y: 28 })
      gsap.to('.hero-anim', { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.1 })

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
          opacity: 1, y: 0, duration: 0.6, stagger: 0.09, ease: 'power3.out',
          scrollTrigger: { trigger: group, start: 'top 85%' },
        })
      })
    }, scopeRef)
    return () => ctx.revert()
  }, [showcase])

  const cta = () => nav('/app')

  return (
    <div ref={scopeRef}>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '15px 0', background: 'rgba(250,250,252,0.78)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" className="display" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '0.95rem' }}>
            <NovaMark size={22} /> HARNOVA <span className="nova-text">BUILD</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <a href="#showcase" className="hide-mobile ink-soft" style={{ fontSize: '0.9rem' }}>Showcase</a>
            <a href="/demo" onClick={e => { e.preventDefault(); nav('/demo') }} className="hide-mobile ink-soft" style={{ fontSize: '0.9rem' }}>Try the AI</a>
            <a href="/contact" onClick={e => { e.preventDefault(); nav('/contact') }} className="hide-mobile ink-soft" style={{ fontSize: '0.9rem' }}>Contact</a>
            <button onClick={cta} className="nova-btn" style={{ padding: '9px 20px', borderRadius: 99, fontWeight: 600, fontSize: '0.88rem' }}>
              {session ? 'My sites' : 'Get started'}
            </button>
          </div>
        </div>
      </nav>

      <header className="mesh-bg" style={{ paddingTop: 150, paddingBottom: 70, position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" className="float-orb float" style={{ position: 'absolute', top: '-25%', left: '50%', transform: 'translateX(-50%)', width: 820, height: 820, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,90,254,0.14), rgba(155,107,255,0.06) 40%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ ...W, position: 'relative', textAlign: 'center' }}>
          <div className="hero-anim mono" style={{ fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--indigo)', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(109,90,254,0.08)', border: '1px solid rgba(109,90,254,0.18)', borderRadius: 99, padding: '7px 16px' }}>
            <Sparkles size={13} /> AI-BUILT WEBSITES, LIVE IN MINUTES
          </div>
          <h1 className="hero-anim display" style={{ fontSize: 'clamp(2.1rem,6vw,4rem)', fontWeight: 700, lineHeight: 1.1 }}>
            Your AI wrote the site.<br /><span className="nova-text">We put it online.</span>
          </h1>
          <p className="hero-anim ink-soft" style={{ marginTop: 20, fontSize: 'clamp(1rem,2vw,1.15rem)', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', fontWeight: 400 }}>
            Paste HTML from ChatGPT, or describe your business and let our AI build it — hosted, secured, and live on your own harnova.my address.
          </p>
          <div className="hero-anim" style={{ marginTop: 34, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={cta} className="nova-btn" style={{ padding: '15px 32px', borderRadius: 99, fontWeight: 600, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Launch your site <ArrowUpRight size={17} />
            </button>
            <a href="#showcase" className="glass-btn" style={{ padding: '15px 32px', borderRadius: 99, fontWeight: 600, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              See live sites
            </a>
          </div>
        </div>
      </header>

      <section className="reveal-stagger" style={{ padding: '40px 0 70px' }}>
        <div style={{ ...W }}>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.title} className="card card-hover reveal-item" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(109,90,254,0.08)', border: '1px solid rgba(109,90,254,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color="var(--indigo)" />
                    </div>
                    <span className="mono ink-faint" style={{ fontSize: '0.7rem' }}>STEP {i + 1}</span>
                  </div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 600, marginBottom: 7 }}>{s.title}</h3>
                  <p className="ink-soft" style={{ fontSize: '0.86rem', lineHeight: 1.6, fontWeight: 400 }}>{s.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="showcase" style={{ padding: '50px 0 80px', borderTop: '1px solid var(--border)' }}>
        <div style={{ ...W }}>
          <div className="reveal-up mono" style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 14 }}>✦ LIVE ON HARNOVA</div>
          <h2 className="reveal-up display" style={{ fontSize: 'clamp(1.5rem,3.5vw,2.3rem)', fontWeight: 700, lineHeight: 1.15 }}>
            Sites people launched here.
          </h2>
          <p className="reveal-up ink-soft" style={{ marginTop: 14, fontSize: '0.98rem', maxWidth: 540, fontWeight: 400 }}>
            Every one of these was pasted in and live within a minute. Yours could be next.
          </p>
          {showcase.length === 0 ? (
            <div className="card reveal-up" style={{ marginTop: 36, padding: 44, textAlign: 'center' }}>
              <Globe size={26} className="ink-faint" />
              <p className="ink-faint" style={{ marginTop: 14, fontSize: '0.95rem' }}>The gallery is warming up — launch a site and toggle "Show in showcase" to be featured first.</p>
            </div>
          ) : (
            <div className="grid-3 reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginTop: 36 }}>
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

      <section style={{ padding: '30px 0 100px' }}>
        <div style={{ ...W }}>
          <div className="card reveal-up" style={{ padding: 'clamp(28px,4vw,50px)', background: 'linear-gradient(160deg, rgba(109,90,254,0.07), rgba(155,107,255,0.04) 55%, rgba(23,182,196,0.04))', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div aria-hidden="true" style={{ position: 'absolute', top: -70, right: -70, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,145,42,0.12), transparent 70%)' }} />
            <div className="mono ink-soft" style={{ fontSize: '0.72rem', letterSpacing: '0.18em' }}>PER SITE · PER MONTH</div>
            <div className="display" style={{ fontSize: 'clamp(2.6rem,5vw,3.6rem)', fontWeight: 700, margin: '12px 0 4px' }}>RM300</div>
            <p className="ink-soft" style={{ fontSize: '0.95rem', fontWeight: 400 }}>30 days of hosting · renew to keep it live · <RefreshCw size={12} style={{ verticalAlign: '-1px' }} /> no lock-in</p>
            <p className="ink-soft" style={{ fontSize: '0.9rem', marginTop: 12, fontWeight: 400 }}>
              Want a fully custom website and your own <span className="mono">.com</span> instead of a harnova.my link?{' '}
              <a href="/contact" onClick={e => { e.preventDefault(); nav('/contact') }} style={{ color: 'var(--cyan)', fontWeight: 600 }}>Hit us up</a> — we'll build and wire it up for you.
            </p>
            <div style={{ marginTop: 26, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={cta} className="nova-btn" style={{ padding: '14px 34px', borderRadius: 99, fontWeight: 600, fontSize: '1rem' }}>
                Get started — it's one paste away
              </button>
              <button onClick={() => nav('/demo')} className="glass-btn" style={{ padding: '14px 34px', borderRadius: 99, fontWeight: 600, fontSize: '1rem' }}>
                Try the AI first, free
              </button>
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
