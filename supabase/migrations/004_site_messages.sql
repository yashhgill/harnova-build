-- HarNova Build — persisted AI builder chat history per site (run once in SQL editor)

create table if not exists public.site_messages (
  id         uuid default gen_random_uuid() primary key,
  site_id    uuid not null references public.sites(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz default now()
);
create index if not exists site_messages_site_idx on public.site_messages (site_id, created_at);
alter table public.site_messages enable row level security;

-- Users can read/insert messages for sites they own; the Worker still uses the
-- service role for writes, but these policies let direct client reads work too
-- if ever needed (e.g. a future realtime subscription).
drop policy if exists "site_messages_select_own" on public.site_messages;
create policy "site_messages_select_own" on public.site_messages
  for select using (
    exists (select 1 from public.sites s where s.id = site_messages.site_id and s.user_id = auth.uid())
  );
