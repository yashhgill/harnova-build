/**
 * HarNova Build — single Cloudflare Worker.
 *
 *  ┌ build.harnova.my            → dashboard (static assets, /api/* runs here first)
 *  ├ build.harnova.my/api/*      → JSON API (auth, sites, QR billing, admin approvals, showcase)
 *  ├ {anything}.harnova.my       → serve that site's HTML from Supabase (cached)
 *  └ customer-custom-domain.com  → same lookup via custom_domain column
 *
 * Payments: manual DuitNow QR. Users pay the QR with a unique reference in the
 * transfer notes, email/WhatsApp the receipt; an admin approves in-dashboard,
 * which flips the site live and stacks +30 days. No payment gateway needed.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY, GROQ_API_KEY
 * Vars (wrangler.toml): ROOT_DOMAIN, APP_HOST, PRICE_SEN, ADMIN_EMAILS, PAY_EMAIL
 */

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }
const j = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } })

/* ─── Supabase REST helpers (service role) ────────────────────────── */
async function sb(env, path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'content-type': 'application/json',
      prefer: method === 'GET' ? '' : 'return=representation',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) throw new Error(`supabase ${res.status}: ${text}`)
  return data
}

/* Verify the user's Supabase JWT and return their user object. */
async function getUser(env, req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

/* ─── Validation ──────────────────────────────────────────────────── */
const SUB_RE = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/
const MAX_HTML = 1_500_000 // ~1.5 MB

function validSubdomain(s) { return typeof s === 'string' && SUB_RE.test(s) }

/* ─── Payment helpers ─────────────────────────────────────────────── */
function makeReference(subdomain) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let tail = ''
  const rnd = crypto.getRandomValues(new Uint8Array(4))
  for (const b of rnd) tail += chars[b % chars.length]
  const stem = subdomain.replace(/[^a-z0-9]/g, '').slice(0, 6).toUpperCase() || 'SITE'
  return `HB-${stem}-${tail}`
}

function isAdmin(env, user) {
  return (env.ADMIN_EMAILS || '').toLowerCase().split(',').map(e => e.trim()).filter(Boolean)
    .includes((user.email || '').toLowerCase())
}

/* Approve a payment: mark paid + flip site live, stacking +30 days. */
async function activatePayment(env, payment) {
  await sb(env, `payments?id=eq.${payment.id}`, {
    method: 'PATCH', body: { status: 'paid', paid_at: new Date().toISOString() },
  })
  const sites = await sb(env, `sites?id=eq.${payment.site_id}&select=expires_at&limit=1`)
  const base = sites[0]?.expires_at && new Date(sites[0].expires_at) > new Date()
    ? new Date(sites[0].expires_at) : new Date()
  const next = new Date(base.getTime() + 30 * 24 * 3600 * 1000).toISOString()
  await sb(env, `sites?id=eq.${payment.site_id}`, {
    method: 'PATCH', body: { status: 'live', expires_at: next, reminder_sent_at: null },
  })
}

/* ─── Expiry reminders (daily cron) ───────────────────────────────
 * Emails a customer once, ~3 days before their site's 30-day period ends,
 * with a renew nudge. reminder_sent_at is cleared on every renewal
 * (see activatePayment) so the next cycle gets its own reminder.
 * Uses Resend's REST API directly — no SDK needed. */
async function sendExpiryReminders(env) {
  const windowEnd = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()
  const rows = await sb(
    env,
    `sites?status=eq.live&expires_at=lte.${windowEnd}&expires_at=gt.${new Date().toISOString()}&reminder_sent_at=is.null&select=id,name,subdomain,custom_domain,expires_at,user_id,profiles(email)`
  )
  if (!rows?.length) return { sent: 0 }

  let sent = 0
  for (const site of rows) {
    const email = site.profiles?.email
    if (!email) continue
    const host = site.custom_domain || `${site.subdomain}.${env.ROOT_DOMAIN}`
    const daysLeft = Math.max(0, Math.ceil((new Date(site.expires_at) - Date.now()) / 86400000))

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.RESEND_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: env.REMINDER_FROM_EMAIL || `HarNova Build <noreply@${env.ROOT_DOMAIN}>`,
          to: [email],
          subject: `${site.name} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — renew to stay live`,
          html: `<p>Hi,</p>
<p>Your site <strong>${site.name}</strong> (<a href="https://${host}">${host}</a>) is set to expire in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.</p>
<p>Renew for another 30 days for RM${(currentPriceSen(env) / 100).toFixed(0)} by logging into your dashboard and paying the QR — same as when you first set it up: <a href="https://${env.APP_HOST}">${env.APP_HOST}</a></p>
<p>If it lapses, the site stops being served until it's renewed.</p>
<p>— HarNova Build</p>`,
        }),
      })
      if (res.ok) {
        await sb(env, `sites?id=eq.${site.id}`, {
          method: 'PATCH', body: { reminder_sent_at: new Date().toISOString() },
        })
        sent++
      }
    } catch { /* one failed email shouldn't stop the rest */ }
  }
  return { sent, checked: rows.length }
}

