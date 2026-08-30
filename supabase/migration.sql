-- ══════════════════════════════════════════════════════════════
-- LANDASAN TEORI — Database Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ══════════════════════════════════════════════════════════════

-- 1. Profiles table (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  nama text,
  nis text,
  kelas text,
  onboarded boolean not null default false,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 2. Generations table
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  laboratorium text not null,
  judul_analisis text not null,
  kata_kunci text,
  kedalaman text not null check (kedalaman in ('singkat', 'menengah', 'mendalam')),
  landasan_teori text,
  daftar_pustaka jsonb default '[]'::jsonb,
  jumlah_jurnal int default 0,
  word_count int default 0,
  model_used text,
  duration_ms int,
  status text not null default 'pending' check (status in ('pending', 'success', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.generations enable row level security;

create policy "Users can read own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own generations"
  on public.generations for delete
  using (auth.uid() = user_id);

create policy "Admins can read all generations"
  on public.generations for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create index idx_generations_user_id on public.generations(user_id);
create index idx_generations_created_at on public.generations(created_at desc);
create index idx_generations_status on public.generations(status);

-- 3. Generation events (PDF export, copy, view tracking)
create table if not exists public.generation_events (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('view', 'pdf_export', 'copy')),
  created_at timestamptz not null default now()
);

alter table public.generation_events enable row level security;

create policy "Users can read own events"
  on public.generation_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own events"
  on public.generation_events for insert
  with check (auth.uid() = user_id);

create policy "Admins can read all events"
  on public.generation_events for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create index idx_generation_events_user on public.generation_events(user_id);

-- 4. Auto-create profile on signup trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Add user_id column to existing user_activities table (nullable for old data)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'user_activities' and table_schema = 'public') then
    if not exists (select 1 from information_schema.columns where table_name = 'user_activities' and column_name = 'user_id' and table_schema = 'public') then
      alter table public.user_activities add column user_id uuid references public.profiles(id) on delete set null;
    end if;
  end if;
end $$;

-- 6. Admin view for generation stats (used by admin dashboard)
create or replace view public.admin_generation_stats as
select
  count(*) as total_generations,
  count(*) filter (where status = 'success') as total_success,
  count(*) filter (where status = 'error') as total_error,
  count(*) filter (where created_at > now() - interval '1 day') as today_generations,
  count(distinct user_id) as total_users_generated,
  round(
    count(*) filter (where status = 'success')::numeric / nullif(count(*), 0) * 100, 1
  ) as success_rate
from public.generations;

-- Only admins can read this view
-- (RLS on generations already handles access; this view is for convenience)
