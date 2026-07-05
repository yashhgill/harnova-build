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

## Production status

**Live.** Worker `harnova-build` deployed on zone `harnova.my`; Supabase project `fxlmdbouctcfxqewvcst` with schema applied, Google auth enabled; smoke-tested end-to-end (QR → reference → admin approve → live site).

Two config rules that MUST NOT regress (both already correct in `worker/wrangler.toml`):
1. `routes = [...]` stays at **top level**, above any `[table]` header — under `[vars]` it silently becomes an env var and no routes attach.
2. `run_worker_first = true` (not a path list) — otherwise the SPA's `index.html` hijacks every hostname including hosted `*.harnova.my` sites before the Worker's hostname routing runs.

Open item: Google OAuth consent screen is in **Testing** mode — publish it (Google Cloud Console → OAuth consent screen → Publish app) before real customers sign in. Email/profile scopes don't need Google review.

## Setup (one time)

### 1. Supabase
1. New project → SQL editor → run `supabase/schema.sql`.
2. Auth → Providers → enable **Google** (Google Cloud OAuth client, redirect `https://<ref>.supabase.co/auth/v1/callback`).
3. Auth → URL configuration → Site URL `https://build.harnova.my`, add `https://build.harnova.my/app` to redirect list.
4. Copy Project URL, `anon` key, `service_role` key.

### 2. Payments (DuitNow QR — no gateway, no SSM needed)
1. Export your DuitNow QR from your banking app and save it as `web/public/qr.png` (square PNG works best).
2. In `worker/wrangler.toml` set `ADMIN_EMAILS` (your Google login email) and `PAY_EMAIL` (where receipts go).
3. That's it — no API keys. You verify transfers in your banking app and approve them in the dashboard.

### 3. Worker + DNS
```
cd web && npm install && cp .env.example .env   # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run build
cd ../worker && npm install
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
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

## Payment flow (manual QR)

1. User clicks **Pay RM10 · go live** → `POST /api/billing/create` mints a unique reference like `HB-NASI-7K2F` (reused if one is already pending, so no duplicates) and shows the QR modal: your DuitNow QR, the reference to put in transfer notes, and a pre-filled receipt email.
2. User pays the QR and emails the receipt with the reference.
3. You check your banking app, open the dashboard — the **Payment queue** (visible only to `ADMIN_EMAILS`) lists pending references with site + payer info. Click **Approve**.
4. Approval marks the payment paid, sets the site `status=live`, and stacks `expires_at` +30 days. Reject handles typos/no-shows.

Renewals are the same flow — days stack on top of the current expiry. When you get your SSM later, the gateway slots back in behind the same `payments` table.

## Custom domains (v1)

`sites.custom_domain` is already served by the Worker. To connect one today:
1. Customer buys domain (or you register for them — upsell).
2. Cloudflare → harnova.my zone → **SSL/TLS → Custom Hostnames** (Cloudflare for SaaS, free tier = 100 hostnames): add their domain.
3. Customer sets CNAME → `build.harnova.my` (or the fallback origin you configure).
4. Set `custom_domain` on their site row.

## Business notes

- QR transfers are free → RM10 stays RM10. When volume makes manual approval painful, register SSM and swap in a gateway behind the same `payments` table.
- Expired sites aren't deleted — they show a renewal holding page, and one payment revives them. Lapsed users are your cheapest reactivation channel.
- Showcase is opt-in (`sites.showcase`), surfaced on the landing page as scaled live iframe previews — social proof straight from production.
- Abuse guardrails: 1.5 MB HTML cap, reserved subdomains, 20 sites + 3 unpaid drafts per account, plain-language Terms with acceptable-use at `/terms`, `nosniff` + `noindex` headers on holding pages, branded 503 on serving errors, edge-cache purge on code edits. Takedown = flip the site to `expired` in Supabase (instant, reversible).
