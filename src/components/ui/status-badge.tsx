import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "success" | "error" | "pending";

const labels: Record<Status, string> = {
  success: "Berhasil",
  error: "Gagal",
  pending: "Diproses",
};

const icons = { success: CheckCircle2, error: XCircle, pending: Clock3 };

export function StatusBadge({ status, className, children }: { status: Status; className?: string; children?: React.ReactNode }) {
  const Icon = icons[status];
  const tone =
    status === "success"
      ? "bg-success-surface text-success"
      : status === "error"
        ? "bg-destructive/10 text-destructive"
        : "bg-warning-surface text-warning";

  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", tone, className)}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{children ?? labels[status]}</span>;
}
