import type { Generation } from "@/lib/supabase/types";

export type EffectiveStatus = "success" | "error" | "pending";

export const STALE_PENDING_MS = 5 * 60 * 1000;

export function getEffectiveStatus(
  generation: Pick<Generation, "status" | "created_at">,
  now: number = Date.now()
): EffectiveStatus {
  if (generation.status === "success") return "success";
  if (generation.status === "error") return "error";
  const age = now - new Date(generation.created_at).getTime();
  return age > STALE_PENDING_MS ? "error" : "pending";
}
