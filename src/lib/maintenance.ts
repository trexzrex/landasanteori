import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_MAINTENANCE_MESSAGE, type MaintenanceState } from "@/lib/maintenance-policy";

// No process cache: a maintenance change must affect the next server request.
export async function readMaintenanceState(db: SupabaseClient): Promise<MaintenanceState> {
  try {
    const { data, error } = await db.from("maintenance_settings")
      .select("enabled, message, updated_at").eq("id", 1).single();
    if (error || !data || typeof data.enabled !== "boolean") throw error ?? new Error("Maintenance settings missing");
    return {
      enabled: data.enabled,
      message: data.message || DEFAULT_MAINTENANCE_MESSAGE,
      updated_at: data.updated_at,
      available: true,
    };
  } catch (error) {
    console.error("Maintenance settings unavailable:", error);
    return {
      enabled: false,
      message: "Status layanan belum dapat diperiksa. Silakan coba lagi beberapa saat.",
      updated_at: null,
      available: false,
    };
  }
}
