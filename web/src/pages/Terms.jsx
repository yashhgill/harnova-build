import { ArrowUpRight } from 'lucide-react'
import { NovaMark } from '../lib/core.jsx'

const W = { maxWidth: 760, margin: '0 auto', padding: '0 clamp(18px,4vw,40px)' }

const SECTIONS = [
  ['The service', 'HarNova Build hosts a static website you provide, on a harnova.my subdomain, for 30 days per payment at the price shown at checkout (promotions may apply from time to time). Activation happens after we manually verify your DuitNow transfer — usually within a few hours, always the same day. Your site stays saved as a draft until then.'],
  ['Renewals & expiry', 'Each payment adds 30 days on top of your current expiry. If a site expires it is not deleted — it shows a renewal notice page, and one payment brings it straight back. No refunds once a site has been activated, but unpaid drafts can be deleted anytime.'],
  ['Acceptable use', 'You must own or have the right to publish everything in your code. Not allowed: anything illegal in Malaysia, scams or phishing, malware, gambling, adult content, hate content, or impersonating other businesses. We can suspend or remove a site that breaks these rules, without refund, and will cooperate with Malaysian authorities where required.'],
  ['Your content, your responsibility', 'We host your HTML as-is and do not review, edit, or endorse it. You are the publisher of your site and solely responsible for its content, its accuracy, and any data it collects from visitors.'],
  ['Service limits', 'Sites are static HTML up to 1.5 MB, best-effort uptime on Cloudflare\u2019s edge. Accounts are limited to 20 sites and 3 unpaid drafts. We may adjust limits and pricing with notice on this page.'],
  ['Contact', 'Payment receipts, takedown requests, or anything else: yashchaal99@gmail.com. HarNova Technology, Melaka, Malaysia.'],
]

export default function Terms({ nav }) {
  return (
    <div style={{ paddingTop: 60, paddingBottom: 90 }}>
      <div style={{ ...W }}>
        <a href="/" onClick={e => { e.preventDefault(); nav('/') }} className="display" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '0.95rem' }}>
          <NovaMark size={22} /> HARNOVA <span className="nova-text">BUILD</span>
        </a>
        <h1 className="display" style={{ fontSize: 'clamp(1.6rem,4vw,2.3rem)', fontWeight: 700, margin: '34px 0 10px' }}>Terms of service</h1>
        <p className="ink-soft" style={{ fontSize: '0.9rem' }}>Plain-language version — using HarNova Build means you agree to this.</p>
        {SECTIONS.map(([h, t]) => (
          <section key={h} style={{ marginTop: 34 }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 10 }}><span className="gold-text">✦</span> {h}</h2>
            <p className="ink-soft" style={{ fontSize: '0.95rem', lineHeight: 1.75, fontWeight: 400 }}>{t}</p>
          </section>
        ))}
        <button onClick={() => nav('/')} className="glass-btn" style={{ marginTop: 44, padding: '12px 26px', borderRadius: 99, fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Back to HarNova Build <ArrowUpRight size={15} />
        </button>
      </div>
    </div>
  )
}
