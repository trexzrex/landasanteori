alter table public.profiles
  add column if not exists username text,
  add column if not exists password_set boolean not null default false;

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,30}$');

create or replace function public.get_email_by_username(input_username text)
returns text
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  account_email text;
begin
  select email into account_email
  from public.profiles
  where lower(username) = lower(input_username)
  limit 1;

  return account_email;
end;
$$;

revoke all on function public.get_email_by_username(text) from public;
grant execute on function public.get_email_by_username(text) to anon, authenticated;
