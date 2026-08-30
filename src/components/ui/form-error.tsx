import * as React from "react";
import { cn } from "@/lib/utils";

export function FormError({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  if (!children) return null;

  return (
    <div role="alert" className={cn("rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive", className)}>
      {children}
    </div>
  );
}
