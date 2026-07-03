-- ============================================================
-- HarNova Build — Supabase schema
-- Run in Supabase SQL Editor. Enable Google provider in Auth.
-- ============================================================

-- PROFILES (auto-created on signup)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- SITES — one row per hosted site. A "deploy" is just this row.
create table if not exists public.sites (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references public.profiles(id) on delete cascade not null,
  name           text not null,
  subdomain      text unique not null
                   check (subdomain ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$'),
  custom_domain  text unique,
  html           text not null default '',
  status         text not null default 'draft'
                   check (status in ('draft','live','expired')),
  showcase       boolean not null default false,
  expires_at     timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists sites_subdomain_idx on public.sites (subdomain);
create index if not exists sites_custom_domain_idx on public.sites (custom_domain);
create index if not exists sites_user_idx on public.sites (user_id);

-- PAYMENTS — one row per QR payment request (manual verification)
create table if not exists public.payments (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  site_id      uuid references public.sites(id) on delete cascade not null,
  reference    text unique not null,          -- e.g. HB-NASI-7K2F, user puts this in transfer notes
  amount_sen   integer not null default 1000,
  status       text not null default 'pending'
                 check (status in ('pending','paid','rejected')),
  paid_at      timestamptz,
  created_at   timestamptz default now()
);
create index if not exists payments_reference_idx on public.payments (reference);

-- RESERVED SUBDOMAINS
create table if not exists public.reserved_subdomains (name text primary key);
insert into public.reserved_subdomains (name) values
  ('www'),('api'),('build'),('app'),('mail'),('admin'),('dashboard'),
  ('harnova'),('status'),('docs'),('blog'),('cdn'),('assets'),('shop')
on conflict do nothing;

-- AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- KEEP updated_at FRESH
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists sites_touch on public.sites;
create trigger sites_touch before update on public.sites
  for each row execute function public.touch_updated_at();

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.sites    enable row level security;
alter table public.payments enable row level security;

create policy "own profile"  on public.profiles for select using (auth.uid() = id);
create policy "sites select" on public.sites    for select using (auth.uid() = user_id);
create policy "sites insert" on public.sites    for insert with check (auth.uid() = user_id);
create policy "sites update" on public.sites    for update using (auth.uid() = user_id);
create policy "sites delete" on public.sites    for delete using (auth.uid() = user_id);
create policy "payments select" on public.payments for select using (auth.uid() = user_id);
-- Payment inserts + approvals and status/expiry flips happen via the Worker (service role).
-- Approvals are admin-only (ADMIN_EMAILS in the Worker) — you scan your bank app, click Approve, site goes live.

-- PUBLIC SHOWCASE VIEW (safe columns only)
create or replace view public.showcase_sites as
  select name, subdomain, created_at
  from public.sites
  where showcase = true and status = 'live'
    and (expires_at is null or expires_at > now())
  order by created_at desc;
grant select on public.showcase_sites to anon, authenticated;
