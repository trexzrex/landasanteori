create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can read all generations" on public.generations;
drop policy if exists "Admins can read all events" on public.generation_events;

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can update own generations"
  on public.generations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can read all generations"
  on public.generations for select
  using (public.is_admin());

create policy "Admins can read all events"
  on public.generation_events for select
  using (public.is_admin());

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

create table if not exists public.user_quota (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  daily_used int not null default 0,
  daily_limit int not null default 5,
  total_used int not null default 0,
  reset_date text not null default '',
  created_at timestamptz not null default now()
);

alter table public.user_quota enable row level security;

drop policy if exists "Users can read own quota" on public.user_quota;
drop policy if exists "Admins can read all quotas" on public.user_quota;
drop policy if exists "Admins can update all quotas" on public.user_quota;

create policy "Users can read own quota"
  on public.user_quota for select
  using (auth.uid() = user_id);

create policy "Admins can read all quotas"
  on public.user_quota for select
  using (public.is_admin());

create policy "Admins can update all quotas"
  on public.user_quota for update
  using (public.is_admin())
  with check (public.is_admin());

insert into public.user_quota (user_id, reset_date)
select id, '' from public.profiles
on conflict (user_id) do nothing;

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
  insert into public.user_quota (user_id, reset_date)
  values (new.id, '');
  return new;
end;
$$;
