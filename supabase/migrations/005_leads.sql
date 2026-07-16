-- HarNova Build — client lead-finder (run once in SQL editor)
--
-- `leads` holds businesses found (via manual Google Maps research) that look
-- like good candidates for a HarNova Build site (no website listed), plus a
-- drafted outreach message per lead. `lead_search_requests` lets the admin
-- panel queue a "find more leads" request (category + city) — there's no
-- public Places API wired up, so a request just gets picked up and fulfilled
-- manually, then the results are added to `leads`.

create table if not exists public.leads (
  id           uuid default gen_random_uuid() primary key,
  business_name text not null,
  category     text,
  city         text,
  rating       numeric,
  reviews      integer,
  phone        text,
  address      text,
  web_presence text,
  source       text,
  outreach_draft text,
  status       text not null default 'not_contacted'
               check (status in ('not_contacted','contacted','interested','declined','converted')),
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_created_idx on public.leads (created_at desc);
alter table public.leads enable row level security;

-- No direct client access — the Worker (service role) reads/writes on behalf
-- of the admin user after checking ADMIN_EMAILS. RLS stays on as a backstop.
drop policy if exists "leads_no_direct_access" on public.leads;
create policy "leads_no_direct_access" on public.leads
  for all using (false);

create table if not exists public.lead_search_requests (
  id           uuid default gen_random_uuid() primary key,
  category     text not null,
  city         text not null,
  notes        text,
  status       text not null default 'pending'
               check (status in ('pending','done','dismissed')),
  requested_by text,
  created_at   timestamptz default now(),
  fulfilled_at timestamptz
);
create index if not exists lead_search_requests_status_idx on public.lead_search_requests (status);
alter table public.lead_search_requests enable row level security;

drop policy if exists "lead_search_requests_no_direct_access" on public.lead_search_requests;
create policy "lead_search_requests_no_direct_access" on public.lead_search_requests
  for all using (false);
