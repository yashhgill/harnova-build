-- HarNova Build — contact form + public demo rate-limiting (run once in SQL editor)

-- CONTACT MESSAGES — submissions from the public /contact page.
-- Inserts happen via the Worker (service role) from an unauthenticated visitor,
-- so RLS stays fully locked (no public policies) and only the service role can touch it.
create table if not exists public.contact_messages (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  email      text not null,
  message    text not null,
  interest   text not null default 'general' check (interest in ('general','custom_domain')),
  status     text not null default 'new' check (status in ('new','read','replied')),
  created_at timestamptz default now()
);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
alter table public.contact_messages enable row level security;
-- No select/insert policies for anon/authenticated — the Worker uses the service role key,
-- which bypasses RLS. View these in the Supabase Table Editor or SQL editor.

-- DEMO GENERATIONS — rate-limit tracking for the no-signup AI trial on /demo.
-- Only an IP hash is stored (never the raw IP), purely to cap free generations per day.
create table if not exists public.demo_generations (
  id         uuid default gen_random_uuid() primary key,
  ip_hash    text not null,
  created_at timestamptz default now()
);
create index if not exists demo_gen_ip_day_idx on public.demo_generations (ip_hash, created_at);
alter table public.demo_generations enable row level security;
-- No public policies — inserts/reads happen via the Worker (service role) only.