/* ─── Pricing (promo-aware) ────────────────────────────────────────
 * RM150 promo through 24 Sept 2026 (Malaysia time), then reverts to the
 * normal PRICE_SEN (RM300) automatically — no manual flip needed. */
const PROMO_PRICE_SEN = 15000
const PROMO_END = new Date('2026-09-24T16:00:00Z') // 2026-09-25 00:00 MYT (UTC+8)
function currentPriceSen(env) {
  const normal = Number(env.PRICE_SEN || 30000)
  return new Date() < PROMO_END ? PROMO_PRICE_SEN : normal
}

/* ─── Site serving (the product itself) ───────────────────────────── */
const HOLDING_PAGE = (title, msg, appHost) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · HarNova</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#04040A;color:#F4F4FA;font-family:system-ui,sans-serif;text-align:center;padding:24px}
  .star{font-size:2.4rem;background:linear-gradient(100deg,#818CF8,#C084FC,#22D3EE);-webkit-background-clip:text;background-clip:text;color:transparent}
  h1{font-size:1.5rem;margin:18px 0 10px}p{color:#8A8AA0;line-height:1.6;max-width:420px}
  a{display:inline-block;margin-top:22px;padding:12px 26px;border-radius:99px;color:#fff;text-decoration:none;background:linear-gradient(100deg,#6366F1,#A855F7)}
</style></head><body><div><div class="star">✦</div><h1>${title}</h1><p>${msg}</p>
<a href="https://${appHost}">HarNova Build</a></div></body></html>`

async function serveSite(env, hostname) {
  const root = `.${env.ROOT_DOMAIN}`
  let rows
  if (hostname.endsWith(root)) {
    const sub = hostname.slice(0, -root.length)
    rows = await sb(env, `sites?subdomain=eq.${encodeURIComponent(sub)}&select=html,status,expires_at&limit=1`)
  } else {
    rows = await sb(env, `sites?custom_domain=eq.${encodeURIComponent(hostname)}&select=html,status,expires_at&limit=1`)
  }
  const HOLD_HEADERS = { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex', 'x-content-type-options': 'nosniff' }
  const site = rows && rows[0]
  if (!site || site.status === 'draft') {
    return new Response(
      HOLDING_PAGE('This star hasn\u2019t ignited yet', 'No site lives at this address. It could be yours — paste your AI-generated code and go live in seconds.', env.APP_HOST),
      { status: 404, headers: HOLD_HEADERS })
  }
  const expired = site.status === 'expired' || (site.expires_at && new Date(site.expires_at) < new Date())
  if (expired) {
    return new Response(
      HOLDING_PAGE('This site is taking a nap', 'Its hosting period has ended. The owner can renew it from the HarNova Build dashboard to bring it back.', env.APP_HOST),
      { status: 410, headers: HOLD_HEADERS })
  }
  return new Response(site.html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60',
      'x-content-type-options': 'nosniff',
      'x-powered-by': 'HarNova Build',
    },
  })
}

/* ─── AI site generation (Groq) ───────────────────────────────────── */
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

const SITE_SYSTEM_PROMPT = `You are HarNova Build's website generator, writing production-quality single-file websites for small businesses in Malaysia (and elsewhere).

Output ONE complete HTML document: \`<!DOCTYPE html>\` through \`</html>\`. All CSS in a single <style> tag, any JS inline in <script> — no build tools, no external JS frameworks, no localStorage/sessionStorage, no external fonts other than Google Fonts via <link>.

Design like a senior designer, not a template generator:
- Real information architecture for the business described: a hero that states what the business is and its single strongest hook, then sections that actually make sense for that business (e.g. a restaurant needs a menu with prices, a service business needs "how it works" + testimonials + a clear CTA, a portfolio needs project highlights). Do not pad with generic filler sections that don't fit the request.
- Typography: pick one display/heading font and one body font from Google Fonts that suit the brand's tone, define a clear type scale (hero, h2, h3, body, small) with consistent spacing — no default browser font sizes.
- Color: derive a small, cohesive palette (1 primary, 1 accent, neutrals) from what the user describes; ensure text-on-background contrast is comfortably readable (treat WCAG AA as a floor).
- Layout: mobile-first responsive with real breakpoints (CSS Grid/Flexbox), generous whitespace, consistent border-radius and shadow language throughout — not a mix of styles.
- Motion: subtle only — hover states, a fade/slide-in on scroll via IntersectionObserver if it fits, nothing gimmicky or distracting.
- Images: no image generation available, so use tasteful CSS (gradients, shapes, subtle patterns) or https://placehold.co placeholders sized appropriately, captioned so the owner knows what photo to swap in.
- Always include: a <title> and <meta name="description"> written specifically for this business (never generic), <meta name="viewport" content="width=device-width, initial-scale=1">, and a real footer with the business name and year.
- If any contact info (phone/WhatsApp) is mentioned or implied, add a clear WhatsApp link using https://wa.me/<digits-only-with-country-code> as a real call-to-action button, not just plain text.
- Semantic HTML5 (header/nav/main/section/footer, not endless <div> soup). Keep total size under 200KB.
- If the user supplies existing site code, treat it as the current source of truth: apply their requested change precisely and return the FULL updated document, preserving everything they didn't ask you to change.

Return ONLY the raw HTML document. No explanations, no markdown code fences, no commentary before or after.`

async function generateSiteHtml(env, { prompt, currentHtml, history, demo }) {
  if (!env.GROQ_API_KEY) { const e = new Error('AI assistant is not configured yet.'); e.status = 503; throw e }

  const userMsg = currentHtml
    ? `Here is my current site code:\n\n${String(currentHtml).slice(0, 60000)}\n\nMy request: ${prompt}`
    : prompt
  const messages = [
    { role: 'system', content: SITE_SYSTEM_PROMPT },
    ...(!demo && Array.isArray(history) ? history.slice(-6).filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').map(m => ({ role: m.role, content: m.content.slice(0, 4000) })) : []),
    { role: 'user', content: userMsg },
  ]

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.GROQ_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages,
      max_completion_tokens: demo ? 6000 : 16000,
      temperature: 0.6,
      top_p: 0.95,
      reasoning_effort: 'medium',
      include_reasoning: false,
    }),
  })
  const data = await groqRes.json().catch(() => ({}))
  if (!groqRes.ok) { const e = new Error('The AI is busy right now — try again in a few seconds.'); e.status = 502; throw e }
  let html = data.choices?.[0]?.message?.content || ''
  const fence = html.match(/```(?:html)?\s*([\s\S]*?)```/)
  if (fence) html = fence[1]
  html = html.trim()
  const doctype = html.search(/<!doctype html>/i)
  if (doctype > 0) html = html.slice(doctype)
  if (!/<html[\s>]/i.test(html)) { const e = new Error('The AI returned something odd — try rephrasing your request.'); e.status = 502; throw e }
  return html
}

/* ─── API routes ──────────────────────────────────────────────────── */
async function handleApi(req, env, url) {
  const path = url.pathname.replace(/^\/api/, '')
  const method = req.method

  /* CORS preflight (dashboard is same-origin, but allow local dev) */
  if (method === 'OPTIONS') {
    return new Response(null, { headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, content-type',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    } })
  }
  const cors = { 'access-control-allow-origin': '*' }

  /* ── Public: showcase gallery ── */
  if (path === '/showcase' && method === 'GET') {
    const rows = await sb(env, 'showcase_sites?select=name,subdomain,created_at&limit=24')
    return j({ sites: rows, root: env.ROOT_DOMAIN }, 200, cors)
  }

  /* ── Public: current price (promo-aware) ── */
  if (path === '/pricing' && method === 'GET') {
    return j({ priceSen: currentPriceSen(env), promoUntil: PROMO_END.toISOString(), normalPriceSen: Number(env.PRICE_SEN || 30000) }, 200, cors)
  }

  /* ── Public: subdomain availability ── */
  if (path === '/check' && method === 'GET') {
    const sub = (url.searchParams.get('subdomain') || '').toLowerCase()
    if (!validSubdomain(sub)) return j({ available: false, reason: 'invalid' }, 200, cors)
    const [taken, reserved] = await Promise.all([
      sb(env, `sites?subdomain=eq.${encodeURIComponent(sub)}&select=id&limit=1`),
      sb(env, `reserved_subdomains?name=eq.${encodeURIComponent(sub)}&select=name&limit=1`),
    ])
    const available = taken.length === 0 && reserved.length === 0
    return j({ available, reason: available ? null : 'taken' }, 200, cors)
  }

  /* Public, no-signup AI demo — one-shot only (no history/currentHtml), IP-rate-limited */
  if (path === '/demo/generate' && method === 'POST') {
    const ip = req.headers.get('cf-connecting-ip') || 'unknown'
    const ipHash = await sha256Hex(ip)
    const dayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00Z'
    const used = await sb(env, `demo_generations?ip_hash=eq.${ipHash}&created_at=gte.${dayStart}&select=id`)
    const LIMIT = Number(env.DEMO_DAILY_LIMIT || 5)
    if (used.length >= LIMIT) return j({ error: `Free demo limit reached for today (${LIMIT} per visitor). Sign in to keep generating — 25/day, free.` }, 429, cors)

    const body = await req.json().catch(() => ({}))
    const prompt = String(body.prompt || '').trim().slice(0, 600)
    if (!prompt) return j({ error: 'Describe the site you want first.' }, 400, cors)

    let html
    try {
      html = await generateSiteHtml(env, { prompt, demo: true })
    } catch (e) { return j({ error: e.message }, e.status || 502, cors) }

    await sb(env, 'demo_generations', { method: 'POST', body: { ip_hash: ipHash } })
    return j({ html, remaining: LIMIT - used.length - 1 }, 200, cors)
  }

  /* Public: contact form (custom website / custom domain enquiries, general contact) */
  if (path === '/contact' && method === 'POST') {
    const body = await req.json().catch(() => ({}))
    const name = String(body.name || '').trim().slice(0, 120)
    const email = String(body.email || '').trim().slice(0, 200)
    const message = String(body.message || '').trim().slice(0, 4000)
    if (!name || !email || !message) return j({ error: 'Name, email and message are all required.' }, 400, cors)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return j({ error: 'That email address doesn\u2019t look right.' }, 400, cors)
    await sb(env, 'contact_messages', {
      method: 'POST',
      body: { name, email, message, interest: (body.interest === 'custom_domain' ? 'custom_domain' : 'general') },
    })
    return j({ ok: true }, 200, cors)
  }

  /* ── Everything below requires a signed-in user ── */
  const user = await getUser(env, req)
  if (!user) return j({ error: 'unauthorized' }, 401, cors)

  /* List my sites */
  if (path === '/sites' && method === 'GET') {
    const rows = await sb(env, `sites?user_id=eq.${user.id}&select=id,name,subdomain,custom_domain,status,showcase,expires_at,created_at&order=created_at.desc`)
    return j({ sites: rows, root: env.ROOT_DOMAIN, admin: isAdmin(env, user), payEmail: env.PAY_EMAIL || null, priceSen: currentPriceSen(env), promoUntil: PROMO_END.toISOString(), normalPriceSen: Number(env.PRICE_SEN || 30000) }, 200, cors)
  }

  /* Create a site (draft until paid) */
  if (path === '/sites' && method === 'POST') {
    const body = await req.json().catch(() => ({}))
    const { name, subdomain, html } = body
    if (!name || typeof name !== 'string' || name.length > 80) return j({ error: 'Name is required (max 80 chars).' }, 400, cors)
    if (!validSubdomain((subdomain || '').toLowerCase())) return j({ error: 'Subdomain must be lowercase letters, numbers and hyphens.' }, 400, cors)
    if (typeof html !== 'string' || html.length < 20) return j({ error: 'Paste your site\u2019s HTML first.' }, 400, cors)
    if (html.length > MAX_HTML) return j({ error: 'Site is over the 1.5 MB limit. Host large images on a CDN and link them instead.' }, 400, cors)
    const reserved = await sb(env, `reserved_subdomains?name=eq.${subdomain.toLowerCase()}&select=name&limit=1`)
    if (reserved.length) return j({ error: 'That subdomain is reserved.' }, 409, cors)
    const mine = await sb(env, `sites?user_id=eq.${user.id}&select=id,status`)
    if (mine.length >= 20) return j({ error: 'Account limit reached (20 sites). Email us if you need more.' }, 429, cors)
    if (mine.filter(x => x.status === 'draft').length >= 3) return j({ error: 'You have 3 unpaid drafts already — activate or delete one first.' }, 429, cors)
    try {
      const rows = await sb(env, 'sites', {
        method: 'POST',
        body: { user_id: user.id, name, subdomain: subdomain.toLowerCase(), html, status: 'draft' },
      })
      return j({ site: rows[0] }, 201, cors)
    } catch (e) {
      if (String(e).includes('duplicate')) return j({ error: 'That subdomain is taken.' }, 409, cors)
      throw e
    }
  }

  /* Update code / name / showcase toggle */
  if (path.match(/^\/sites\/[0-9a-f-]{36}$/) && method === 'PATCH') {
    const id = path.split('/')[2]
    const body = await req.json().catch(() => ({}))
    const patch = {}
    if (typeof body.html === 'string') {
      if (body.html.length > MAX_HTML) return j({ error: 'Site is over the 1.5 MB limit.' }, 400, cors)
      patch.html = body.html
    }
    if (typeof body.name === 'string' && body.name.length <= 80) patch.name = body.name
    if (typeof body.showcase === 'boolean') patch.showcase = body.showcase
    if (!Object.keys(patch).length) return j({ error: 'Nothing to update.' }, 400, cors)
    const rows = await sb(env, `sites?id=eq.${id}&user_id=eq.${user.id}`, { method: 'PATCH', body: patch })
    if (!rows.length) return j({ error: 'Site not found.' }, 404, cors)
    if (patch.html) {
      const host = `${rows[0].subdomain}.${env.ROOT_DOMAIN}`
      await caches.default.delete(new Request(`https://${host}/`, { method: 'GET' })).catch(() => {})
    }
    return j({ site: rows[0] }, 200, cors)
  }

  /* Delete a site */
  if (path.match(/^\/sites\/[0-9a-f-]{36}$/) && method === 'DELETE') {
    const id = path.split('/')[2]
    await sb(env, `sites?id=eq.${id}&user_id=eq.${user.id}`, { method: 'DELETE' })
    return j({ ok: true }, 200, cors)
  }

  /* AI website generator — Groq-powered, 25 generations/user/day */
  if (path === '/ai/generate' && method === 'POST') {
    const body = await req.json().catch(() => ({}))
    const prompt = String(body.prompt || '').trim().slice(0, 2000)
    if (!prompt) return j({ error: 'Describe the site you want first.' }, 400, cors)
    const siteId = typeof body.site_id === 'string' ? body.site_id : null

    const dayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00Z'
    const used = await sb(env, `ai_generations?user_id=eq.${user.id}&created_at=gte.${dayStart}&select=id`)
    const LIMIT = Number(env.AI_DAILY_LIMIT || 25)
    if (used.length >= LIMIT) return j({ error: `Daily AI limit reached (${LIMIT}). Resets at midnight UTC — or paste code from any AI chat.` }, 429, cors)

    // If a site_id is given, load its persisted chat history (draft sites belong to a
    // real site row created before the first generation, so this works for both flows).
    let history = body.history
    if (siteId) {
      const owned = await sb(env, `sites?id=eq.${siteId}&user_id=eq.${user.id}&select=id&limit=1`)
      if (!owned.length) return j({ error: 'Site not found.' }, 404, cors)
      const rows = await sb(env, `site_messages?site_id=eq.${siteId}&select=role,content&order=created_at.asc&limit=40`)
      history = rows
    }

    let html
    try {
      html = await generateSiteHtml(env, { prompt, currentHtml: body.currentHtml, history })
    } catch (e) { return j({ error: e.message }, e.status || 502, cors) }

    await sb(env, 'ai_generations', { method: 'POST', body: { user_id: user.id } })

    if (siteId) {
      await sb(env, 'site_messages', {
        method: 'POST',
        body: [
          { site_id: siteId, role: 'user', content: prompt },
          { site_id: siteId, role: 'assistant', content: 'Generated an updated version of the site.' },
        ],
      })
    }

    return j({ html, remaining: LIMIT - used.length - 1 }, 200, cors)
  }

  /* Chat history for a site's AI builder thread */
  if (path.match(/^\/sites\/[0-9a-f-]{36}\/messages$/) && method === 'GET') {
    const id = path.split('/')[2]
    const owned = await sb(env, `sites?id=eq.${id}&user_id=eq.${user.id}&select=id&limit=1`)
    if (!owned.length) return j({ error: 'Site not found.' }, 404, cors)
    const rows = await sb(env, `site_messages?site_id=eq.${id}&select=role,content,created_at&order=created_at.asc&limit=200`)
    return j({ messages: rows }, 200, cors)
  }


  /* Request a QR payment for a site (first payment or renewal).
     Reuses an existing pending reference so users don't get duplicates. */
  if (path === '/billing/create' && method === 'POST') {
    const body = await req.json().catch(() => ({}))
    const sites = await sb(env, `sites?id=eq.${body.site_id}&user_id=eq.${user.id}&select=id,name,subdomain&limit=1`)
    const site = sites[0]
    if (!site) return j({ error: 'Site not found.' }, 404, cors)
    const pending = await sb(env, `payments?site_id=eq.${site.id}&status=eq.pending&select=id,reference,amount_sen&order=created_at.desc&limit=1`)
    let payment = pending[0]
    if (!payment) {
      const rows = await sb(env, 'payments', {
        method: 'POST',
        body: { user_id: user.id, site_id: site.id, reference: makeReference(site.subdomain), amount_sen: currentPriceSen(env), status: 'pending' },
      })
      payment = rows[0]
    }
    return j({
      reference: payment.reference,
      amount_sen: payment.amount_sen,
      pay_email: env.PAY_EMAIL || 'yashchaal99@gmail.com',
      site: { name: site.name, subdomain: site.subdomain },
    }, 200, cors)
  }

  /* ── Admin: pending payments queue ── */
  if (path === '/admin/payments' && method === 'GET') {
    if (!isAdmin(env, user)) return j({ error: 'forbidden' }, 403, cors)
    const rows = await sb(env, `payments?status=eq.pending&select=id,reference,amount_sen,created_at,site_id,sites(name,subdomain,status,expires_at),profiles(email,full_name)&order=created_at.asc`)
    return j({ payments: rows }, 200, cors)
  }

  /* ── Admin: approve / reject a payment ── */
  if (path.match(/^\/admin\/payments\/[0-9a-f-]{36}\/(approve|reject)$/) && method === 'POST') {
    if (!isAdmin(env, user)) return j({ error: 'forbidden' }, 403, cors)
    const [, , , id, action] = path.split('/')
    const rows = await sb(env, `payments?id=eq.${id}&select=id,site_id,status&limit=1`)
    const payment = rows[0]
    if (!payment) return j({ error: 'Payment not found.' }, 404, cors)
    if (payment.status !== 'pending') return j({ error: 'Already processed.' }, 409, cors)
    if (action === 'approve') await activatePayment(env, payment)
    else await sb(env, `payments?id=eq.${id}`, { method: 'PATCH', body: { status: 'rejected' } })
    return j({ ok: true }, 200, cors)
  }

  /* ── Admin: leads list ── */
  if (path === '/admin/leads' && method === 'GET') {
    if (!isAdmin(env, user)) return j({ error: 'forbidden' }, 403, cors)
    const rows = await sb(env, `leads?select=*&order=created_at.desc`)
    return j({ leads: rows }, 200, cors)
  }

  /* ── Admin: update a lead (status/notes) ── */
  if (path.match(/^\/admin\/leads\/[0-9a-f-]{36}$/) && method === 'PATCH') {
    if (!isAdmin(env, user)) return j({ error: 'forbidden' }, 403, cors)
    const id = path.split('/')[3]
    const body = await req.json().catch(() => ({}))
    const allowed = ['status', 'notes']
    const patch = {}
    for (const k of allowed) if (k in body) patch[k] = body[k]
    if (Object.keys(patch).length === 0) return j({ error: 'Nothing to update.' }, 400, cors)
    patch.updated_at = new Date().toISOString()
    const rows = await sb(env, `leads?id=eq.${id}`, { method: 'PATCH', body: patch })
    if (!rows[0]) return j({ error: 'Lead not found.' }, 404, cors)
    return j({ lead: rows[0] }, 200, cors)
  }

  /* ── Admin: add leads manually (used when seeding / after a manual Maps search) ── */
  if (path === '/admin/leads' && method === 'POST') {
    if (!isAdmin(env, user)) return j({ error: 'forbidden' }, 403, cors)
    const body = await req.json().catch(() => ({}))
    const items = Array.isArray(body.leads) ? body.leads : [body]
    if (!items.length) return j({ error: 'No leads provided.' }, 400, cors)
    const rows = await sb(env, `leads`, { method: 'POST', body: items })
    return j({ leads: rows }, 200, cors)
  }

  /* ── Admin: lead search requests — queue a "find more leads" ask ── */
  if (path === '/admin/lead-search-requests' && method === 'GET') {
    if (!isAdmin(env, user)) return j({ error: 'forbidden' }, 403, cors)
    const rows = await sb(env, `lead_search_requests?select=*&order=created_at.desc`)
    return j({ requests: rows }, 200, cors)
  }

  if (path === '/admin/lead-search-requests' && method === 'POST') {
    if (!isAdmin(env, user)) return j({ error: 'forbidden' }, 403, cors)
    const body = await req.json().catch(() => ({}))
    const category = (body.category || '').trim()
    const city = (body.city || '').trim()
    if (!category || !city) return j({ error: 'Category and city are required.' }, 400, cors)
    const rows = await sb(env, `lead_search_requests`, {
      method: 'POST',
      body: { category, city, notes: (body.notes || '').trim() || null, requested_by: user.email },
    })
    return j({ request: rows[0] }, 200, cors)
  }

  if (path.match(/^\/admin\/lead-search-requests\/[0-9a-f-]{36}\/dismiss$/) && method === 'POST') {
    if (!isAdmin(env, user)) return j({ error: 'forbidden' }, 403, cors)
    const id = path.split('/')[3]
    const rows = await sb(env, `lead_search_requests?id=eq.${id}`, {
      method: 'PATCH',
      body: { status: 'dismissed', fulfilled_at: new Date().toISOString() },
    })
    if (!rows[0]) return j({ error: 'Request not found.' }, 404, cors)
    return j({ request: rows[0] }, 200, cors)
  }

    return j({ error: 'not found' }, 404, cors)
}

/* ─── Entry ───────────────────────────────────────────────────────── */
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url)
    const host = url.hostname.toLowerCase()

    // Dashboard host: API runs in the worker, everything else falls
    // through to static assets (configured via run_worker_first).
    if (host === env.APP_HOST || host === 'localhost' || host.endsWith('.workers.dev')) {
      if (url.pathname.startsWith('/api/')) {
        try { return await handleApi(req, env, url) }
        catch (e) { return j({ error: 'Something went wrong on our side. Try again.', detail: String(e).slice(0, 200) }, 500) }
      }
      return env.ASSETS.fetch(req) // SPA assets (with SPA fallback)
    }

    // Any other hostname = a hosted site.
    const cache = caches.default
    const cacheKey = new Request(`https://${host}/`, { method: 'GET' })
    if (req.method === 'GET') {
      const hit = await cache.match(cacheKey)
      if (hit) return hit
    }
    let res
    try { res = await serveSite(env, host) }
    catch {
      res = new Response(
        HOLDING_PAGE('Brief cosmic turbulence', 'We hit a temporary error serving this site. Refresh in a moment — it usually clears right up.', env.APP_HOST),
        { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'retry-after': '10', 'x-robots-tag': 'noindex' } })
    }
    if (req.method === 'GET' && res.status === 200) ctx.waitUntil(cache.put(cacheKey, res.clone()))
    return res
  },

  /* Daily cron (see [triggers] in wrangler.toml) — expiry reminder emails. */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendExpiryReminders(env).catch(() => {}))
  },
}
