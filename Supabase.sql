create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  channel_id uuid references public.channels(id),
  title text,
  description text,
  story text,
  emoji_font text,
  animation jsonb,
  publish_datetime timestamptz,
  created_at timestamptz default now()
);

alter table public.movies enable row level security;

create policy "Public read access" on public.movies
  for select using (true);

create policy "Users can insert their own movies" on public.movies
  for insert with check (
    exists (
      select 1 from public.channels
      where channels.id = movies.channel_id
        and channels.user_id = auth.uid()
    )
  );

create policy "Users can update their own movies" on public.movies
  for update using (
    exists (
      select 1 from public.channels
      where channels.id = movies.channel_id
        and channels.user_id = auth.uid()
    )
  );

create policy "Users can delete their own movies" on public.movies
  for delete using (
    exists (
      select 1 from public.channels
      where channels.id = movies.channel_id
        and channels.user_id = auth.uid()
    )
  );

-- Migration: ensure description column exists and backfill
alter table public.movies
  add column if not exists description text;

update public.movies set description = coalesce(description, '');

alter table public.movies
  add column if not exists publish_datetime timestamptz;

alter table public.movies
  add column if not exists channel_id uuid references public.channels(id);

alter table public.movies
  add column if not exists emoji_font text;

update public.movies
set channel_id = channels.id
from public.channels
where public.movies.channel_id is null
  and public.movies.user_id = channels.user_id;

alter table public.movies
  alter column channel_id set not null;

-- Likes table for tracking movie likes
create table if not exists public.likes (
  movie_id uuid references public.movies(id) on delete cascade,
  user_id uuid references auth.users(id),
  created_at timestamptz default now(),
  primary key (movie_id, user_id)
);

alter table public.likes enable row level security;

create policy "Public read access" on public.likes
  for select using (true);

create policy "Users can insert their own likes" on public.likes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own likes" on public.likes
  for delete using (auth.uid() = user_id);

-- Comments table for movie comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid references public.movies(id) on delete cascade,
  user_id uuid references auth.users(id),
  content text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Public read access" on public.comments
  for select using (true);

create policy "Users can insert their own comments" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = user_id);

create policy "Movie owners can delete comments" on public.comments
  for delete using (
    exists (
      select 1
      from public.movies
      join public.channels on channels.id = movies.channel_id
      where movies.id = comments.movie_id
        and channels.user_id = auth.uid()
    )
  );

-- Channels table for user profiles
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id),
  name text unique not null,
  description text default '',
  picture_url text,
  created_at timestamptz default now()
);

alter table public.channels enable row level security;

create policy "Public read access" on public.channels
  for select using (true);

create policy "Users can insert their own channels" on public.channels
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own channels" on public.channels
  for update using (auth.uid() = user_id);

create policy "Users can delete their own channels" on public.channels
  for delete using (auth.uid() = user_id);

-- Storage bucket for channel pictures
insert into storage.buckets (id, name, public)
  values ('channel-pictures', 'channel-pictures', true)
  on conflict (id) do nothing;

-- Profiles table for user accounts
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id),
  display_name text,
  avatar_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = user_id);

