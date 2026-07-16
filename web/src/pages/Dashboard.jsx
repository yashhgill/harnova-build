import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Plus, Trash2, RefreshCw, Rocket, Check, X, Pencil, Eye, LogOut, Globe, QrCode, Copy, ShieldCheck, Sparkles, Send, Search, Phone, MapPin, Star, Clipboard } from 'lucide-react'
import { supabase, api, daysLeft, NovaMark } from '../lib/core.jsx'

const W = { maxWidth: 1000, margin: '0 auto', padding: '0 clamp(18px,4vw,40px)' }

export default function Dashboard({ session, nav }) {
  const [sites, setSites] = useState(null)
  const [root, setRoot] = useState('harnova.my')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null) // site being edited
  const [toast, setToast] = useState(null)
  const [payInfo, setPayInfo] = useState(null) // QR payment modal data
  const [admin, setAdmin] = useState(false)
  const [payEmail, setPayEmail] = useState('yashchaal99@gmail.com')

  const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4200) }

  const load = () => api('/sites').then(d => { setSites(d.sites); setRoot(d.root); setAdmin(!!d.admin); if (d.payEmail) setPayEmail(d.payEmail) }).catch(e => notify(e.message, false))
  useEffect(() => { load() }, [])

  const pay = async site => {
    try {
      const info = await api('/billing/create', { method: 'POST', body: { site_id: site.id } })
      setPayInfo(info)
    } catch (e) { notify(e.message, false) }
  }

  const toggleShowcase = async site => {
    try {
      await api(`/sites/${site.id}`, { method: 'PATCH', body: { showcase: !site.showcase } })
      setSites(s => s.map(x => x.id === site.id ? { ...x, showcase: !x.showcase } : x))
    } catch (e) { notify(e.message, false) }
  }

  const remove = async site => {
    if (!window.confirm(`Delete "${site.name}"? ${site.subdomain}.${root} will stop working immediately. This can't be undone.`)) return
    try {
      await api(`/sites/${site.id}`, { method: 'DELETE' })
      setSites(s => s.filter(x => x.id !== site.id))
      notify('Site deleted.')
    } catch (e) { notify(e.message, false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav className="nav-blur" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '14px 0', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" className="display" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '0.92rem' }}>
            <NovaMark size={21} /> HARNOVA <span className="nova-text">BUILD</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <a href="/contact" onClick={e => { e.preventDefault(); nav('/contact') }} className="hide-mobile ink-soft" style={{ fontSize: '0.85rem' }}>Contact</a>
            <span className="hide-mobile ink-soft" style={{ fontSize: '0.85rem' }}>{session.user.email}</span>
            <button onClick={() => supabase.auth.signOut()} className="glass-btn" aria-label="Sign out" style={{ padding: '8px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.85rem' }}>
              <LogOut size={14} /> <span className="hide-mobile">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <main style={{ ...W, padding: '44px clamp(18px,4vw,40px) 90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="display" style={{ fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 700 }}>My sites</h1>
            <p className="ink-soft" style={{ fontSize: '0.92rem', marginTop: 6, fontWeight: 400 }}>RM300 per site per 30 days. Renew anytime — days stack on top.</p>
          </div>
          <button onClick={() => { setEditing(null); setCreating(true) }} className="nova-btn" style={{ padding: '12px 24px', borderRadius: 99, fontWeight: 600, fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> New site
          </button>
        </div>

        {sites === null ? (
          <div style={{ padding: 80, textAlign: 'center', animation: 'hnPulse 1.6s ease-in-out infinite' }}><NovaMark size={34} /></div>
        ) : sites.length === 0 && !creating ? (
          <div className="card" style={{ marginTop: 34, padding: 'clamp(34px,5vw,60px)', textAlign: 'center' }}>
            <Rocket size={30} color="var(--indigo)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '16px 0 8px' }}>Launch your first site</h2>
            <p className="ink-soft" style={{ fontSize: '0.94rem', maxWidth: 420, margin: '0 auto', fontWeight: 400 }}>
              Paste the HTML your AI generated, pick a name, pay RM300 — and it's live with SSL on your own link.
            </p>
            <button onClick={() => setCreating(true)} className="nova-btn" style={{ marginTop: 24, padding: '13px 30px', borderRadius: 99, fontWeight: 600 }}>
              Paste my code
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 34 }}>
            {sites.map(s => <SiteRow key={s.id} site={s} root={root} onPay={pay} onShowcase={toggleShowcase} onDelete={remove} onEdit={() => { setCreating(false); setEditing(s) }} />)}
          </div>
        )}

        {admin && <AdminQueue notify={notify} onChanged={load} />}

        {admin && <LeadsPanel notify={notify} />}

        {payInfo && <PayModal info={payInfo} payEmail={payEmail} onClose={() => { setPayInfo(null); load() }} notify={notify} />}

        {(creating || editing) && (
          <SiteEditor
            root={root}
            site={editing}
            onClose={() => { setCreating(false); setEditing(null) }}
            onSaved={(site, isNew) => {
              setCreating(false); setEditing(null)
              load()
              if (isNew) { notify('Site saved as draft — one RM300 QR payment and it’s live.'); pay(site) }
              else notify('Code updated. Changes appear within a minute.')
            }}
          />
        )}
      </main>

      {toast && (
        <div role="status" style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 300, padding: '13px 22px', borderRadius: 12, background: 'var(--surface)', border: `1px solid ${toast.ok ? 'rgba(29,154,108,0.35)' : 'rgba(214,72,58,0.35)'}`, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 9, boxShadow: 'var(--shadow-lg)' }}>
          {toast.ok ? <Check size={15} color="var(--success)" /> : <X size={15} color="var(--danger)" />} {toast.msg}
        </div>
      )}
    </div>
  )
}

function StatusPill({ site }) {
  const d = daysLeft(site.expires_at)
  const live = site.status === 'live' && d > 0
  const expired = site.status === 'expired' || (site.expires_at && d === 0)
  const [bg, bd, fg, label] = live
    ? ['rgba(29,154,108,0.08)', 'rgba(29,154,108,0.3)', 'var(--success)', `Live · ${d}d left`]
    : expired
      ? ['rgba(214,72,58,0.08)', 'rgba(214,72,58,0.3)', 'var(--danger)', 'Expired']
      : ['rgba(200,145,42,0.08)', 'rgba(200,145,42,0.3)', 'var(--warning)', 'Draft — not live yet']
  return <span className="mono" style={{ fontSize: '0.68rem', padding: '4px 11px', borderRadius: 99, background: bg, border: `1px solid ${bd}`, color: fg, whiteSpace: 'nowrap' }}>{label}</span>
}

function SiteRow({ site, root, onPay, onShowcase, onDelete, onEdit }) {
  const url = `https://${site.subdomain}.${root}`
  const live = site.status === 'live' && daysLeft(site.expires_at) > 0
  return (
    <div className="card card-hover" style={{ padding: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
      <div style={{ flex: '1 1 240px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{site.name}</span>
          <StatusPill site={site} />
        </div>
        <a href={live ? url : undefined} target="_blank" rel="noreferrer" className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: live ? 'var(--cyan)' : 'var(--ink-faint)', marginTop: 7 }}>
          <Globe size={12} /> {site.subdomain}.{root} {live && <ArrowUpRight size={12} />}
        </a>
        {site.custom_domain && <div className="mono ink-soft" style={{ fontSize: '0.78rem', marginTop: 4 }}>+ {site.custom_domain}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        <label className="ink-soft" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', cursor: 'pointer', marginRight: 4 }}>
          <input type="checkbox" checked={site.showcase} onChange={() => onShowcase(site)} style={{ accentColor: 'var(--indigo)', width: 15, height: 15 }} />
          <Eye size={13} /> Showcase
        </label>
        <button onClick={onEdit} className="glass-btn" style={{ padding: '9px 14px', borderRadius: 10, fontSize: '0.83rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Pencil size={13} /> Edit code
        </button>
        <button onClick={() => onPay(site)} className="nova-btn" style={{ padding: '9px 16px', borderRadius: 10, fontSize: '0.83rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {live ? <><RefreshCw size={13} /> Renew +30d</> : <><QrCode size={13} /> Pay RM300 · go live</>}
        </button>
        <button onClick={() => onDelete(site)} className="glass-btn" aria-label={`Delete ${site.name}`} style={{ padding: '9px 11px', borderRadius: 10 }}>
          <Trash2 size={14} color="var(--danger)" />
        </button>
      </div>
    </div>
  )
}

function SiteEditor({ root, site, onClose, onSaved }) {
  const isNew = !site
  const [name, setName] = useState(site?.name || '')
  const [subdomain, setSubdomain] = useState(site?.subdomain || '')
  const [html, setHtml] = useState('')
  const [avail, setAvail] = useState(null) // null | 'checking' | true | false
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [showCode, setShowCode] = useState(false)
  const [chat, setChat] = useState([]) // {role, content} persisted (existing site) or session-only (new site)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiLeft, setAiLeft] = useState(null)
  const timer = useRef(null)
  const chatEndRef = useRef(null)

  // Load persisted chat history when editing an existing site.
  useEffect(() => {
    if (isNew || !site) return
    api(`/sites/${site.id}/messages`).then(d => setChat(d.messages || [])).catch(() => {})
  }, [isNew, site])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chat.length, aiBusy])

  const generate = async () => {
    const prompt = aiPrompt.trim()
    if (!prompt || aiBusy) return
    setAiBusy(true); setErr(null)
    setChat(c => [...c, { role: 'user', content: prompt }])
    setAiPrompt('')
    try {
      const res = await api('/ai/generate', {
        method: 'POST',
        body: { prompt, currentHtml: html.trim() || undefined, history: isNew ? chat : undefined, site_id: site?.id },
      })
      setHtml(res.html)
      setChat(c => [...c, { role: 'assistant', content: 'Done — updated the site. Check the preview →' }])
      setAiLeft(res.remaining)
      setShowCode(false)
    } catch (e) {
      setErr(e.message)
      setChat(c => [...c, { role: 'assistant', content: `⚠ ${e.message}` }])
    }
    setAiBusy(false)
  }

  useEffect(() => {
    if (!isNew) return
    const sub = subdomain.toLowerCase()
    if (!sub) { setAvail(null); return }
    setAvail('checking')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      fetch(`/api/check?subdomain=${encodeURIComponent(sub)}`)
        .then(r => r.json()).then(d => setAvail(d.available)).catch(() => setAvail(null))
    }, 450)
    return () => clearTimeout(timer.current)
  }, [subdomain, isNew])

  const save = async () => {
    setErr(null); setBusy(true)
    try {
      if (isNew) {
        const { site: created } = await api('/sites', { method: 'POST', body: { name, subdomain: subdomain.toLowerCase(), html } })
        onSaved(created, true)
      } else {
        const body = html.trim() ? { html, name } : { name }
        const { site: updated } = await api(`/sites/${site.id}`, { method: 'PATCH', body })
        onSaved(updated, false)
      }
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  const canSave = isNew
    ? name.trim() && avail === true && html.trim().length >= 20
    : name.trim()

  return (
    <div role="dialog" aria-modal="true" aria-label={isNew ? 'New site' : 'Edit site'} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(20,20,31,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: 'clamp(14px,4vw,44px)' }}>
      <div className="card rise" style={{ width: '100%', maxWidth: 760, padding: 'clamp(22px,3.5vw,36px)', background: 'var(--surface)', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 className="display" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{isNew ? 'New site' : `Edit — ${site.name}`}</h2>
          <button onClick={onClose} className="glass-btn" aria-label="Close" style={{ padding: 9, borderRadius: 10 }}><X size={16} /></button>
        </div>

        <label className="ink-soft" style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8 }}>Site name</label>
        <input className="field" value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="Nasi Lemak Corner" />

        {isNew && (
          <>
            <label className="ink-soft" style={{ display: 'block', fontSize: '0.85rem', margin: '20px 0 8px' }}>Your link</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <input className="field mono" style={{ borderRadius: '12px 0 0 12px', fontSize: '0.9rem' }} value={subdomain}
                onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="nasilemakcorner" maxLength={63} />
              <span className="mono ink-soft" style={{ padding: '13px 16px', background: 'var(--surface-sunken)', border: '1.5px solid var(--border-strong)', borderLeft: 'none', borderRadius: '0 12px 12px 0', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>.{root}</span>
            </div>
            {subdomain && (
              <div className="mono" style={{ marginTop: 8, fontSize: '0.76rem', color: avail === true ? 'var(--success)' : avail === false ? 'var(--danger)' : 'var(--ink-soft)' }}>
                {avail === 'checking' ? 'Checking…' : avail === true ? `✓ ${subdomain}.${root} is yours` : avail === false ? '✗ Taken or not allowed — try another' : ''}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 22, borderRadius: 14, border: '1px solid rgba(109,90,254,0.25)', background: 'linear-gradient(160deg, rgba(109,90,254,0.06), rgba(23,182,196,0.04))', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 16px', borderBottom: chat.length ? '1px solid rgba(109,90,254,0.15)' : 'none' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600 }}>
              <Sparkles size={15} className="gold-text" /> AI Agent
            </span>
            {aiLeft !== null && <span className="mono ink-soft" style={{ fontSize: '0.68rem' }}>{aiLeft} left today</span>}
          </div>

          {chat.length > 0 && (
            <div style={{ maxHeight: 260, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chat.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%', padding: '9px 13px', borderRadius: m.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                    fontSize: '0.86rem', lineHeight: 1.55,
                    background: m.role === 'user' ? 'var(--brand-grad)' : 'var(--surface)',
                    color: m.role === 'user' ? '#fff' : 'var(--ink)',
                    border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {aiBusy && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div className="ink-soft" style={{ padding: '9px 13px', borderRadius: '14px 14px 14px 3px', fontSize: '0.86rem', background: 'var(--surface)', border: '1px solid var(--border)', animation: 'hnPulse 1.2s ease-in-out infinite' }}>
                    ✦ Writing…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {chat.length === 0 && (
            <p className="ink-soft" style={{ fontSize: '0.8rem', padding: '0 16px 12px', fontWeight: 400 }}>
              {html.trim().length >= 20
                ? 'Describe a change and the agent edits the site — "make it dark green", "add a menu section with prices".'
                : 'Describe your site and the agent writes it — "landing page for a nasi lemak stall in Melaka, WhatsApp 0123456789, gold and black". Keep chatting to refine it.'}
            </p>
          )}

          <div style={{ display: 'flex', gap: 9, padding: '12px 16px', borderTop: chat.length ? '1px solid rgba(109,90,254,0.15)' : 'none' }}>
            <input className="field" value={aiPrompt} disabled={aiBusy}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') generate() }}
              placeholder={html.trim().length >= 20 ? 'What should change?' : 'Describe your website…'}
              style={{ flex: 1 }} />
            <button onClick={generate} disabled={aiBusy || !aiPrompt.trim()} className="nova-btn" aria-label="Send to AI Agent"
              style={{ padding: '0 18px', borderRadius: 12, fontWeight: 600, fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 50, justifyContent: 'center' }}>
              <Send size={15} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 8px' }}>
          <label className="ink-soft" style={{ fontSize: '0.85rem' }}>
            {html.trim().length >= 20 ? 'Site preview' : (isNew ? 'Or paste your site’s code (HTML) directly' : 'Paste new code to replace the current site (leave empty to keep it)')}
          </label>
          {html.trim().length >= 20 && (
            <button onClick={() => setShowCode(c => !c)} className="glass-btn" style={{ padding: '6px 13px', borderRadius: 9, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Eye size={12} /> {showCode ? 'Back to preview' : 'View code'}
            </button>
          )}
        </div>
        {html.trim().length >= 20 && !showCode ? (
          <iframe title="Preview" sandbox="allow-scripts" srcDoc={html} style={{ width: '100%', height: 320, borderRadius: 12, border: '1.5px solid var(--border-strong)', background: '#fff' }} />
        ) : (
          <textarea className="field mono" rows={12} spellCheck={false} value={html} onChange={e => setHtml(e.target.value)}
            placeholder={'<!DOCTYPE html>\n<html>\n  ...paste code here, or just describe your site to the agent above...\n</html>'}
            style={{ resize: 'vertical', fontSize: '0.82rem', lineHeight: 1.6 }} />
        )}
        <div className="mono ink-faint" style={{ marginTop: 7, fontSize: '0.72rem', color: html.length > 1_500_000 ? 'var(--danger)' : undefined }}>
          {(html.length / 1024).toFixed(0)} KB / 1,500 KB · single-file HTML works best — host big images on a CDN and link them
        </div>

        {err && <div role="alert" style={{ marginTop: 16, padding: '12px 16px', borderRadius: 11, background: 'rgba(214,72,58,0.06)', border: '1px solid rgba(214,72,58,0.3)', fontSize: '0.87rem', color: 'var(--danger)' }}>{err}</div>}

        <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
          <button onClick={save} disabled={!canSave || busy} className="nova-btn" style={{ padding: '13px 28px', borderRadius: 99, fontWeight: 600, fontSize: '0.93rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {busy ? 'Saving…' : isNew ? <><Rocket size={15} /> Save & pay RM300</> : 'Save changes'}
          </button>
          <button onClick={onClose} className="glass-btn" style={{ padding: '13px 24px', borderRadius: 99, fontSize: '0.93rem' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}


function PayModal({ info, payEmail, onClose, notify }) {
  const amount = (info.amount_sen / 100).toFixed(2)
  const copyRef = () => {
    navigator.clipboard?.writeText(info.reference)
      .then(() => notify('Reference copied — paste it in your transfer notes.'))
      .catch(() => {})
  }
  const mail = `mailto:${payEmail}?subject=${encodeURIComponent(`Payment ${info.reference} — ${info.site.name}`)}&body=${encodeURIComponent(`Hi HarNova,\n\nI've paid RM${amount} for "${info.site.name}" (${info.site.subdomain}).\nReference: ${info.reference}\n\nReceipt attached.`)}`
  return (
    <div role="dialog" aria-modal="true" aria-label="Pay by QR" style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(20,20,31,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: 'clamp(14px,4vw,44px)' }}>
      <div className="card rise" style={{ width: '100%', maxWidth: 480, padding: 'clamp(24px,4vw,36px)', background: 'var(--surface)', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="display" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Pay RM{amount} by QR</h2>
          <button onClick={onClose} className="glass-btn" aria-label="Close" style={{ padding: 9, borderRadius: 10 }}><X size={16} /></button>
        </div>
        <img src="/qr.png" alt="DuitNow QR — scan with any Malaysian banking app" width="230" height="230"
          style={{ borderRadius: 16, background: '#fff', padding: 10, width: 230, height: 230, objectFit: 'contain', border: '1px solid var(--border)' }}
          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }} />
        <div className="ink-soft" style={{ display: 'none', padding: '30px 16px', border: '1px dashed var(--border-strong)', borderRadius: 14, fontSize: '0.88rem' }}>
          QR is on the way — email us at <span style={{ color: 'var(--ink)' }}>{payEmail}</span> for payment details.
        </div>
        <p className="ink-soft" style={{ marginTop: 18, fontSize: '0.9rem', lineHeight: 1.6 }}>
          Scan with any Malaysian banking app (DuitNow), and put this reference in the <strong style={{ color: 'var(--ink)' }}>transfer notes</strong>:
        </p>
        <button onClick={copyRef} className="glass-btn mono" style={{ marginTop: 12, padding: '12px 20px', borderRadius: 12, fontSize: '1rem', letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {info.reference} <Copy size={14} />
        </button>
        <ol className="ink-soft" style={{ textAlign: 'left', margin: '20px auto 0', maxWidth: 360, fontSize: '0.87rem', lineHeight: 1.7, paddingLeft: 20 }}>
          <li>Scan &amp; pay RM{amount} with the reference in the notes</li>
          <li>Email your receipt to <a href={mail} style={{ color: 'var(--cyan)' }}>{payEmail}</a></li>
          <li>We verify and your site goes live — usually within a few hours, always same day</li>
        </ol>
        <a href={mail} className="nova-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 22, padding: '13px 28px', borderRadius: 99, fontWeight: 600, fontSize: '0.92rem' }}>
          I've paid — email my receipt <ArrowUpRight size={15} />
        </a>
        <p className="ink-faint" style={{ marginTop: 14, fontSize: '0.76rem' }}>Your site stays saved as a draft until we confirm the payment.</p>
      </div>
    </div>
  )
}

function AdminQueue({ notify, onChanged }) {
  const [queue, setQueue] = useState(null)
  const [busy, setBusy] = useState(null)
  const load = () => api('/admin/payments').then(d => setQueue(d.payments)).catch(e => notify(e.message, false))
  useEffect(() => { load() }, [])
  const act = async (p, action) => {
    setBusy(p.id)
    try {
      await api(`/admin/payments/${p.id}/${action}`, { method: 'POST' })
      notify(action === 'approve' ? `${p.reference} approved — site is live +30d.` : `${p.reference} rejected.`)
      load(); onChanged()
    } catch (e) { notify(e.message, false) }
    setBusy(null)
  }
  if (!queue) return null
  return (
    <section style={{ marginTop: 46 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShieldCheck size={17} className="gold-text" />
        <h2 className="display" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Payment queue</h2>
        <span className="mono ink-soft" style={{ fontSize: '0.72rem' }}>ADMIN · {queue.length} pending</span>
      </div>
      {queue.length === 0 ? (
        <p className="ink-faint" style={{ marginTop: 14, fontSize: '0.9rem' }}>All clear — nothing waiting for verification.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {queue.map(p => (
            <div key={p.id} className="card" style={{ padding: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <span className="mono gold-text" style={{ fontSize: '0.85rem' }}>{p.reference}</span>
                <div className="ink-soft" style={{ fontSize: '0.85rem', marginTop: 5 }}>
                  {p.sites?.name} · <span className="mono" style={{ fontSize: '0.78rem' }}>{p.sites?.subdomain}</span>
                </div>
                <div className="ink-faint" style={{ fontSize: '0.78rem', marginTop: 3 }}>
                  {p.profiles?.email} · RM{(p.amount_sen / 100).toFixed(2)} · {new Date(p.created_at).toLocaleString('en-MY')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 9 }}>
                <button disabled={busy === p.id} onClick={() => act(p, 'approve')} className="nova-btn" style={{ padding: '9px 18px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Check size={13} /> Approve
                </button>
                <button disabled={busy === p.id} onClick={() => act(p, 'reject')} className="glass-btn" style={{ padding: '9px 16px', borderRadius: 10, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <X size={13} color="var(--danger)" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const LEAD_STATUSES = ['not_contacted', 'contacted', 'interested', 'declined', 'converted']
const STATUS_LABEL = { not_contacted: 'Not contacted', contacted: 'Contacted', interested: 'Interested', declined: 'Declined', converted: 'Converted' }

function LeadsPanel({ notify }) {
  const [leads, setLeads] = useState(null)
  const [requests, setRequests] = useState(null)
  const [busy, setBusy] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [reqNotes, setReqNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadLeads = () => api('/admin/leads').then(d => setLeads(d.leads)).catch(e => notify(e.message, false))
  const loadRequests = () => api('/admin/lead-search-requests').then(d => setRequests(d.requests)).catch(e => notify(e.message, false))
  useEffect(() => { loadLeads(); loadRequests() }, [])

  const setStatus = async (lead, status) => {
    setBusy(lead.id)
    try {
      await api(`/admin/leads/${lead.id}`, { method: 'PATCH', body: { status } })
      notify(`${lead.business_name} marked ${STATUS_LABEL[status].toLowerCase()}.`)
      loadLeads()
    } catch (e) { notify(e.message, false) }
    setBusy(null)
  }

  const copyDraft = async (lead) => {
    try {
      await navigator.clipboard.writeText(lead.outreach_draft || '')
      notify('Outreach message copied.')
    } catch { notify('Could not copy — select and copy manually.', false) }
  }

  const submitRequest = async (e) => {
    e.preventDefault()
    if (!category.trim() || !city.trim()) return
    setSubmitting(true)
    try {
      await api('/admin/lead-search-requests', { method: 'POST', body: { category: category.trim(), city: city.trim(), notes: reqNotes.trim() } })
      notify('Search request queued — run it via Google Maps when you get a chance, then add the results here.')
      setCategory(''); setCity(''); setReqNotes(''); setShowForm(false)
      loadRequests()
    } catch (e) { notify(e.message, false) }
    setSubmitting(false)
  }

  const dismissRequest = async (r) => {
    setBusy(r.id)
    try {
      await api(`/admin/lead-search-requests/${r.id}/dismiss`, { method: 'POST' })
      loadRequests()
    } catch (e) { notify(e.message, false) }
    setBusy(null)
  }

  if (!leads) return null
  const pendingRequests = (requests || []).filter(r => r.status === 'pending')

  return (
    <section style={{ marginTop: 46 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Search size={17} className="gold-text" />
        <h2 className="display" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Leads</h2>
        <span className="mono ink-soft" style={{ fontSize: '0.72rem' }}>ADMIN · {leads.length} found</span>
        <button onClick={() => setShowForm(v => !v)} className="glass-btn" style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 99, fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={13} /> Find new leads
        </button>
      </div>

      {showForm && (
        <form onSubmit={submitRequest} className="card" style={{ marginTop: 16, padding: 18, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 160px' }}>
            <label className="ink-soft" style={{ display: 'block', fontSize: '0.78rem', marginBottom: 6 }}>Category</label>
            <input className="field" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. bakery, photographer" required />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label className="ink-soft" style={{ display: 'block', fontSize: '0.78rem', marginBottom: 6 }}>City</label>
            <input className="field" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Penang" required />
          </div>
          <div style={{ flex: '2 1 220px' }}>
            <label className="ink-soft" style={{ display: 'block', fontSize: '0.78rem', marginBottom: 6 }}>Notes (optional)</label>
            <input className="field" value={reqNotes} onChange={e => setReqNotes(e.target.value)} placeholder="Anything specific to look for" />
          </div>
          <button type="submit" disabled={submitting} className="nova-btn" style={{ padding: '11px 20px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600 }}>
            {submitting ? 'Queuing…' : 'Queue request'}
          </button>
        </form>
      )}

      <p className="ink-faint" style={{ marginTop: 12, fontSize: '0.78rem', lineHeight: 1.6 }}>
        There's no live Google Maps API wired up here, so "Find new leads" queues a request — search Google Maps yourself (or ask me) for that category + city, checking which listings have no "Website" button, then add them below as new leads.
      </p>

      {pendingRequests.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="ink-soft" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 8 }}>Pending search requests</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingRequests.map(r => (
              <div key={r.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.category}</span>
                <span className="ink-faint" style={{ fontSize: '0.8rem' }}>in {r.city}</span>
                {r.notes && <span className="ink-faint" style={{ fontSize: '0.78rem' }}>· {r.notes}</span>}
                <button disabled={busy === r.id} onClick={() => dismissRequest(r)} className="glass-btn" style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 99, fontSize: '0.76rem' }}>
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {leads.length === 0 ? (
        <p className="ink-faint" style={{ marginTop: 14, fontSize: '0.9rem' }}>No leads yet — queue a search request above to get started.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
          {leads.map(lead => (
            <div key={lead.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{lead.business_name}</span>
                    {lead.rating != null && (
                      <span className="ink-soft" style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Star size={11} /> {lead.rating} ({lead.reviews ?? 0})
                      </span>
                    )}
                  </div>
                  <div className="ink-soft" style={{ fontSize: '0.82rem', marginTop: 5 }}>{lead.category} · {lead.city}</div>
                  {lead.address && (
                    <div className="ink-faint" style={{ fontSize: '0.78rem', marginTop: 4, display: 'flex', gap: 5 }}>
                      <MapPin size={12} style={{ marginTop: 2, flexShrink: 0 }} /> {lead.address}
                    </div>
                  )}
                  {lead.phone && (
                    <div className="ink-faint" style={{ fontSize: '0.78rem', marginTop: 3, display: 'flex', gap: 5, alignItems: 'center' }}>
                      <Phone size={12} /> {lead.phone}
                    </div>
                  )}
                  <div className="mono ink-faint" style={{ fontSize: '0.72rem', marginTop: 6 }}>{lead.web_presence}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '0 0 auto' }}>
                  <select
                    value={lead.status}
                    disabled={busy === lead.id}
                    onChange={e => setStatus(lead, e.target.value)}
                    className="field"
                    style={{ padding: '8px 12px', borderRadius: 10, fontSize: '0.82rem' }}
                  >
                    {LEAD_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                  <button onClick={() => copyDraft(lead)} className="glass-btn" style={{ padding: '8px 14px', borderRadius: 10, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                    <Clipboard size={13} /> Copy message
                  </button>
                  {lead.phone && (
                    <a href={`https://wa.me/6${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="glass-btn" style={{ padding: '8px 14px', borderRadius: 10, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <Send size={13} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
