import { useState } from 'react'
import { ArrowUpRight, Sparkles, Send, Globe, Eye, Code2, RefreshCw } from 'lucide-react'
import { NovaMark, api } from '../lib/core.jsx'
import { useEffect } from 'react'

const W = { maxWidth: 1000, margin: '0 auto', padding: '0 clamp(18px,4vw,40px)' }

const EXAMPLES = [
  'Landing page for a nasi lemak stall in Melaka, WhatsApp 0123456789, gold and black',
  'Portfolio for a freelance wedding photographer, moody dark theme, Instagram link',
  'One-page menu site for a bubble tea shop, pastel colors, opening hours section',
  'Service page for a home aircon repair business in KL, testimonials, call button',
]

export default function Demo({ nav }) {
  const [priceSen, setPriceSen] = useState(30000)
  useEffect(() => { api('/pricing').then(d => setPriceSen(d.priceSen)).catch(() => {}) }, [])
  const priceLabel = `RM${(priceSen / 100).toFixed(0)}`
  const [showcase, setShowcase] = useState([])
  const [root, setRoot] = useState('harnova.my')
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [html, setHtml] = useState('')
  const [err, setErr] = useState(null)
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    fetch('/api/showcase').then(r => r.json())
      .then(d => { setShowcase(d.sites || []); if (d.root) setRoot(d.root) })
      .catch(() => {})
  }, [])

  const generate = async (p) => {
    const q = (p || prompt).trim()
    if (!q || busy) return
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/demo/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
      setHtml(data.html)
      setRemaining(data.remaining)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  return (
    <>
      <nav className="nav-blur" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '15px 0', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" onClick={e => { e.preventDefault(); nav('/') }} className="display" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '0.95rem' }}>
            <NovaMark size={22} /> HARNOVA <span className="nova-text">BUILD</span>
          </a>
          <button onClick={() => nav('/app')} className="nova-btn" style={{ padding: '9px 20px', borderRadius: 99, fontWeight: 600, fontSize: '0.88rem' }}>
            Get started
          </button>
        </div>
      </nav>

      <header className="mesh-bg" style={{ padding: '60px 0 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" className="float" style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,90,254,0.1), rgba(155,107,255,0.05) 40%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ ...W, position: 'relative' }}>
          <div className="mono gold-text" style={{ fontSize: '0.72rem', letterSpacing: '0.2em', marginBottom: 14 }}>✦ TRY IT — NO SIGN-IN NEEDED</div>
          <h1 className="display rise" style={{ fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: 700, lineHeight: 1.15 }}>
            Describe your site.<br /><span className="nova-text">Watch the AI build it.</span>
          </h1>
          <p className="ink-soft" style={{ marginTop: 16, fontSize: '0.98rem', maxWidth: 560, margin: '16px auto 0', fontWeight: 400 }}>
            A few free generations, no account needed. Like the result? Sign in to keep refining it and put it live on your own harnova.my link for {priceLabel}.
          </p>
        </div>
      </header>

      <section style={{ padding: '30px 0 60px' }}>
        <div style={{ ...W }}>
          <div className="card" style={{ padding: 'clamp(20px,3vw,30px)' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input className="field" value={prompt} disabled={busy}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') generate() }}
                placeholder="Describe the website you want…" style={{ flex: '1 1 260px' }} />
              <button onClick={() => generate()} disabled={busy || !prompt.trim()} className="nova-btn"
                style={{ padding: '0 24px', borderRadius: 12, fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 130, justifyContent: 'center' }}>
                {busy ? <span style={{ animation: 'hnPulse 1.1s ease-in-out infinite' }}>✦ Writing…</span> : <><Send size={14} /> Generate</>}
              </button>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => { setPrompt(ex); generate(ex) }} disabled={busy} className="glass-btn ink-soft"
                  style={{ padding: '7px 13px', borderRadius: 99, fontSize: '0.76rem' }}>
                  {ex.length > 46 ? ex.slice(0, 46) + '…' : ex}
                </button>
              ))}
            </div>
            {remaining !== null && !err && (
              <div className="mono ink-soft" style={{ marginTop: 12, fontSize: '0.72rem' }}>{remaining} free {remaining === 1 ? 'try' : 'tries'} left today on this connection</div>
            )}
            {err && <div role="alert" style={{ marginTop: 16, padding: '12px 16px', borderRadius: 11, background: 'rgba(214,72,58,0.08)', border: '1px solid rgba(214,72,58,0.3)', fontSize: '0.87rem', color: 'var(--danger)' }}>{err}</div>}

            {html && (
              <div style={{ marginTop: 22 }}>
                <div className="ink-soft" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '0.82rem' }}>
                  <Eye size={13} /> Live preview
                </div>
                <iframe title="AI preview" sandbox="allow-scripts" srcDoc={html}
                  style={{ width: '100%', height: 460, borderRadius: 14, border: '1px solid var(--border-strong)', background: '#fff' }} />
                <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button onClick={() => nav('/app')} className="nova-btn" style={{ padding: '12px 24px', borderRadius: 99, fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={14} /> Sign in to host this — {priceLabel} <ArrowUpRight size={15} />
                  </button>
                  <button onClick={() => generate()} disabled={busy} className="glass-btn" style={{ padding: '12px 20px', borderRadius: 99, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <RefreshCw size={13} /> Try another prompt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="showcase" style={{ padding: '10px 0 90px', borderTop: '1px solid var(--border)' }}>
        <div style={{ ...W, paddingTop: 50 }}>
          <div className="mono gold-text" style={{ fontSize: '0.72rem', letterSpacing: '0.2em', marginBottom: 14 }}>✦ LIVE ON HARNOVA</div>
          <h2 className="display" style={{ fontSize: 'clamp(1.4rem,3.5vw,2.1rem)', fontWeight: 700 }}>Real sites people launched here.</h2>
          {showcase.length === 0 ? (
            <div className="card ink-faint" style={{ marginTop: 30, padding: 40, textAlign: 'center' }}>
              <Globe size={24} style={{ opacity: 0.5 }} />
              <p style={{ marginTop: 12, fontSize: '0.92rem' }}>Gallery is warming up — be the first showcase site.</p>
            </div>
          ) : (
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginTop: 30 }}>
              {showcase.map(s => {
                const url = `https://${s.subdomain}.${root}`
                return (
                  <a key={s.subdomain} href={url} target="_blank" rel="noreferrer" className="card card-hover" style={{ overflow: 'hidden', display: 'block' }}>
                    <div style={{ position: 'relative', height: 160, overflow: 'hidden', borderBottom: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
                      <iframe src={url} title={s.name} loading="lazy" tabIndex={-1} aria-hidden="true" scrolling="no"
                        style={{ width: '333%', height: '333%', transform: 'scale(0.3)', transformOrigin: 'top left', border: 'none', pointerEvents: 'none' }} />
                    </div>
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                        <div className="mono ink-faint" style={{ fontSize: '0.7rem', marginTop: 3 }}>{s.subdomain}.{root}</div>
                      </div>
                      <ArrowUpRight size={15} className="ink-soft" style={{ flexShrink: 0 }} />
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '30px 0' }}>
        <div style={{ ...W, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', fontSize: '0.8rem' }} className="ink-faint">
          <span>© {new Date().getFullYear()} HarNova Technology</span>
          <span style={{ display: 'inline-flex', gap: 18, alignItems: 'center' }}>
            <a href="/contact" onClick={e => { e.preventDefault(); nav('/contact') }} className="ink-soft">Contact</a>
            <a href="/terms" onClick={e => { e.preventDefault(); nav('/terms') }} className="ink-soft">Terms</a>
          </span>
        </div>
      </footer>
    </>
  )
}
