# HarNova Build ✦

Paste your AI-generated website. Pay RM10. It's live on `yourname.harnova.my` with SSL — in seconds.

## How it works

A **deploy is just a database row.** One Cloudflare Worker owns `*.harnova.my`:

```
build.harnova.my          → React dashboard (static assets in this Worker)
build.harnova.my/api/*    → JSON API (Supabase auth, sites, Billplz)
anything.harnova.my       → looks up `sites.subdomain` in Supabase, serves the HTML (edge-cached 60s)
customer-domain.com       → same lookup via `sites.custom_domain`
```

No per-site infrastructure. No build step. Marginal cost per site ≈ RM0.

## Repo layout

```
supabase/schema.sql   → run once in Supabase SQL editor
worker/               → the Cloudflare Worker (API + site serving + assets)
web/                  → Vite/React dashboard (landing, showcase, my-sites, editor)
```

## Setup (one time)

### 1. Supabase
1. New project → SQL editor → run `supabase/schema.sql`.
2. Auth → Providers → enable **Google** (Google Cloud OAuth client, redirect `https://<ref>.supabase.co/auth/v1/callback`).
3. Auth → URL configuration → Site URL `https://build.harnova.my`, add `https://build.harnova.my/app` to redirect list.
4. Copy Project URL, `anon` key, `service_role` key.

### 2. Billplz
1. Create a **Collection** (name it "HarNova Build"), note the Collection ID.
2. Settings → copy **API Secret Key** and **X Signature Key**.
3. Test first on sandbox (`billplz-sandbox.com`) — set `BILLPLZ_BASE` in `wrangler.toml` accordingly, and use sandbox keys.

### 3. Worker + DNS
```
cd web && npm install && cp .env.example .env   # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run build
cd ../worker && npm install
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put BILLPLZ_KEY
npx wrangler secret put BILLPLZ_XSIGNATURE
npx wrangler secret put BILLPLZ_COLLECTION
npx wrangler deploy
```
In the Cloudflare dashboard (harnova.my zone):
- DNS: `build` → AAAA `100::` (proxied) and `*` → AAAA `100::` (proxied). The Worker routes intercept both.
- The routes in `wrangler.toml` (`build.harnova.my/*` and `*.harnova.my/*`) attach on deploy.
- **Note:** if `harnova.my` root or other subdomains (e.g. the studio site on Pages) must NOT hit this worker, they're fine — Pages custom domains take precedence, and the apex isn't matched by `*.harnova.my`.

### 4. Local dev
```
cd worker && npx wrangler dev          # API on :8787
cd web && npm run dev                  # Vite on :5173, /api proxied to :8787
```

## Payment flow (Billplz)

1. `POST /api/billing/create { site_id }` → Worker creates a Billplz bill (RM10, FPX/card), stores a pending `payments` row, returns the bill URL.
2. User pays on Billplz.
3. Billplz **callback** (server→server) hits `/api/billing/callback`; Worker verifies `x_signature` (HMAC-SHA256), marks payment paid, sets site `status=live` and stacks `expires_at` +30 days.
4. Billplz **redirect** sends the user to `/pay/done` for the success/failure screen. Activation never depends on the redirect.

Renewals are the same call on an existing site — days stack on top of the current expiry.

## Custom domains (v1)

`sites.custom_domain` is already served by the Worker. To connect one today:
1. Customer buys domain (or you register for them — upsell).
2. Cloudflare → harnova.my zone → **SSL/TLS → Custom Hostnames** (Cloudflare for SaaS, free tier = 100 hostnames): add their domain.
3. Customer sets CNAME → `build.harnova.my` (or the fallback origin you configure).
4. Set `custom_domain` on their site row.

## Business notes

- Billplz FPX ≈ RM1 flat per transaction → ~RM9 gross margin per RM10 renewal.
- Expired sites aren't deleted — they show a renewal holding page, and one payment revives them. Lapsed users are your cheapest reactivation channel.
- Showcase is opt-in (`sites.showcase`), surfaced on the landing page as scaled live iframe previews — social proof straight from production.
- Abuse guardrails in v1: 1.5 MB HTML cap, reserved subdomain list, content served under *their* subdomain only. Add a takedown flag column when volume grows.
