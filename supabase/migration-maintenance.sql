-- Run before deploying the maintenance feature. Does not enable maintenance.
begin;

create table if not exists public.maintenance_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  message text not null default 'LanterGenerator sedang dalam pemeliharaan. Silakan kembali beberapa saat lagi.'
    check (char_length(btrim(message)) between 3 and 1000),
  updated_at timestamptz not null default now()
);

insert into public.maintenance_settings (id) values (1) on conflict (id) do nothing;
alter table public.maintenance_settings enable row level security;
revoke all on public.maintenance_settings from anon, authenticated;
grant select, update on public.maintenance_settings to authenticated;

drop policy if exists "Authenticated users read maintenance" on public.maintenance_settings;
create policy "Authenticated users read maintenance"
  on public.maintenance_settings for select to authenticated using (true);
drop policy if exists "Admins update maintenance" on public.maintenance_settings;
create policy "Admins update maintenance"
  on public.maintenance_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.stamp_maintenance_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
drop trigger if exists stamp_maintenance_update on public.maintenance_settings;
create trigger stamp_maintenance_update before update on public.maintenance_settings
  for each row execute function public.stamp_maintenance_update();

-- Restrictive policies also protect direct Supabase calls from already-open tabs.
-- Existing ownership/admin policies remain in force; this adds a maintenance gate.
create or replace function public.can_use_application()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or coalesce(
    (select not enabled from public.maintenance_settings where id = 1), false
  );
$$;
revoke all on function public.can_use_application() from public;
grant execute on function public.can_use_application() to authenticated;

drop policy if exists "Maintenance access gate" on public.generations;
create policy "Maintenance access gate" on public.generations
  as restrictive for all to authenticated
  using (public.can_use_application()) with check (public.can_use_application());
drop policy if exists "Maintenance access gate" on public.generation_events;
create policy "Maintenance access gate" on public.generation_events
  as restrictive for all to authenticated
  using (public.can_use_application()) with check (public.can_use_application());

commit;
