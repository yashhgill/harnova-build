import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Plus, Trash2, RefreshCw, Rocket, Check, X, Pencil, Eye, LogOut, Globe, QrCode, Copy, ShieldCheck, Sparkles, Send } from 'lucide-react'
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
    <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '14px 0', background: 'rgba(4,4,10,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" className="display" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '0.92rem' }}>
            <NovaMark size={21} /> HARNOVA <span className="nova-text">BUILD</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="hide-mobile" style={{ fontSize: '0.85rem', color: '#8A8AA0' }}>{session.user.email}</span>
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
            <p style={{ color: '#8A8AA0', fontSize: '0.92rem', marginTop: 6, fontWeight: 300 }}>RM10 per site per 30 days. Renew anytime — days stack on top.</p>
          </div>
          <button onClick={() => { setEditing(null); setCreating(true) }} className="nova-btn" style={{ padding: '12px 24px', borderRadius: 99, fontWeight: 600, fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> New site
          </button>
        </div>

        {sites === null ? (
          <div style={{ padding: 80, textAlign: 'center', animation: 'hnPulse 1.6s ease-in-out infinite' }}><NovaMark size={34} /></div>
        ) : sites.length === 0 && !creating ? (
          <div className="card" style={{ marginTop: 34, padding: 'clamp(34px,5vw,60px)', textAlign: 'center' }}>
            <Rocket size={30} color="#818CF8" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '16px 0 8px' }}>Launch your first site</h2>
            <p style={{ color: '#8A8AA0', fontSize: '0.94rem', maxWidth: 420, margin: '0 auto', fontWeight: 300 }}>
              Paste the HTML your AI generated, pick a name, pay RM10 — and it's live with SSL on your own link.
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

        {payInfo && <PayModal info={payInfo} payEmail={payEmail} onClose={() => { setPayInfo(null); load() }} notify={notify} />}

        {(creating || editing) && (
          <SiteEditor
            root={root}
            site={editing}
            onClose={() => { setCreating(false); setEditing(null) }}
            onSaved={(site, isNew) => {
              setCreating(false); setEditing(null)
              load()
              if (isNew) { notify('Site saved as draft — one RM10 QR payment and it\u2019s live.'); pay(site) }
              else notify('Code updated. Changes appear within a minute.')
            }}
          />
        )}
      </main>

      {toast && (
        <div role="status" style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 300, padding: '13px 22px', borderRadius: 12, background: '#0B0B14', border: `1px solid ${toast.ok ? 'rgba(57,255,20,0.4)' : 'rgba(255,80,80,0.45)'}`, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 16px 44px rgba(0,0,0,0.55)' }}>
          {toast.ok ? <Check size={15} color="#39FF14" /> : <X size={15} color="#FF5050" />} {toast.msg}
        </div>
      )}
    </>
  )
}

function StatusPill({ site }) {
  const d = daysLeft(site.expires_at)
  const live = site.status === 'live' && d > 0
  const expired = site.status === 'expired' || (site.expires_at && d === 0)
  const [bg, bd, fg, label] = live
    ? ['rgba(57,255,20,0.08)', 'rgba(57,255,20,0.35)', '#39FF14', `Live · ${d}d left`]
    : expired
      ? ['rgba(255,80,80,0.08)', 'rgba(255,80,80,0.35)', '#FF7070', 'Expired']
      : ['rgba(245,197,66,0.08)', 'rgba(245,197,66,0.35)', '#F5C542', 'Draft — not live yet']
  return <span className="mono" style={{ fontSize: '0.68rem', padding: '4px 11px', borderRadius: 99, background: bg, border: `1px solid ${bd}`, color: fg, whiteSpace: 'nowrap' }}>{label}</span>
}

