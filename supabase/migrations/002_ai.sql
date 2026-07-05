-- HarNova Build — AI generation usage tracking (run once in SQL editor)
create table if not exists public.ai_generations (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);
create index if not exists ai_gen_user_day_idx on public.ai_generations (user_id, created_at);
alter table public.ai_generations enable row level security;
create policy "own ai usage" on public.ai_generations for select using (auth.uid() = user_id);
-- inserts happen via the Worker (service role)
