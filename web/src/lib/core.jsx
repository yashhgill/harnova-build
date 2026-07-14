import { createClient } from '@supabase/supabase-js'

// URL + anon key are public by design (they ship in the JS bundle; RLS is the guard).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://fxlmdbouctcfxqewvcst.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bG1kYm91Y3RjZnhxZXd2Y3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMDUwNjYsImV4cCI6MjA5ODY4MTA2Nn0.T2vHhW9QFUmfSQkuKbyQWtCTupWgPHhvDiTrLESVepE',
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

// ---------------------------------------------------------------------------
// HarNova design system — light, premium SaaS aesthetic (emergent.sh-style).
// Design tokens are CSS custom properties on :root so every page/component
// can reference var(--...) instead of hardcoding colors.
// ---------------------------------------------------------------------------
export const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  :root {
    /* Surfaces */
    --bg:            #FAFAFC;
    --bg-alt:        #F3F3F8;
    --surface:       #FFFFFF;
    --surface-sunken:#F6F6FA;
    --border:        #E7E7EF;
    --border-strong: #D7D7E4;

    /* Text */
    --ink:           #14141F;
    --ink-soft:      #4A4A5C;
    --ink-faint:     #8A8AA0;

    /* Brand */
    --indigo:        #6D5AFE;
    --violet:        #9B6BFF;
    --cyan:          #17B6C4;
    --gold:          #C8912A;
    --brand-grad:    linear-gradient(100deg, var(--indigo) 0%, var(--violet) 55%, var(--cyan) 130%);

    /* Feedback */
    --success:       #1D9A6C;
    --danger:        #D6483A;
    --warning:       #C8912A;

    /* Elevation */
    --shadow-sm: 0 1px 2px rgba(20,20,31,0.05), 0 1px 1px rgba(20,20,31,0.03);
    --shadow-md: 0 4px 16px rgba(20,20,31,0.06), 0 2px 6px rgba(20,20,31,0.04);
    --shadow-lg: 0 16px 48px rgba(20,20,31,0.10), 0 4px 14px rgba(20,20,31,0.05);
    --shadow-glow: 0 8px 32px rgba(109,90,254,0.22);

    /* Radii + spacing scale */
    --r-sm: 10px;
    --r-md: 14px;
    --r-lg: 20px;
    --r-xl: 28px;

    /* Dark surfaces still used for the app-shell nav / hero accents */
    --ink-bg: #0B0B14;
  }

  body { background: var(--bg); color: var(--ink); font-family: 'Outfit', sans-serif; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
  ::selection { background: var(--indigo); color: #fff; }
  a { text-decoration: none; color: inherit; }
  button { font-family: inherit; cursor: pointer; }
  input, textarea { font-family: inherit; }
  .display { font-family: 'Unbounded', sans-serif; letter-spacing: -0.01em; }
  .mono { font-family: 'JetBrains Mono', monospace; }

  .nova-text { background: var(--brand-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .gold-text { color: var(--gold); }
  .ink-soft { color: var(--ink-soft); }
  .ink-faint { color: var(--ink-faint); }

  .nova-btn { background: var(--brand-grad); box-shadow: var(--shadow-glow); border: none; color: #fff; transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s cubic-bezier(.22,1,.36,1); }
  .nova-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(109,90,254,0.32); }
  .nova-btn:active:not(:disabled) { transform: translateY(0); }
  .nova-btn:disabled { opacity: .5; cursor: not-allowed; }

  .glass-btn { border: 1px solid var(--border-strong); background: var(--surface); color: var(--ink); transition: all .3s ease; }
  .glass-btn:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--indigo); box-shadow: var(--shadow-md); }

  .card { border-radius: var(--r-lg); border: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-sm); transition: box-shadow .3s ease, transform .3s ease; }
  .card-hover:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }

  .field { width: 100%; background: var(--surface); border: 1.5px solid var(--border-strong); border-radius: var(--r-sm); color: var(--ink); padding: 13px 16px; font-size: .95rem; outline: none; transition: border-color .25s ease, box-shadow .25s ease; }
  .field:focus { border-color: var(--indigo); box-shadow: 0 0 0 4px rgba(109,90,254,0.12); }
  .field::placeholder { color: var(--ink-faint); }

  @keyframes hnRise { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes hnPulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
  @keyframes hnFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
  .rise { animation: hnRise .8s cubic-bezier(.22,1,.36,1) both; }
  .float { animation: hnFloat 6s ease-in-out infinite; }

  /* Utility: subtle grain/gradient mesh backdrop for hero sections */
  .mesh-bg {
    background:
      radial-gradient(60% 50% at 15% 10%, rgba(109,90,254,0.10), transparent 60%),
      radial-gradient(50% 45% at 85% 15%, rgba(23,182,196,0.10), transparent 60%),
      radial-gradient(60% 60% at 50% 100%, rgba(155,107,255,0.08), transparent 60%);
  }

  @media (max-width: 768px) {
    .grid-2, .grid-3 { grid-template-columns: 1fr !important; }
    .hide-mobile { display: none !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .15s !important; }
  }
  :focus-visible { outline: 2px solid var(--cyan); outline-offset: 3px; border-radius: 4px; }

  /* Scrollbar polish */
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 8px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--ink-faint); }
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
      <circle cx="20" cy="20" r="3.2" fill="#fff" opacity="0.95" />
    </svg>
  )
}
