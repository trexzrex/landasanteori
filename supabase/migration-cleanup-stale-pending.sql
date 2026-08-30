-- Cleanup + guard untuk row generations yang stuck di status 'pending'.
--
-- Konteks: sebelum policy "Users can update own generations" terpasang,
-- proses generate gagal meng-update status dari 'pending' ke 'success'/'error',
-- sehingga banyak row stuck 'pending'. Dengan aturan kuota baru (menghitung
-- semua row non-error), row pending basi ini keliru memakan slot kuota harian.
--
-- Jalankan sekali di Supabase SQL Editor.

-- 1. Tandai semua row 'pending' yang lebih tua dari 15 menit sebagai 'error'.
--    Row seusia itu pasti bukan proses yang masih berjalan (maxDuration 300s).
update public.generations
set
  status = 'error',
  error_message = coalesce(error_message, 'Proses tidak selesai (dibersihkan otomatis: pending basi).')
where status = 'pending'
  and created_at < now() - interval '15 minutes';

-- 2. Fungsi housekeeping opsional untuk dipanggil berkala (mis. via cron/pg_cron).
create or replace function public.expire_stale_pending_generations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  update public.generations
  set
    status = 'error',
    error_message = coalesce(error_message, 'Proses tidak selesai (kadaluarsa).')
  where status = 'pending'
    and created_at < now() - interval '15 minutes';

  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- 3. Verifikasi hasil.
select status, count(*) as jumlah
from public.generations
group by status
order by status;
