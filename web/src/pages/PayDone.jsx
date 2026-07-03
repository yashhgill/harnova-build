import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { NovaMark } from '../lib/core.jsx'

/* Billplz redirects here with billplz[id], billplz[paid], billplz[x_signature]…
   The authoritative activation happens via the server callback — this page
   just tells the user what happened and sends them back to the dashboard. */
export default function PayDone({ nav }) {
  const [paid, setPaid] = useState(null)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    setPaid(q.get('billplz[paid]') === 'true')
  }, [])
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card rise" style={{ padding: 'clamp(30px,5vw,50px)', maxWidth: 460, width: '100%', textAlign: 'center' }}>
        {paid === null ? <NovaMark size={36} /> : paid ? (
          <>
            <div style={{ width: 58, height: 58, borderRadius: 99, margin: '0 auto', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={26} color="#39FF14" />
            </div>
            <h1 className="display" style={{ fontSize: '1.4rem', fontWeight: 700, margin: '20px 0 10px' }}>Payment received <span className="gold-text">✦</span></h1>
            <p style={{ color: '#8A8AA0', fontSize: '0.95rem', lineHeight: 1.65 }}>
              Your site is going live now — it can take up to a minute to appear. 30 days of hosting are on the clock.
            </p>
          </>
        ) : (
          <>
            <div style={{ width: 58, height: 58, borderRadius: 99, margin: '0 auto', background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={26} color="#FF7070" />
            </div>
            <h1 className="display" style={{ fontSize: '1.4rem', fontWeight: 700, margin: '20px 0 10px' }}>Payment didn't go through</h1>
            <p style={{ color: '#8A8AA0', fontSize: '0.95rem', lineHeight: 1.65 }}>
              No money was taken. Your site is saved as a draft — you can retry from the dashboard whenever you're ready.
            </p>
          </>
        )}
        <button onClick={() => nav('/app')} className="nova-btn" style={{ marginTop: 26, padding: '13px 30px', borderRadius: 99, fontWeight: 600 }}>
          Go to my sites
        </button>
      </div>
    </div>
  )
}
