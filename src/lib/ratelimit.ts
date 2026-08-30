import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Hanya inisialisasi jika environment variables tersedia (mencegah build crash)
const isConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
let loginIpLimiter: Ratelimit | null = null;
let loginIdentifierLimiter: Ratelimit | null = null;
let lookupLimiter: Ratelimit | null = null;

if (isConfigured) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  // Catatan: limit generate per-IP dihapus. Pembatasan pemakaian generator
  // sekarang murni per-akun lewat kuota harian di src/lib/quota.ts.

  // Anti brute-force login: per IP (menahan penyerang dari satu sumber)
  loginIpLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 m"),
    analytics: true,
    prefix: "rl_login_ip",
  });

  // Anti credential-stuffing: per identifier (menahan serangan terdistribusi
  // yang menyasar satu akun tertentu dari banyak IP)
  loginIdentifierLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
    prefix: "rl_login_id",
  });

  // Anti user-enumeration pada pencarian username
  lookupLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "10 m"),
    analytics: true,
    prefix: "rl_lookup",
  });
} else {
  console.warn("Upstash Redis is not configured. Rate limiting is disabled.");
}

export interface LoginThrottleResult {
  success: boolean;
  retryAfterSeconds: number;
}

/**
 * Batasi percobaan login: gabungan kuota per IP dan per identifier.
 * Fail-closed untuk jalur autentikasi: bila Redis error, tolak percobaan
 * agar brute-force tidak mendapat celah saat infrastruktur bermasalah.
 */
export async function checkLoginAttempt(
  ip: string,
  identifier: string
): Promise<LoginThrottleResult> {
  if (!loginIpLimiter || !loginIdentifierLimiter) {
    return { success: true, retryAfterSeconds: 0 };
  }

  const normalizedId = identifier.trim().toLowerCase().slice(0, 190);

  try {
    const [ipResult, idResult] = await Promise.all([
      loginIpLimiter.limit(ip),
      loginIdentifierLimiter.limit(normalizedId),
    ]);

    if (ipResult.success && idResult.success) {
      return { success: true, retryAfterSeconds: 0 };
    }

    const reset = Math.max(ipResult.success ? 0 : ipResult.reset, idResult.success ? 0 : idResult.reset);
    const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { success: false, retryAfterSeconds };
  } catch (error) {
    console.error("Login throttle check failed:", error);
    return { success: false, retryAfterSeconds: 60 };
  }
}

/** Batasi pencarian username agar tidak dipakai untuk enumerasi akun. */
export async function checkLookupAttempt(ip: string): Promise<boolean> {
  if (!lookupLimiter) return true;
  try {
    const { success } = await lookupLimiter.limit(ip);
    return success;
  } catch (error) {
    console.error("Lookup throttle check failed:", error);
    return false;
  }
}
