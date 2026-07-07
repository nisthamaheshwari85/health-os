-- Health OS — MVP schema
-- Run this in the Supabase SQL editor (or `supabase db push` if using the CLI).
-- Every table has Row-Level Security enabled: a user can only touch their own rows.

-- ────────────────────────────────────────────────────────────
-- Profiles (static facts about the user — the "AI Health Twin" shell)
-- ────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  goal text,                      -- e.g. 'lose_weight', 'build_strength', 'improve_sleep'
  constraints text[],             -- e.g. injuries, dietary restrictions
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: read own" on profiles
  for select using (auth.uid() = id);
create policy "profiles: insert own" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- Health metrics (the live state the Health Twin reads)
-- One row per metric per day; `source` tracks manual vs wearable vs derived.
-- ────────────────────────────────────────────────────────────
create table if not exists health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_date date not null default current_date,
  sleep_hours numeric,
  activity_minutes numeric,
  mood_score smallint check (mood_score between 1 and 10),
  stress_score smallint check (stress_score between 1 and 10),
  source text not null default 'manual',   -- 'manual' | 'wearable' | 'derived'
  created_at timestamptz not null default now(),
  unique (user_id, metric_date, source)
);

alter table health_metrics enable row level security;

create policy "health_metrics: crud own" on health_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- Meals (nutrition logging)
-- ────────────────────────────────────────────────────────────
create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  logged_at timestamptz not null default now()
);

alter table meals enable row level security;

create policy "meals: crud own" on meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- Chat messages (AI Coach history)
-- ────────────────────────────────────────────────────────────
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table chat_messages enable row level security;

create policy "chat_messages: crud own" on chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- Streaks + XP (gamification data model — UI arrives in V2)
-- ────────────────────────────────────────────────────────────
create table if not exists streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date
);

alter table streaks enable row level security;

create policy "streaks: crud own" on streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount int not null,
  reason text not null,           -- e.g. 'logged_meal', 'completed_workout', 'daily_streak'
  created_at timestamptz not null default now()
);

alter table xp_events enable row level security;

create policy "xp_events: crud own" on xp_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- Helper: auto-create a profile row when a new user signs up
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

