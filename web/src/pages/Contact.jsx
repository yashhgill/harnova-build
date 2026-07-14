import { useState } from 'react'
import { ArrowUpRight, Send, Check, Globe2, MessageCircle, Mail } from 'lucide-react'
import { NovaMark } from '../lib/core.jsx'

const W = { maxWidth: 720, margin: '0 auto', padding: '0 clamp(18px,4vw,40px)' }
const CONTACT_EMAIL = 'yashchaal99@gmail.com'
const WHATSAPP = 'https://wa.me/60123456789' // update with the real business WhatsApp number

export default function Contact({ nav }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [interest, setInterest] = useState('custom_domain')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState(null)

  const submit = async e => {
    e.preventDefault()
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, message, interest }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not send that — try again.')
      setDone(true)
    } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }

  return (
    <>
      <nav className="nav-blur" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '15px 0', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...W, maxWidth: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" onClick={e => { e.preventDefault(); nav('/') }} className="display" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '0.95rem' }}>
            <NovaMark size={22} /> HARNOVA <span className="nova-text">BUILD</span>
          </a>
          <button onClick={() => nav('/app')} className="nova-btn" style={{ padding: '9px 20px', borderRadius: 99, fontWeight: 600, fontSize: '0.88rem' }}>
            Get started
          </button>
        </div>
      </nav>

      <div style={{ padding: '60px 0 90px' }}>
        <div style={{ ...W }}>
          <div className="mono gold-text" style={{ fontSize: '0.72rem', letterSpacing: '0.2em', marginBottom: 14, textAlign: 'center' }}>✦ GET IN TOUCH</div>
          <h1 className="display rise" style={{ fontSize: 'clamp(1.7rem,4.5vw,2.6rem)', fontWeight: 700, textAlign: 'center', lineHeight: 1.15 }}>
            Want a custom website<br /><span className="nova-text">and your own domain?</span>
          </h1>
          <p className="ink-soft" style={{ marginTop: 16, fontSize: '0.98rem', textAlign: 'center', maxWidth: 480, margin: '16px auto 0', fontWeight: 400 }}>
            If a <span className="mono">yourname.harnova.my</span> link isn't enough, hit us up — we'll design and wire up a fully custom site on <span style={{ color: 'var(--ink)' }}>your own <span className="mono">.com</span></span> instead.
          </p>

          <div className="card" style={{ marginTop: 40, padding: 'clamp(24px,4vw,40px)' }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(29,154,108,0.1)', border: '1px solid rgba(29,154,108,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <Check size={24} color="var(--success)" />
                </div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '18px 0 8px' }}>Message sent.</h2>
                <p className="ink-soft" style={{ fontSize: '0.92rem', maxWidth: 380, margin: '0 auto' }}>We'll get back to you at {email || 'your email'} — usually within a day. For anything urgent, WhatsApp us directly below.</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="ink-soft" style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8 }}>Name</label>
                    <input className="field" required value={name} maxLength={120} onChange={e => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div>
                    <label className="ink-soft" style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8 }}>Email</label>
                    <input className="field" required type="email" value={email} maxLength={200} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                </div>

                <label className="ink-soft" style={{ display: 'block', fontSize: '0.85rem', margin: '18px 0 8px' }}>What's this about?</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    ['custom_domain', 'Custom website + domain'],
                    ['general', 'Something else'],
                  ].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setInterest(val)}
                      className={interest === val ? 'nova-btn' : 'glass-btn'}
                      style={{ padding: '10px 18px', borderRadius: 99, fontSize: '0.85rem', fontWeight: 600 }}>
                      {label}
                    </button>
                  ))}
                </div>

                <label className="ink-soft" style={{ display: 'block', fontSize: '0.85rem', margin: '18px 0 8px' }}>Message</label>
                <textarea className="field" required rows={5} value={message} maxLength={4000} onChange={e => setMessage(e.target.value)}
                  placeholder={interest === 'custom_domain'
                    ? "Tell us about your business, what you'd want on the site, and if you already own a domain."
                    : 'What can we help with?'}
                  style={{ resize: 'vertical' }} />

                {err && <div role="alert" style={{ marginTop: 16, padding: '12px 16px', borderRadius: 11, background: 'rgba(214,72,58,0.08)', border: '1px solid rgba(214,72,58,0.3)', fontSize: '0.87rem', color: 'var(--danger)' }}>{err}</div>}

                <button type="submit" disabled={busy} className="nova-btn" style={{ marginTop: 22, padding: '14px 28px', borderRadius: 99, fontWeight: 600, fontSize: '0.94rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {busy ? 'Sending…' : <><Send size={15} /> Send message</>}
                </button>
              </form>
            )}
          </div>

          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="card glass-btn" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(23,182,196,0.1)', border: '1px solid rgba(23,182,196,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageCircle size={18} color="var(--cyan)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>WhatsApp us</div>
                <div className="ink-soft" style={{ fontSize: '0.8rem' }}>Fastest way to reach us</div>
              </div>
              <ArrowUpRight size={15} className="ink-soft" style={{ marginLeft: 'auto', flexShrink: 0 }} />
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="card glass-btn" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(109,90,254,0.1)', border: '1px solid rgba(109,90,254,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mail size={18} color="var(--indigo)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Email us</div>
                <div className="mono ink-soft" style={{ fontSize: '0.78rem' }}>{CONTACT_EMAIL}</div>
              </div>
              <ArrowUpRight size={15} className="ink-soft" style={{ marginLeft: 'auto', flexShrink: 0 }} />
            </a>
          </div>

          <div className="card" style={{ marginTop: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(160deg, rgba(109,90,254,0.07), rgba(23,182,196,0.04))' }}>
            <Globe2 size={20} className="gold-text" style={{ flexShrink: 0 }} />
            <p className="ink-soft" style={{ fontSize: '0.86rem', lineHeight: 1.6 }}>
              Already have a <span className="mono">.com</span>? We can connect it to a site hosted here — mention it above and we'll set up the custom domain for you.
            </p>
          </div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '30px 0' }}>
        <div style={{ ...W, maxWidth: 1000, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', fontSize: '0.8rem' }} className="ink-faint">
          <span>© {new Date().getFullYear()} HarNova Technology</span>
          <span style={{ display: 'inline-flex', gap: 18, alignItems: 'center' }}>
            <a href="/demo" onClick={e => { e.preventDefault(); nav('/demo') }} className="ink-soft">Demo</a>
            <a href="/terms" onClick={e => { e.preventDefault(); nav('/terms') }} className="ink-soft">Terms</a>
          </span>
        </div>
      </footer>
    </>
  )
}