function SiteRow({ site, root, onPay, onShowcase, onDelete, onEdit }) {
  const url = `https://${site.subdomain}.${root}`
  const live = site.status === 'live' && daysLeft(site.expires_at) > 0
  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
      <div style={{ flex: '1 1 240px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{site.name}</span>
          <StatusPill site={site} />
        </div>
        <a href={live ? url : undefined} target="_blank" rel="noreferrer" className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: live ? '#22D3EE' : '#6E6E85', marginTop: 7 }}>
          <Globe size={12} /> {site.subdomain}.{root} {live && <ArrowUpRight size={12} />}
        </a>
        {site.custom_domain && <div className="mono" style={{ fontSize: '0.78rem', color: '#8A8AA0', marginTop: 4 }}>+ {site.custom_domain}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', color: '#8A8AA0', cursor: 'pointer', marginRight: 4 }}>
          <input type="checkbox" checked={site.showcase} onChange={() => onShowcase(site)} style={{ accentColor: '#818CF8', width: 15, height: 15 }} />
          <Eye size={13} /> Showcase
        </label>
        <button onClick={onEdit} className="glass-btn" style={{ padding: '9px 14px', borderRadius: 10, fontSize: '0.83rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Pencil size={13} /> Edit code
        </button>
        <button onClick={() => onPay(site)} className="nova-btn" style={{ padding: '9px 16px', borderRadius: 10, fontSize: '0.83rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {live ? <><RefreshCw size={13} /> Renew +30d</> : <><QrCode size={13} /> Pay RM10 · go live</>}
        </button>
        <button onClick={() => onDelete(site)} className="glass-btn" aria-label={`Delete ${site.name}`} style={{ padding: '9px 11px', borderRadius: 10 }}>
          <Trash2 size={14} color="#FF7070" />
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
  const [preview, setPreview] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiLog, setAiLog] = useState([]) // {role, content} chat history for context
  const [aiLeft, setAiLeft] = useState(null)
  const timer = useRef(null)

  const generate = async () => {
    const prompt = aiPrompt.trim()
    if (!prompt || aiBusy) return
    setAiBusy(true); setErr(null)
    try {
      const res = await api('/ai/generate', { method: 'POST', body: { prompt, currentHtml: html.trim() || undefined, history: aiLog } })
      setHtml(res.html)
      setAiLog(l => [...l.slice(-4), { role: 'user', content: prompt }, { role: 'assistant', content: 'Generated an updated version of the site.' }])
      setAiLeft(res.remaining)
      setAiPrompt('')
      setPreview(true)
    } catch (e) { setErr(e.message) }
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
    <div role="dialog" aria-modal="true" aria-label={isNew ? 'New site' : 'Edit site'} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(4,4,10,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: 'clamp(14px,4vw,44px)' }}>
      <div className="card rise" style={{ width: '100%', maxWidth: 760, padding: 'clamp(22px,3.5vw,36px)', background: '#0B0B14' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 className="display" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{isNew ? 'New site' : `Edit — ${site.name}`}</h2>
          <button onClick={onClose} className="glass-btn" aria-label="Close" style={{ padding: 9, borderRadius: 10 }}><X size={16} /></button>
        </div>

        <label style={{ display: 'block', fontSize: '0.85rem', color: '#B9B9CC', marginBottom: 8 }}>Site name</label>
        <input className="field" value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="Nasi Lemak Corner" />

        {isNew && (
          <>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#B9B9CC', margin: '20px 0 8px' }}>Your link</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <input className="field mono" style={{ borderRadius: '12px 0 0 12px', fontSize: '0.9rem' }} value={subdomain}
                onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="nasilemakcorner" maxLength={63} />
              <span className="mono" style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.13)', borderLeft: 'none', borderRadius: '0 12px 12px 0', fontSize: '0.9rem', color: '#8A8AA0', whiteSpace: 'nowrap' }}>.{root}</span>
            </div>
            {subdomain && (
              <div className="mono" style={{ marginTop: 8, fontSize: '0.76rem', color: avail === true ? '#39FF14' : avail === false ? '#FF7070' : '#8A8AA0' }}>
                {avail === 'checking' ? 'Checking…' : avail === true ? `✓ ${subdomain}.${root} is yours` : avail === false ? '✗ Taken or not allowed — try another' : ''}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 22, borderRadius: 14, border: '1px solid rgba(129,140,248,0.35)', background: 'linear-gradient(160deg, rgba(99,102,241,0.1), rgba(34,211,238,0.05))', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600 }}>
              <Sparkles size={15} className="gold-text" /> AI builder
            </span>
            {aiLeft !== null && <span className="mono" style={{ fontSize: '0.68rem', color: '#8A8AA0' }}>{aiLeft} left today</span>}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#8A8AA0', marginBottom: 12, fontWeight: 300 }}>
            {html.trim().length >= 20
              ? 'Describe a change and the AI edits the code below — "make it dark green", "add a menu section with prices".'
              : 'No code yet? Describe your site and the AI writes it — "landing page for a nasi lemak stall in Melaka, WhatsApp 0123456789, gold and black".'}
          </p>
          <div style={{ display: 'flex', gap: 9 }}>
            <input className="field" value={aiPrompt} disabled={aiBusy}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') generate() }}
              placeholder={html.trim().length >= 20 ? 'What should change?' : 'Describe your website…'}
              style={{ flex: 1 }} />
            <button onClick={generate} disabled={aiBusy || !aiPrompt.trim()} className="nova-btn" aria-label="Generate with AI"
              style={{ padding: '0 20px', borderRadius: 12, fontWeight: 600, fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 118, justifyContent: 'center' }}>
              {aiBusy ? <span style={{ animation: 'hnPulse 1.1s ease-in-out infinite' }}>✦ Writing…</span> : <><Send size={14} /> Generate</>}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 8px' }}>
          <label style={{ fontSize: '0.85rem', color: '#B9B9CC' }}>
            {isNew ? 'Paste your site\u2019s code (HTML)' : 'Paste new code to replace the current site (leave empty to keep it)'}
          </label>
          {html.trim().length >= 20 && (
            <button onClick={() => setPreview(p => !p)} className="glass-btn" style={{ padding: '6px 13px', borderRadius: 9, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Eye size={12} /> {preview ? 'Back to code' : 'Preview'}
            </button>
          )}
        </div>
        {preview ? (
          <iframe title="Preview" sandbox="allow-scripts" srcDoc={html} style={{ width: '100%', height: 320, borderRadius: 12, border: '1px solid rgba(255,255,255,0.13)', background: '#fff' }} />
        ) : (
          <textarea className="field mono" rows={12} spellCheck={false} value={html} onChange={e => setHtml(e.target.value)}
            placeholder={'<!DOCTYPE html>\n<html>\n  ...the code your AI generated...\n</html>'}
            style={{ resize: 'vertical', fontSize: '0.82rem', lineHeight: 1.6 }} />
        )}
        <div className="mono" style={{ marginTop: 7, fontSize: '0.72rem', color: html.length > 1_500_000 ? '#FF7070' : '#6E6E85' }}>
          {(html.length / 1024).toFixed(0)} KB / 1,500 KB · single-file HTML works best — host big images on a CDN and link them
        </div>

        {err && <div role="alert" style={{ marginTop: 16, padding: '12px 16px', borderRadius: 11, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.35)', fontSize: '0.87rem', color: '#FF9C9C' }}>{err}</div>}

        <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
          <button onClick={save} disabled={!canSave || busy} className="nova-btn" style={{ padding: '13px 28px', borderRadius: 99, fontWeight: 600, fontSize: '0.93rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {busy ? 'Saving…' : isNew ? <><Rocket size={15} /> Save & pay RM10</> : 'Save changes'}
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
    <div role="dialog" aria-modal="true" aria-label="Pay by QR" style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(4,4,10,0.82)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: 'clamp(14px,4vw,44px)' }}>
      <div className="card rise" style={{ width: '100%', maxWidth: 480, padding: 'clamp(24px,4vw,36px)', background: '#0B0B14', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="display" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Pay RM{amount} by QR</h2>
          <button onClick={onClose} className="glass-btn" aria-label="Close" style={{ padding: 9, borderRadius: 10 }}><X size={16} /></button>
        </div>
        <img src="/qr.png" alt="DuitNow QR — scan with any Malaysian banking app" width="230" height="230"
          style={{ borderRadius: 16, background: '#fff', padding: 10, width: 230, height: 230, objectFit: 'contain' }}
          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }} />
        <div style={{ display: 'none', padding: '30px 16px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 14, color: '#8A8AA0', fontSize: '0.88rem' }}>
          QR is on the way — email us at <span style={{ color: '#F4F4FA' }}>{payEmail}</span> for payment details.
        </div>
        <p style={{ marginTop: 18, fontSize: '0.9rem', color: '#B9B9CC', lineHeight: 1.6 }}>
          Scan with any Malaysian banking app (DuitNow), and put this reference in the <strong style={{ color: '#F4F4FA' }}>transfer notes</strong>:
        </p>
        <button onClick={copyRef} className="glass-btn mono" style={{ marginTop: 12, padding: '12px 20px', borderRadius: 12, fontSize: '1rem', letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {info.reference} <Copy size={14} />
        </button>
        <ol style={{ textAlign: 'left', margin: '20px auto 0', maxWidth: 360, color: '#8A8AA0', fontSize: '0.87rem', lineHeight: 1.7, paddingLeft: 20 }}>
          <li>Scan &amp; pay RM{amount} with the reference in the notes</li>
          <li>Email your receipt to <a href={mail} style={{ color: '#22D3EE' }}>{payEmail}</a></li>
          <li>We verify and your site goes live — usually within a few hours, always same day</li>
        </ol>
        <a href={mail} className="nova-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 22, padding: '13px 28px', borderRadius: 99, fontWeight: 600, fontSize: '0.92rem' }}>
          I've paid — email my receipt <ArrowUpRight size={15} />
        </a>
        <p style={{ marginTop: 14, fontSize: '0.76rem', color: '#6E6E85' }}>Your site stays saved as a draft until we confirm the payment.</p>
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
        <ShieldCheck size={17} color="#F5C542" />
        <h2 className="display" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Payment queue</h2>
        <span className="mono" style={{ fontSize: '0.72rem', color: '#8A8AA0' }}>ADMIN · {queue.length} pending</span>
      </div>
      {queue.length === 0 ? (
        <p style={{ marginTop: 14, color: '#6E6E85', fontSize: '0.9rem' }}>All clear — nothing waiting for verification.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {queue.map(p => (
            <div key={p.id} className="card" style={{ padding: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <span className="mono" style={{ fontSize: '0.85rem', color: '#F5C542' }}>{p.reference}</span>
                <div style={{ fontSize: '0.85rem', color: '#B9B9CC', marginTop: 5 }}>
                  {p.sites?.name} · <span className="mono" style={{ fontSize: '0.78rem' }}>{p.sites?.subdomain}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6E6E85', marginTop: 3 }}>
                  {p.profiles?.email} · RM{(p.amount_sen / 100).toFixed(2)} · {new Date(p.created_at).toLocaleString('en-MY')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 9 }}>
                <button disabled={busy === p.id} onClick={() => act(p, 'approve')} className="nova-btn" style={{ padding: '9px 18px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Check size={13} /> Approve
                </button>
                <button disabled={busy === p.id} onClick={() => act(p, 'reject')} className="glass-btn" style={{ padding: '9px 16px', borderRadius: 10, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <X size={13} color="#FF7070" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
