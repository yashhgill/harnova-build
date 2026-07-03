import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export async function api(path, { method = 'GET', body } = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/app' },
  })
}

export const daysLeft = expiresAt => {
  if (!expiresAt) return null
  return Math.max(0, Math.ceil((new Date(expiresAt) - Date.now()) / 86400000))
}

export const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #04040A; color: #F4F4FA; font-family: 'Outfit', sans-serif; overflow-x: hidden; }
  ::selection { background: #6366F1; color: #fff; }
  a { text-decoration: none; color: inherit; }
  button { font-family: inherit; cursor: pointer; }
  input, textarea { font-family: inherit; }
  .display { font-family: 'Unbounded', sans-serif; }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .nova-text { background: linear-gradient(100deg,#818CF8 0%,#C084FC 45%,#22D3EE 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .gold-text { color: #F5C542; }
  .nova-btn { background: linear-gradient(100deg,#6366F1,#A855F7 55%,#22D3EE 130%); box-shadow: 0 8px 28px rgba(124,93,250,0.32); border: none; color: #fff; transition: all .3s cubic-bezier(.22,1,.36,1); }
  .nova-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(124,93,250,0.5); }
  .nova-btn:disabled { opacity: .55; cursor: not-allowed; }
  .glass-btn { border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.04); color: #F4F4FA; transition: all .3s ease; }
  .glass-btn:hover:not(:disabled) { transform: translateY(-2px); border-color: rgba(255,255,255,0.3); }
  .card { border-radius: 18px; border: 1px solid rgba(255,255,255,0.09); background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012)); }
  .field { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.13); border-radius: 12px; color: #F4F4FA; padding: 13px 16px; font-size: .95rem; outline: none; transition: border-color .25s ease; }
  .field:focus { border-color: #818CF8; }
  .field::placeholder { color: #6E6E85; }
  @keyframes hnRise { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes hnPulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
  .rise { animation: hnRise .8s cubic-bezier(.22,1,.36,1) both; }
  @media (max-width: 768px) {
    .grid-2, .grid-3 { grid-template-columns: 1fr !important; }
    .hide-mobile { display: none !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .15s !important; }
  }
  :focus-visible { outline: 2px solid #22D3EE; outline-offset: 3px; border-radius: 4px; }
`

export function NovaMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="ng" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#818CF8" /><stop offset="55%" stopColor="#C084FC" /><stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <path d="M20 1 C21.8 12.5 27.5 18.2 39 20 C27.5 21.8 21.8 27.5 20 39 C18.2 27.5 12.5 21.8 1 20 C12.5 18.2 18.2 12.5 20 1 Z" fill="url(#ng)" />
      <circle cx="20" cy="20" r="3.2" fill="#fff" opacity="0.9" />
    </svg>
  )
}
