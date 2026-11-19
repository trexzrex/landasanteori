export const DEFAULT_MAINTENANCE_MESSAGE = "LanterGenerator sedang dalam pemeliharaan. Silakan kembali beberapa saat lagi.";

export interface MaintenanceState {
  enabled: boolean;
  message: string;
  updated_at: string | null;
  available: boolean;
}

export function getMaintenanceAccess(
  state: Pick<MaintenanceState, "enabled" | "available">,
  role: string | null | undefined
): "allowed" | "blocked" | "admin" {
  if (role === "admin") return state.enabled || !state.available ? "admin" : "allowed";
  return !state.available || state.enabled ? "blocked" : "allowed";
}

export function isMaintenanceProtectedPath(path: string): boolean {
  return ["/dashboard", "/generate", "/result", "/onboarding", "/admin"].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}
