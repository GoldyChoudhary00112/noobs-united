-- 1. USERS TABLE (custom auth — no Supabase Auth needed)
create table if not exists public.users (
  id         uuid default gen_random_uuid() primary key,
  username   text unique not null,
  password   text not null,
  name       text not null,
  created_at timestamptz default now()
);

-- 2. DAILY VOTES TABLE
create table if not exists public.daily_votes (
  id         uuid default gen_random_uuid() primary key,
  date       date not null default current_date,
  username   text not null references public.users(username) on delete cascade,
  available  boolean default false,
  location   text,
  time_slot  text,
  game       text,
  snack      text,
  reactions  text[] default '{}',
  updated_at timestamptz default now(),
  constraint daily_votes_date_username_key unique (date, username)
);

-- 3. ROW LEVEL SECURITY (permissive — friends-only app)
alter table public.users       enable row level security;
alter table public.daily_votes enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public read users"       on public.users;
drop policy if exists "Public insert users"     on public.users;
drop policy if exists "Public read votes"       on public.daily_votes;
drop policy if exists "Public insert votes"     on public.daily_votes;
drop policy if exists "Public update votes"     on public.daily_votes;

-- Allow anyone with anon key to read + write (invite-only via URL sharing)
create policy "Public read users"   on public.users for select using (true);
create policy "Public insert users" on public.users for insert with check (true);

create policy "Public read votes"   on public.daily_votes for select using (true);
create policy "Public insert votes" on public.daily_votes for insert with check (true);
create policy "Public update votes" on public.daily_votes for update using (true) with check (true);

-- 4. REAL-TIME (enable for live updates across devices)
alter publication supabase_realtime add table public.daily_votes;
alter publication supabase_realtime add table public.users;

