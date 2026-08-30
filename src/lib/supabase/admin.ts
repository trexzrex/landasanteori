import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let adminClient: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient | null {
  if (adminClient) return adminClient;

  if (supabaseUrl && serviceRoleKey) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return adminClient;
  }

  console.warn("SUPABASE_SERVICE_ROLE_KEY is not configured. Admin DB updates will be skipped.");
  return null;
}
