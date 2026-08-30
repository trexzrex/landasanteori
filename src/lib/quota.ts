/**
 * quota.ts
 *
 * Modul pengelolaan kuota harian pengguna.
 * - Limit default: 5 generasi per hari per akun.
 * - Dihitung dari data generasi berstatus NON-error (pending + success) hari ini
 *   di database, sehingga row yang masih diproses juga memakan slot kuota.
 * - Auto-reset otomatis mengikuti pergantian hari zona waktu WIB (UTC+7).
 * - Fail-closed: bila pemeriksaan kuota gagal, generator menolak permintaan
 *   alih-alih meloloskan.
 */

import { getAdminSupabase } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_DAILY_LIMIT = 5;

/** Mendapatkan tanggal hari ini format YYYY-MM-DD (WIB / UTC+7) */
export function getTodayDateString(): string {
  const now = new Date();
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wibTime.toISOString().slice(0, 10);
}

/** Mendapatkan ISO timestamp awal hari ini 00:00:00 WIB */
export function getStartOfTodayWibIso(): string {
  const now = new Date();
  const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const year = wibNow.getUTCFullYear();
  const month = wibNow.getUTCMonth();
  const day = wibNow.getUTCDate();

  // 00:00:00 WIB = 17:00:00 UTC hari sebelumnya (UTC - 7 jam)
  const utcTimestamp = Date.UTC(year, month, day) - 7 * 60 * 60 * 1000;
  return new Date(utcTimestamp).toISOString();
}

export interface QuotaCheckResult {
  allowed: boolean;
  daily_used: number;
  daily_limit: number;
  remaining: number;
  reset_date: string;
}

function buildResult(used: number, limit: number): QuotaCheckResult {
  const remaining = Math.max(0, limit - used);
  return {
    allowed: remaining > 0,
    daily_used: used,
    daily_limit: limit,
    remaining,
    reset_date: getTodayDateString(),
  };
}

function buildQuotaUnavailable(): QuotaCheckResult {
  return {
    allowed: false,
    daily_used: 0,
    daily_limit: DEFAULT_DAILY_LIMIT,
    remaining: 0,
    reset_date: getTodayDateString(),
  };
}

/** Pilih client DB: admin client kalau ada, kalau tidak fallback ke client sesi server. */
async function resolveQuotaDb(userId: string): Promise<SupabaseClient | null> {
  const admin = getAdminSupabase();
  if (admin) return admin;
  try {
    const server = await createServerClient();
    // Pastikan sesi masih valid sebelum dipakai menghitung kuota.
    const {
      data: { user },
    } = await server.auth.getUser();
    if (user?.id !== userId) return null;
    return server;
  } catch (err) {
    console.error("Failed to resolve quota db client:", err);
    return null;
  }
}

/**
 * Periksa kuota harian pengguna dari tabel generations.
 * Menghitung row pending + success (non-error) hari ini.
 *
 * `excludeGenerationId` dipakai saat pemanggil sudah menyisipkan row reservasi
 * berstatus 'pending' untuk permintaan yang sedang berjalan. Tanpa pengecualian
 * ini, row tersebut ikut terhitung dan limit efektif berkurang satu.
 *
 * Fail-closed: error/exception menghasilkan allowed: false.
 */
export async function checkUserQuota(
  userId: string,
  excludeGenerationId?: string | null
): Promise<QuotaCheckResult> {
  const db = await resolveQuotaDb(userId);
  const startOfTodayIso = getStartOfTodayWibIso();

  if (!db) {
    console.error("Quota check unavailable: no usable Supabase client.");
    return buildQuotaUnavailable();
  }

  try {
    let query = db
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "error")
      .gte("created_at", startOfTodayIso);

    if (excludeGenerationId) {
      query = query.neq("id", excludeGenerationId);
    }

    const { count, error } = await query;

    if (error) {
      console.error("Error checking user quota from generations:", error.message);
      return buildQuotaUnavailable();
    }

    return buildResult(count ?? 0, DEFAULT_DAILY_LIMIT);
  } catch (err) {
    console.error("Exception checking user quota:", err);
    return buildQuotaUnavailable();
  }
}

/**
 * Konsumsi kuota terjadi otomatis saat baris generasi disimpan
 * (pending maupun success) karena perhitungan memakai status non-error.
 */
export async function consumeUserQuota(_userId: string): Promise<void> {
  // No-op: row generasi otomatis terhitung sebagai pemakaian.
  return Promise.resolve();
}
