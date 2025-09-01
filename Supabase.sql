create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text,
  description text,
  story text,
  animation jsonb,
  created_at timestamptz default now()
);

alter table public.movies enable row level security;

create policy "Public read access" on public.movies
  for select using (true);

create policy "Users can insert their own movies" on public.movies
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own movies" on public.movies
  for update using (auth.uid() = user_id);

create policy "Users can delete their own movies" on public.movies
  for delete using (auth.uid() = user_id);

-- Migration: ensure description column exists and backfill
alter table public.movies
  add column if not exists description text;

update public.movies set description = coalesce(description, '');
