import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && serviceRoleKey) {
  supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
} else {
  console.warn("Supabase is not configured. Activity logging is disabled.");
}

export type ActivityStatus =
  | "SUCCESS"
  | "ERROR_NO_CONTEXT"
  | "ERROR_TIMEOUT"
  | "RATE_LIMITED"
  | "ERROR_GEMINI"
  | "ERROR_VALIDATION"
  | "ERROR_INTERNAL";

export interface ActivityLog {
  nama: string;
  nis: string;
  kelas: string;
  laboratorium: string;
  judul_analisis: string;
  kedalaman_teori: string;
  ip_address: string;
  status: ActivityStatus;
}

/**
 * Simpan log aktivitas. Fungsi tidak melempar error ke caller agar logging
 * tidak pernah memblokir respons utama.
 */
export async function logActivity(data: ActivityLog): Promise<void> {
  if (!supabase) return;

  try {
    const { error } = await supabase.from("user_activities").insert(data);
    if (error) console.error("Supabase logging failed:", error.message);
  } catch (error) {
    console.error("Supabase logging exception:", error);
  }
}
