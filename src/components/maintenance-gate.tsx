"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, LogOut, RefreshCw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMaintenanceAccess, isMaintenanceProtectedPath, type MaintenanceState } from "@/lib/maintenance-policy";

type Status = MaintenanceState & { isAdmin: boolean; userId: string };

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const guarded = isMaintenanceProtectedPath(pathname) || pathname === "/maintenance";
  const [status, setStatus] = React.useState<Status | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [dismissedVersion, setDismissedVersion] = React.useState<string | null>(null);
  const requestId = React.useRef(0);

  const check = React.useCallback(async () => {
    const id = ++requestId.current;
    setChecking(true);
    try {
      const response = await fetch("/api/maintenance", { cache: "no-store" });
      if (id !== requestId.current) return;
      if (response.status === 401) {
        setStatus(null);
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error("Status layanan tidak tersedia");
      const next: Status = await response.json();
      if (id !== requestId.current) return;
      setStatus(next);
      setFailed(false);
      if (pathname === "/maintenance" && getMaintenanceAccess(next, next.isAdmin ? "admin" : "user") !== "blocked") {
        router.replace("/dashboard");
        router.refresh();
      }
    } catch {
      if (id === requestId.current) setFailed(true);
    } finally {
      if (id === requestId.current) setChecking(false);
    }
  }, [pathname, router]);

  React.useEffect(() => {
    if (!guarded) return;
    const initial = window.setTimeout(() => void check(), 0);
    const requests = requestId;
    const timer = window.setInterval(() => void check(), 15000);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    window.addEventListener("maintenance-updated", onFocus);
    return () => {
      requests.current++;
      window.clearTimeout(initial);
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("maintenance-updated", onFocus);
    };
  }, [guarded, check]);

  if (!guarded) return children;
  if (!status && !failed) {
    return <main id="main-content" className="flex min-h-screen items-center justify-center gap-3 px-6" role="status"><Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" /><span>Memeriksa status layanan...</span></main>;
  }

  const admin = status?.isAdmin === true;
  const blocked = !admin && (failed || !status || getMaintenanceAccess(status, "user") === "blocked");
  const message = failed ? "Status layanan belum dapat diperiksa. Periksa koneksi Anda lalu coba lagi." : status?.message;
  if (blocked || (pathname === "/maintenance" && !admin)) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
        <section className="w-full max-w-lg space-y-6 text-center" aria-labelledby="maintenance-title">
          <Wrench className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
          <div className="space-y-3">
            <h1 id="maintenance-title" className="text-2xl font-bold sm:text-3xl">{failed || !status?.available ? "Layanan belum tersedia" : "Kami sedang melakukan pemeliharaan"}</h1>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground" role="status">{message}</p>
            <p className="text-sm text-muted-foreground">Akun dan riwayat Anda tetap tersimpan. Akses akan dibuka kembali setelah pemeliharaan selesai.</p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => void check()} disabled={checking}><RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} aria-hidden="true" />{checking ? "Memeriksa..." : "Periksa Lagi"}</Button>
            <form action="/auth/signout" method="post"><Button type="submit" variant="outline" className="w-full"><LogOut className="h-4 w-4" aria-hidden="true" />Keluar</Button></form>
          </div>
          <p className="text-xs text-muted-foreground">LanterGenerator · Status diperiksa otomatis setiap 15 detik.</p>
        </section>
      </main>
    );
  }

  const warning = admin && (status?.enabled || !status?.available || failed);
  const version = `${status?.userId}:${status?.updated_at}:${failed ? "offline" : status?.available}`;
  return (
    <>
      {warning && <div role="status" className="flex flex-wrap items-center justify-center gap-2 border-b border-border bg-secondary px-4 py-2 text-center text-sm text-secondary-foreground"><Wrench className="h-4 w-4" aria-hidden="true" />{failed || !status?.available ? "Status maintenance tidak tersedia — akses admin" : "Maintenance aktif — akses admin"}<button type="button" onClick={() => setDismissedVersion(null)} className="rounded underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Lihat pemberitahuan</button></div>}
      {children}
      <Dialog.Root open={Boolean(warning && dismissedVersion !== version)} onOpenChange={(open) => { if (!open) setDismissedVersion(version); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[85dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-card p-6 text-card-foreground shadow-xl focus:outline-none">
            <Wrench className="mb-4 h-8 w-8 text-primary" aria-hidden="true" />
            <Dialog.Title className="text-xl font-semibold">{status?.enabled ? "Mode maintenance sedang aktif" : "Status layanan belum dapat diperiksa"}</Dialog.Title>
            <Dialog.Description className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{message} Anda masuk sebagai admin, sehingga tetap dapat mengakses dan mencoba seluruh fitur.</Dialog.Description>
            <Dialog.Close asChild><Button className="mt-6 w-full">Lanjutkan sebagai admin</Button></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
